// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use crate::db::db_connect::{authenticate_user, check_username_availability, tauri_add_user};

mod db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    // Initialize the Tauri application
    let client_state = match db::db_connect::connect_rust_db().await {
        Ok(state) => state,
        Err(e) => {
            eprintln!("Failed to connect to the database: {}", e);
            return;
        }
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(client_state)
        .invoke_handler(tauri::generate_handler![
            tauri_add_user,
            authenticate_user,
            check_username_availability
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
