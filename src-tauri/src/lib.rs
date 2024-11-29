// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use crate::db::db_connect::{authenticate_user, check_username_availability, tauri_add_user};
use crate::db::token;

pub mod config;
mod db;
pub mod env_var;
mod secure;

#[tauri::command]
fn save_token_command(token: String, user: String) {
    token::save_token(&token, &user);
}

#[tauri::command]
fn load_token_command() -> (String, String) {
    token::load_token()
}

#[tauri::command]
fn delete_token_command() {
    token::delete_token();
}

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
            check_username_availability,
            save_token_command,
            load_token_command,
            delete_token_command
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
