// Add this with your other use statements
use std::env;

// Add this to your commands
#[tauri::command]
pub fn get_version() -> String {
    format!("{}", env!("CARGO_PKG_VERSION"))
}
