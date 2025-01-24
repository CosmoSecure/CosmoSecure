use tauri_plugin_opener::OpenerExt;

#[tauri::command]
pub async fn open_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
    // app.opener().open_path("/path/to/file", None::<&str>);
    app.opener().open_url(url, None::<&str>).map_err(|e| e.to_string())
}