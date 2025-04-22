// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use crate::db::db_connect::{
    add_password_entry, authenticate_user, check_username_availability, delete_password_entry,
    get_password_entries, reloadapp_update, tauri_add_user, update_name_username,
    update_password_entry, update_user_password, user_delete,
};
use crate::db::token;
use crate::extensions::{
    email_breach::fetch_email_breach_info, pass_gen::generate_password,
    pass_strength::check_password_strength, process_capture::get_system_and_process_usage,
};
use crate::version::get_version::get_version;
use clap::Command;
use config::delete_config;
use openurl::open_url;
use std::env;

mod config;
mod db;
mod env_var;
mod extensions;
mod openurl;
mod secure;
mod version;

#[tauri::command]
fn save_token_command(token: String, user: String) {
    token::save_token(&token, &user);
}

#[tauri::command]
fn load_token_command() -> (String, String) {
    token::load_token()
}

#[tauri::command]
fn delete_token_command(app_handle: tauri::AppHandle) {
    token::delete_token(app_handle);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    let _matches = Command::new("CosmoSecure")
        .author("akash2061")
        .version(env!("CARGO_PKG_VERSION"))
        .get_matches();

    // Initialize the Tauri application
    let client_state = match db::db_connect::connect_rust_db().await {
        Ok(state) => state,
        Err(e) => {
            eprintln!("Failed to connect to the database: {}", e);
            return;
        }
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(client_state)
        .invoke_handler(tauri::generate_handler![
            tauri_add_user,
            authenticate_user,
            check_username_availability,
            save_token_command,
            load_token_command,
            delete_token_command,
            get_password_entries,
            add_password_entry,
            delete_password_entry,
            update_password_entry,
            update_name_username,
            reloadapp_update,
            delete_config,
            update_user_password,
            user_delete,
            open_url,
            check_password_strength,
            generate_password,
            get_version,
            get_system_and_process_usage,
            fetch_email_breach_info,
        ])
        // .setup(|_app| {
        // // Use an asynchronous runtime to run the database connection
        // tauri::async_runtime::spawn(async {
        //     if let Err(e) = db::db_connect::connect_rust_db().await {
        //         eprintln!("Failed to connect to the database: {}", e);
        //     }
        // });
        // Ok(())
        // })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
