use dirs::config_dir;
use serde_json::json;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tauri::AppHandle;

use crate::db::schema::db_schema::User;

pub fn get_config_file_path() -> PathBuf {
    let mut config_path = config_dir().expect("Failed to get config directory");
    config_path.push("CosmoSecure");
    fs::create_dir_all(&config_path).expect("Failed to create config directory");
    config_path.push("config.json");
    config_path
}

pub fn save_to_config(encrypted_token: &str, encrypted_user: &str) {
    let config_path = get_config_file_path();
    let config_data = json!({
        "token": encrypted_token,
        "user": encrypted_user
    });
    fs::write(config_path, config_data.to_string()).expect("Failed to write to config file");
}

pub fn load_from_config() -> (String, String) {
    let config_path = get_config_file_path();
    if !config_path.exists() {
        return (String::new(), String::new());
    }
    let config_data = fs::read_to_string(config_path).expect("Failed to read config file");
    let json_data: serde_json::Value =
        serde_json::from_str(&config_data).expect("Failed to parse config file");
    (
        json_data["token"].as_str().unwrap_or("").to_string(),
        json_data["user"].as_str().unwrap_or("").to_string(),
    )
}

#[tauri::command]
pub fn delete_config(_app: AppHandle) {
    let config_path = get_config_file_path();
    if config_path.exists() {
        fs::remove_file(config_path).expect("Failed to delete config file");
    }

    // Exit and restart the application
    Command::new("sh")
        .arg("-c")
        .arg("npm run tauri dev")
        .spawn()
        .expect("Failed to restart application");
    std::process::exit(0);

    // app.restart();
}

pub fn update_config(user: &User, last_login: &str) {
    // Save the updated user data to the config file
    let config_path = get_config_file_path();
    let updated_user_data = json!({
        "user_id": user.user_id,
        "username": user.username,
        "name": user.name,
        "email": user.email,
        "last_login": last_login.to_string(),
        "created_at": user.created_at.to_string()
    });

    if config_path.exists() {
        let mut config_data: serde_json::Value =
            serde_json::from_str(&fs::read_to_string(&config_path).unwrap_or_default())
                .unwrap_or_default();
        config_data["user"] = updated_user_data; // Update the user data
        fs::write(config_path, config_data.to_string())
            .expect("Failed to update user data in config file");
    }
}
