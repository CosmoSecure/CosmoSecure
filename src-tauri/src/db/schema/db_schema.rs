// ! Add Tresh struct for deleted entries

use mongodb::bson::DateTime;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub user_id: String,              // Unique identifier for the user
    pub username: String,             // Encrypted username
    pub name: String,                 // Name
    pub hashed_password: String,      // Hashed password for authentication
    pub email: String,                // Email address
    pub created_at: DateTime,         // Account creation timestamp
    pub last_login: Option<DateTime>, // Last login timestamp
    pub username_change_count: u8,    // Username change count
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeletedUser {
    #[serde(rename = "ui")]
    pub user_id: String, // Unique identifier for the user
    #[serde(rename = "un")]
    pub username: String, // Encrypted username
    #[serde(rename = "n")]
    pub name: String, // Name
    #[serde(rename = "hp")]
    pub hashed_password: String, // Hashed password for authentication
    #[serde(rename = "e")]
    pub email: String, // Email address
    #[serde(rename = "d")]
    pub deleted_at: DateTime, // Account creation timestamp
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PasswordEntry {
    pub entry_id: String,     // Unique identifier for the entry
    pub account_name: String, // Encrypted account name
    pub username: String,     // Encrypted username for the account
    pub password: String,     // Encrypted password
    pub custom_fields: Option<Vec<(String, String)>>, // Encrypted key-value pairs
    pub created_at: DateTime, // Entry creation timestamp
    pub password_strength: Option<u8>, // Password strength rating
                              // Last update timestamp
                              // Add ZKP [Zero Knowledge Proof]
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PasswordEntries {
    pub user_id: String,             // Reference to the user
    pub entries: Vec<PasswordEntry>, // List of password entries for the user
}

// ! Futore Feature
// #[derive(Debug, Serialize, Deserialize)]
// pub struct SecureNote {
//     pub note_id: String,              // Unique identifier for the note
//     pub user_id: String,              // Reference to the user
//     pub title: String,                // Encrypted title
//     pub content: String,              // Encrypted content
//     pub created_at: DateTime,         // Note creation timestamp
//     pub updated_at: Option<DateTime>, // Last update timestamp
// }

#[derive(Debug, Serialize, Deserialize)]
pub struct AuditLog {
    pub log_id: String,             // Unique identifier for the log entry
    pub user_id: String,            // Reference to the user
    pub action: String,             // Description of the action
    pub timestamp: DateTime,        // Timestamp of the action
    pub ip_address: Option<String>, // User's IP address (if applicable)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SecurityDashboardData {
    pub user_id: String,                    // Reference to the user
    pub total_passwords: u32,               // Total passwords count
    pub weak_passwords: u32,                // Weak passwords count
    pub last_health_scan: Option<DateTime>, // Last health check timestamp
    pub alerts: Option<Vec<String>>,        // Active security alerts
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserSettings {
    pub user_id: String,            // Reference to the user
    pub auto_lock_timeout: u32,     // Auto-lock timeout in seconds
    pub backup_preference: String,  // "local" or "cloud"
    pub dark_web_monitoring: bool,  // Is dark web monitoring enabled
    pub in_app_notifications: bool, // Are in-app notifications enabled
    pub created_at: DateTime,       // Settings creation or last updated timestamp
}
