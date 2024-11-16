// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use crate::db::db_connect::{
    tauri_add_audit_log, tauri_add_dashboard_data, tauri_add_password_entry, tauri_add_user,
    tauri_add_user_settings,
};

mod db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize the Tauri application
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            tauri_add_user,
            tauri_add_password_entry,
            tauri_add_audit_log,
            tauri_add_dashboard_data,
            tauri_add_user_settings
        ])
        .setup(|_app| {
            // Use an asynchronous runtime to run the database connection
            tauri::async_runtime::spawn(async {
                if let Err(e) = db::db_connect::connect_rust_db().await {
                    eprintln!("Failed to connect to the database: {}", e);
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
