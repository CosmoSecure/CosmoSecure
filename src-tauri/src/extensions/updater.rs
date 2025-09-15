use crate::extensions::schema::updater_data::{GitHubAsset, GitHubRelease, UpdateRelease};
use anyhow::{anyhow, Result};
use reqwest::Client;
use semver::Version;
use sha2::{Digest, Sha256};
use std::env;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tauri::{command, AppHandle, Runtime};
use tempfile::TempDir;

// const GITHUB_REPO: &str = "akash2061/CosmoSecure";
const GITHUB_RELEASES_URL: &str = "https://api.github.com/repos/akash2061/NoteBook-App/releases";

/// Check for updates by comparing current version with latest GitHub release
#[command]
pub async fn check_for_updates(current_version: String) -> Result<Option<UpdateRelease>, String> {
    match check_for_updates_internal(&current_version).await {
        Ok(update) => Ok(update),
        Err(e) => {
            eprintln!("Error checking for updates: {}", e);
            Err(format!("Failed to check for updates: {}", e))
        }
    }
}

async fn check_for_updates_internal(current_version: &str) -> Result<Option<UpdateRelease>> {
    let client = Client::new();

    // Get latest release from GitHub API
    let response = client
        .get(GITHUB_RELEASES_URL)
        .header("User-Agent", "CosmoSecure-App")
        .send()
        .await?;

    let releases: Vec<GitHubRelease> = response.json().await?;

    // Find the latest non-prerelease version
    let latest_release = releases
        .into_iter()
        .find(|r| !r.prerelease)
        .ok_or_else(|| anyhow!("No stable releases found"))?;

    // Parse versions for comparison
    let current_ver = Version::parse(&clean_version(current_version))?;
    let latest_ver = Version::parse(&clean_version(&latest_release.tag_name))?;

    // Check if update is available
    if latest_ver > current_ver {
        // Log available assets for debugging
        println!("Available assets for release {}:", latest_release.tag_name);
        for asset in &latest_release.assets {
            println!("  - {}", asset.name);
        }

        // Check if there's a compatible package for current OS before showing update
        match find_compatible_asset(&latest_release.assets) {
            Ok(asset) => {
                println!("Found compatible asset: {}", asset.name);

                let update_release = UpdateRelease {
                    version: latest_release.tag_name,
                    name: latest_release.name,
                    body: latest_release.body,
                    download_url: asset.browser_download_url.clone(),
                    published_at: latest_release.published_at,
                    size: Some(asset.size),
                    is_prerelease: latest_release.prerelease,
                    sha256_digest: asset.digest.clone(),
                };

                Ok(Some(update_release))
            }
            Err(e) => {
                println!("No compatible package found for current OS: {}", e);
                // Return None instead of error to indicate no update available for this platform
                Ok(None)
            }
        }
    } else {
        Ok(None)
    }
}

/// Download and install update
#[command]
pub async fn download_and_install_update(
    app_handle: AppHandle,
    download_url: String,
    version: String,
    sha256_digest: Option<String>,
) -> Result<(), String> {
    match download_and_install_internal(
        app_handle,
        &download_url,
        &version,
        sha256_digest.as_deref(),
    )
    .await
    {
        Ok(_) => Ok(()),
        Err(e) => {
            eprintln!("Error downloading/installing update: {}", e);
            Err(format!("Failed to install update: {}", e))
        }
    }
}

async fn download_and_install_internal<R: Runtime>(
    app_handle: AppHandle<R>,
    download_url: &str,
    _version: &str,
    sha256_digest: Option<&str>,
) -> Result<()> {
    #[cfg(target_os = "windows")]
    {
        // On Windows, just open the GitHub release page for manual download
        println!("Opening GitHub release page for manual download on Windows...");

        // Construct GitHub release URL
        let repo_url = GITHUB_RELEASES_URL
            .trim_end_matches("/releases")
            .replace("api.github.com/repos/", "github.com/");
        let release_url = format!("{}/releases", repo_url);

        // Open URL using the opener plugin directly
        use tauri_plugin_opener::OpenerExt;
        app_handle
            .opener()
            .open_url(release_url, None::<&str>)
            .map_err(|e| anyhow!("Failed to open URL: {}", e))?;

        println!("Please download and install the update manually from the opened page.");
        return Ok(());
    }

    #[cfg(target_os = "linux")]
    {
        use futures_util::StreamExt;
        use std::io::Write;

        let client = Client::new();

        // Create temporary directory
        let temp_dir = TempDir::new()?;

        // Extract filename from URL
        let filename = download_url
            .split('/')
            .last()
            .ok_or_else(|| anyhow!("Invalid download URL"))?;

        let file_path = temp_dir.path().join(filename);

        // Start download with progress tracking
        let response = client.get(download_url).send().await?;
        let total_size = response.content_length().unwrap_or(0);

        println!("Starting download of {} bytes", total_size);

        let mut file = std::fs::File::create(&file_path)?;
        let mut downloaded = 0u64;
        let mut stream = response.bytes_stream();

        while let Some(chunk) = stream.next().await {
            let chunk = chunk?;
            file.write_all(&chunk)?;
            downloaded += chunk.len() as u64;

            if total_size > 0 {
                let progress = (downloaded * 100 / total_size) as u32;
                println!("Download progress: {}%", progress);

                // Emit progress event (you can implement this later with Tauri events)
                // app_handle.emit_all("download_progress", progress).ok();
            }
        }

        file.flush()?;
        println!("Download completed successfully");

        // Verify SHA256 checksum if provided
        if let Some(expected_digest) = sha256_digest {
            println!("Verifying SHA256 checksum...");
            match verify_sha256_checksum(&file_path, expected_digest) {
                Ok(true) => {
                    println!("✓ SHA256 checksum verification passed");
                }
                Ok(false) => {
                    return Err(anyhow!("SHA256 checksum verification failed! The downloaded file may be corrupted or tampered with."));
                }
                Err(e) => {
                    println!("Warning: Could not verify SHA256 checksum: {}", e);
                    println!("Proceeding with installation anyway...");
                }
            }
        } else {
            println!("No SHA256 checksum provided for verification");
        }

        // Install based on platform
        install_update(&file_path, &app_handle).await?;
    }

    // Removed macOS support completely as requested

    Ok(())
}

async fn install_update<R: Runtime>(file_path: &PathBuf, app_handle: &AppHandle<R>) -> Result<()> {
    #[cfg(target_os = "windows")]
    {
        // On Windows, open the GitHub release page for manual download
        println!("Opening GitHub release page for manual download on Windows...");

        // Construct GitHub release URL
        let repo_url = GITHUB_RELEASES_URL
            .trim_end_matches("/releases")
            .replace("api.github.com/repos/", "github.com/");
        let release_url = format!("{}/releases", repo_url);

        // Open URL using the opener plugin directly
        use tauri_plugin_opener::OpenerExt;
        app_handle
            .opener()
            .open_url(release_url, None::<&str>)
            .map_err(|e| anyhow!("Failed to open URL: {}", e))?;

        // Show message to user
        println!("Please download and install the update manually from the opened page.");

        // Don't exit the app, let user handle the update manually
        return Ok(());
    }

    #[cfg(target_os = "linux")]
    {
        println!("Installing update on Linux...");

        // On Linux, this could be a .deb, .AppImage, etc.
        if file_path.extension().and_then(|s| s.to_str()) == Some("deb") {
            // For .deb files, try different approaches
            println!("Installing .deb package...");

            // First try with pkexec (GUI sudo)
            let result = Command::new("pkexec")
                .args(&["dpkg", "-i"])
                .arg(file_path)
                .output();

            match result {
                Ok(output) => {
                    if output.status.success() {
                        println!("Package installed successfully with pkexec");
                    } else {
                        println!("pkexec failed, trying alternative methods...");
                        // Try with gksu if available
                        let gksu_result = Command::new("gksu")
                            .args(&["dpkg", "-i"])
                            .arg(file_path)
                            .output();

                        if gksu_result.is_err() {
                            return Err(anyhow!(
                                "Failed to install package. Please install manually."
                            ));
                        }
                    }
                }
                Err(_) => {
                    println!("GUI sudo not available, requiring manual installation");
                    return Err(anyhow!("Automatic installation requires GUI sudo. Please install the downloaded package manually."));
                }
            }
        } else if file_path.extension().and_then(|s| s.to_str()) == Some("AppImage") {
            // For AppImage files, replace current executable
            println!("Installing AppImage...");
            let current_exe = env::current_exe()?;
            fs::copy(file_path, &current_exe)?;

            // Make executable
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let mut perms = fs::metadata(&current_exe)?.permissions();
                perms.set_mode(0o755);
                fs::set_permissions(&current_exe, perms)?;
            }
        }

        // Give some time for installation to complete before restarting
        tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
        restart_app(app_handle).await?;
    }

    // Removed macOS support completely as requested

    Ok(())
}

async fn restart_app<R: Runtime>(_app_handle: &AppHandle<R>) -> Result<()> {
    println!("Preparing to restart application...");

    // Give user time to see the completion message
    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;

    // Use Tauri's built-in restart method
    println!("Restarting application...");
    Command::new("sh")
        .arg("-c")
        .arg("npm run tauri dev")
        .spawn()
        .expect("Failed to restart application");
    std::process::exit(0);

    // app_handle.restart();
}

fn find_compatible_asset(assets: &[GitHubAsset]) -> Result<&GitHubAsset> {
    let platform_identifiers = get_platform_identifiers();

    // First, try to find an exact match with platform identifiers
    for identifier in &platform_identifiers {
        if let Some(asset) = assets
            .iter()
            .find(|asset| asset.name.to_lowercase().contains(identifier))
        {
            println!(
                "Found exact platform match: {} ({})",
                asset.name, identifier
            );
            return Ok(asset);
        }
    }

    // Then try fallback patterns, but be more strict about OS compatibility
    let fallback_patterns = get_fallback_patterns();
    for pattern in &fallback_patterns {
        if let Some(asset) = assets
            .iter()
            .find(|asset| asset.name.to_lowercase().contains(pattern))
        {
            // Additional validation: ensure the asset is actually for the current OS
            if is_asset_compatible_with_current_os(&asset.name) {
                println!("Found compatible fallback: {} ({})", asset.name, pattern);
                return Ok(asset);
            }
        }
    }

    // If no compatible asset found, return error
    Err(anyhow!(
        "No compatible package found for current operating system"
    ))
}

fn is_asset_compatible_with_current_os(asset_name: &str) -> bool {
    let asset_lower = asset_name.to_lowercase();

    #[cfg(target_os = "windows")]
    {
        // For Windows, look for Windows-specific indicators and avoid Linux/Mac indicators
        let windows_indicators = ["windows", "win", ".exe", ".msi", "setup"];
        let non_windows_indicators = ["linux", "mac", "darwin", "deb", "appimage", "dmg", "pkg"];

        let has_windows_indicator = windows_indicators
            .iter()
            .any(|&indicator| asset_lower.contains(indicator));
        let has_non_windows_indicator = non_windows_indicators
            .iter()
            .any(|&indicator| asset_lower.contains(indicator));

        has_windows_indicator && !has_non_windows_indicator
    }

    #[cfg(target_os = "linux")]
    {
        // For Linux, look for Linux-specific indicators and avoid Windows/Mac indicators
        let linux_indicators = ["linux", "deb", "appimage", "tar.gz", "tar.xz"];
        let non_linux_indicators = [
            "windows", "win", "mac", "darwin", "dmg", "pkg", ".exe", ".msi",
        ];

        let has_linux_indicator = linux_indicators
            .iter()
            .any(|&indicator| asset_lower.contains(indicator));
        let has_non_linux_indicator = non_linux_indicators
            .iter()
            .any(|&indicator| asset_lower.contains(indicator));

        has_linux_indicator && !has_non_linux_indicator
    }

    // Removed macOS support completely as requested
}

fn get_platform_identifiers() -> Vec<String> {
    let mut identifiers = Vec::new();

    #[cfg(target_os = "windows")]
    {
        if cfg!(target_arch = "x86_64") {
            identifiers.extend_from_slice(&[
                "windows-x64".to_string(),
                "win64".to_string(),
                "x64.msi".to_string(),
                "x64.exe".to_string(),
                "windows_x64".to_string(),
                "win-x64".to_string(),
            ]);
        } else {
            identifiers.extend_from_slice(&[
                "windows".to_string(),
                "win32".to_string(),
                "x86.msi".to_string(),
                "x86.exe".to_string(),
            ]);
        }
    }

    #[cfg(target_os = "linux")]
    {
        if cfg!(target_arch = "x86_64") {
            identifiers.extend_from_slice(&[
                "linux-x64".to_string(),
                "linux_x64".to_string(),
                "linux-amd64".to_string(),
                "x86_64.deb".to_string(),
                "x86_64.AppImage".to_string(),
                "x86_64.tar.gz".to_string(),
                "amd64.deb".to_string(),
                "linux".to_string(),
            ]);
        } else if cfg!(target_arch = "aarch64") {
            identifiers.extend_from_slice(&[
                "linux-arm64".to_string(),
                "linux_arm64".to_string(),
                "aarch64".to_string(),
                "arm64.deb".to_string(),
                "arm64.AppImage".to_string(),
            ]);
        } else {
            identifiers.push("linux".to_string());
        }
    }

    // Removed macOS support completely as requested

    identifiers
}

fn get_fallback_patterns() -> Vec<String> {
    let mut patterns = Vec::new();

    #[cfg(target_os = "windows")]
    {
        patterns.extend_from_slice(&[
            ".msi".to_string(),
            ".exe".to_string(),
            "setup".to_string(),
            "installer".to_string(),
        ]);
    }

    #[cfg(target_os = "linux")]
    {
        patterns.extend_from_slice(&[
            ".deb".to_string(),
            ".AppImage".to_string(),
            ".tar.gz".to_string(),
            ".tar.xz".to_string(),
            "linux".to_string(),
        ]);
    }

    // Removed macOS support completely as requested

    patterns
}

fn clean_version(version: &str) -> String {
    // Remove 'v' prefix if present
    version.trim_start_matches('v').to_string()
}

/// Get information about a specific release
#[command]
pub async fn get_release_info(version: String) -> Result<Option<UpdateRelease>, String> {
    match get_release_info_internal(&version).await {
        Ok(release) => Ok(release),
        Err(e) => {
            eprintln!("Error getting release info: {}", e);
            Err(format!("Failed to get release info: {}", e))
        }
    }
}

async fn get_release_info_internal(version: &str) -> Result<Option<UpdateRelease>> {
    let client = Client::new();
    let url = format!(
        "{}/tags/{}",
        GITHUB_RELEASES_URL.trim_end_matches("/releases"),
        version
    );

    let response = client
        .get(&url)
        .header("User-Agent", "CosmoSecure-App")
        .send()
        .await?;

    if response.status().is_success() {
        let release: GitHubRelease = response.json().await?;

        // Use compatible asset check here too
        let asset = find_compatible_asset(&release.assets)?;

        let update_release = UpdateRelease {
            version: release.tag_name,
            name: release.name,
            body: release.body,
            download_url: asset.browser_download_url.clone(),
            published_at: release.published_at,
            size: Some(asset.size),
            is_prerelease: release.prerelease,
            sha256_digest: asset.digest.clone(),
        };

        Ok(Some(update_release))
    } else {
        Ok(None)
    }
}

/// Force check for updates (manual trigger)
#[command]
pub async fn force_check_updates(current_version: String) -> Result<Option<UpdateRelease>, String> {
    check_for_updates(current_version).await
}

/// Verify SHA256 checksum of a downloaded file
fn verify_sha256_checksum(file_path: &PathBuf, expected_digest: &str) -> Result<bool> {
    // Extract just the hash from the digest (remove "sha256:" prefix if present)
    let expected_hash = expected_digest
        .strip_prefix("sha256:")
        .unwrap_or(expected_digest)
        .to_lowercase();

    // Read the file and compute SHA256
    let file_contents = fs::read(file_path)?;
    let mut hasher = Sha256::new();
    hasher.update(&file_contents);
    let computed_hash = format!("{:x}", hasher.finalize());

    println!("Expected SHA256: {}", expected_hash);
    println!("Computed SHA256: {}", computed_hash);

    Ok(computed_hash == expected_hash)
}

/// Get platform information for debugging
#[command]
pub fn get_platform_info() -> String {
    let identifiers = get_platform_identifiers();
    let fallback_patterns = get_fallback_patterns();

    format!(
        "Platform identifiers: {:?}\nFallback patterns: {:?}",
        identifiers, fallback_patterns
    )
}
