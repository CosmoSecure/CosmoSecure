use crate::db::{
    db_connect::{
        attempt_database_reconnection, authenticate_user, check_database_connection,
        check_username_availability, ping_database, reloadapp_update, tauri_add_user,
        update_name_username, update_user_password, user_delete,
    },
    modules::{
        master_password::{
            generate_salt_hex, get_master_salt, get_zkp_verification_data, setup_master_password,
            update_user_session,
        },
        passwords::{
            add_password_entry, decrypt_single_password, delete_password_entry,
            get_password_entries, get_password_entries_encrypted, get_password_stats,
            update_password_entry,
        },
        trash::{add_to_trash, clean_old_trash, restore_password, trash},
    },
    token,
};
use crate::extensions::{
    email_breach::fetch_email_breach_info,
    pass_gen::generate_password,
    pass_strength::check_password_strength,
    process_capture::get_system_and_process_usage,
    updater::{
        check_for_updates, download_and_install_update, force_check_updates, get_platform_info,
        get_release_info,
    },
};
use crate::version::get_version::get_version;
use clap::Command;
use config::delete_config;
use openurl::open_url;
use std::env;
use tauri::Manager;

mod config;
mod db;
mod env_var;
mod extensions;
mod openurl;
mod password_crypto;
mod secure;
mod tests;
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

#[tauri::command]
fn get_platform() -> String {
    std::env::consts::OS.to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    let _matches = Command::new("CosmoSecure")
        .author("akash2061")
        .version(env!("CARGO_PKG_VERSION"))
        .about("\nCosmoSecure: A secure password manager built with Tauri and Rust.\nAuthor: akash2061 <aakash.soni8781@gmail.com>")
        .get_matches();

    // Initialize the Tauri application
    let client_state = match db::db_connect::connect_rust_db().await {
        Ok(state) => {
            if state.is_connected() {
                println!("Application started with database connection");
            } else {
                println!(
                    "Application started without database connection - running in offline mode"
                );
            }
            state
        }
        Err(e) => {
            eprintln!("Failed to initialize database connection: {}", e);
            // Still start the app, but without database functionality
            db::db_connect::MongoClientState::new(None).await
        }
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }))
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
            get_password_entries_encrypted,
            decrypt_single_password,
            get_password_stats,
            add_password_entry,
            delete_password_entry,
            update_password_entry,
            update_name_username,
            reloadapp_update,
            delete_config,
            update_user_password,
            user_delete,
            trash,
            add_to_trash,
            restore_password,
            clean_old_trash,
            open_url,
            check_password_strength,
            generate_password,
            get_version,
            get_system_and_process_usage,
            fetch_email_breach_info,
            setup_master_password,
            get_zkp_verification_data,
            generate_salt_hex,
            update_user_session,
            get_master_salt,
            get_platform,
            check_for_updates,
            download_and_install_update,
            force_check_updates,
            get_release_info,
            get_platform_info,
            check_database_connection,
            ping_database,
            attempt_database_reconnection,
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
