/// Centralized URL Configuration for Rust Backend (src-tauri)
/// All external URLs and API endpoints should be defined here

/// GitHub Repository Configuration
pub mod github {
    pub const REPO_OWNER: &str = "akash2061";
    pub const REPO_NAME: &str = "NoteBook-App";
    pub const RELEASES_API: &str = "https://api.github.com/repos/akash2061/NoteBook-App/releases";

    /// Build GitHub API URL for a specific endpoint
    pub fn build_api_url(endpoint: &str) -> String {
        format!(
            "https://api.github.com/repos/{}/{}{}",
            REPO_OWNER, REPO_NAME, endpoint
        )
    }
}

/// External API Endpoints
pub mod api {
    /// Email breach check API base URL
    pub const EMAIL_BREACH_BASE: &str = "https://api.xposedornot.com/v1/breach-analytics";

    /// Build email breach URL with email parameter
    pub fn build_email_breach_url(email: &str) -> String {
        format!("{}?email={}", EMAIL_BREACH_BASE, urlencoding::encode(email))
    }
}

/// User Agent Strings
pub mod user_agent {
    pub const COSMOSECURE_APP: &str = "CosmoSecure-App";
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_github_api_url() {
        let url = github::build_api_url("/releases");
        assert_eq!(
            url,
            "https://api.github.com/repos/akash2061/NoteBook-App/releases"
        );
    }

    #[test]
    fn test_build_email_breach_url() {
        let url = api::build_email_breach_url("test@example.com");
        assert!(url.contains("api.xposedornot.com"));
        assert!(url.contains("test%40example.com"));
    }
}
