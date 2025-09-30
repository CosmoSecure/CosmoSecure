use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct GitHubRelease {
    pub tag_name: String,
    pub name: String,
    pub body: String,
    pub published_at: String,
    pub prerelease: bool,
    pub assets: Vec<GitHubAsset>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitHubAsset {
    pub name: String,
    pub size: u64,
    pub browser_download_url: String,
    pub content_type: String,
    pub digest: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateRelease {
    pub version: String,
    pub name: String,
    pub body: String,
    pub download_url: String,
    pub published_at: String,
    pub size: Option<u64>,
    pub is_prerelease: bool,
    pub sha256_digest: Option<String>,
}
