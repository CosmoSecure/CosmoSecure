use crate::db::schema::db_schema::{
    AuditLog, PasswordEntry, SecurityDashboardData, User, UserSettings,
};
use bcrypt::{hash, DEFAULT_COST};
use dotenv::dotenv;
use mongodb::bson::DateTime;
use mongodb::bson::{doc, oid::ObjectId};
use mongodb::options::ClientOptions;
use mongodb::{Client, Collection, Database};
use std::env;
use tauri::State;

pub struct MongoClientState {
    client: Client,
}

impl MongoClientState {
    // The new function to create MongoClientState
    pub async fn new(client: Client) -> Self {
        MongoClientState { client }
    }

    // Get a reference to the MongoDB client
    pub fn _client(&self) -> &Client {
        &self.client
    }

    // Access a specific database
    pub fn get_database(&self, db_name: &str) -> Database {
        self.client.database(db_name)
    }
}

#[tauri::command]
pub async fn tauri_add_user(
    state: State<'_, MongoClientState>,
    username: String,
    password: String, // Receive plain password here
    two_factor_secret: Option<String>,
    // two_factor_enabled: bool,
) -> Result<String, String> {
    // Hash the password using bcrypt
    let hashed_password = match hash(password, DEFAULT_COST) {
        Ok(hashed) => hashed,
        Err(e) => return Err(format!("Error hashing password: {}", e)),
    };

    // Proceed with adding the user
    let users_collection = state
        .get_database("password_manager")
        .collection::<User>("users");

    add_user(
        &users_collection,
        &username,
        &hashed_password, // Use the hashed password
        two_factor_secret,
        // two_factor_enabled,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn tauri_add_password_entry(
    state: State<'_, MongoClientState>,
    user_id: String,
    account_name: String,
    username: String,
    password: String,
    url: Option<String>,
    notes: Option<String>,
    custom_fields: Option<Vec<(String, String)>>,
) -> Result<String, String> {
    let passwords_collection = state
        .get_database("password_manager")
        .collection::<PasswordEntry>("password_vault");
    add_password_entry(
        &passwords_collection,
        &user_id,
        &account_name,
        &username,
        &password,
        url,
        notes,
        custom_fields,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn tauri_add_audit_log(
    state: State<'_, MongoClientState>,
    user_id: String,
    action: String,
    ip_address: Option<String>,
) -> Result<String, String> {
    let audit_logs_collection = state
        .get_database("password_manager")
        .collection::<AuditLog>("audit_logs");
    add_audit_log(&audit_logs_collection, &user_id, &action, ip_address)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn tauri_add_dashboard_data(
    state: State<'_, MongoClientState>,
    user_id: String,
    total_passwords: u32,
    weak_passwords: u32,
    last_health_scan: Option<DateTime>,
    alerts: Option<Vec<String>>,
) -> Result<String, String> {
    let dashboard_collection = state
        .get_database("password_manager")
        .collection::<SecurityDashboardData>("security_dashboard");
    add_dashboard_data(
        &dashboard_collection,
        &user_id,
        total_passwords,
        weak_passwords,
        last_health_scan,
        alerts,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn tauri_add_user_settings(
    state: State<'_, MongoClientState>,
    user_id: String,
    auto_lock_timeout: u32,
    backup_preference: String,
    dark_web_monitoring: bool,
    in_app_notifications: bool,
) -> Result<String, String> {
    let settings_collection = state
        .get_database("password_manager")
        .collection::<UserSettings>("settings");
    add_user_settings(
        &settings_collection,
        &user_id,
        auto_lock_timeout,
        &backup_preference,
        dark_web_monitoring,
        in_app_notifications,
    )
    .await
    .map_err(|e| e.to_string())
}

pub async fn add_user(
    collection: &Collection<User>,
    username: &str,
    hashed_password: &str,
    two_factor_secret: Option<String>,
    // two_factor_enabled: bool,
) -> mongodb::error::Result<String> {
    let new_user = User {
        user_id: ObjectId::new().to_hex(),
        username: username.to_string(),
        hashed_password: hashed_password.to_string(),
        two_factor_secret,
        // two_factor_enabled,
        created_at: DateTime::now(),
        last_login: None,
    };

    match collection.insert_one(new_user).await {
        Ok(result) => Ok(result.inserted_id.as_object_id().unwrap().to_hex()),
        Err(e) => {
            eprintln!("Error adding user to MongoDB: {}", e); // Log error
            Err(e)
        }
    }
}

/// Function to add a new password entry
pub async fn add_password_entry(
    collection: &Collection<PasswordEntry>,
    user_id: &str,
    account_name: &str,
    username: &str,
    password: &str,
    url: Option<String>,
    notes: Option<String>,
    custom_fields: Option<Vec<(String, String)>>,
) -> mongodb::error::Result<String> {
    let new_password_entry = PasswordEntry {
        entry_id: ObjectId::new().to_hex(),
        user_id: user_id.to_string(),
        account_name: account_name.to_string(),
        username: username.to_string(),
        password: password.to_string(),
        url,
        notes,
        custom_fields,
        created_at: DateTime::now(),
        updated_at: None,
        password_strength: None,
        last_health_check: None,
    };
    let result = collection.insert_one(new_password_entry).await?;
    Ok(result.inserted_id.as_object_id().unwrap().to_hex())
}

/// Function to add a new audit log
pub async fn add_audit_log(
    collection: &Collection<AuditLog>,
    user_id: &str,
    action: &str,
    ip_address: Option<String>,
) -> mongodb::error::Result<String> {
    let new_audit_log = AuditLog {
        log_id: ObjectId::new().to_hex(),
        user_id: user_id.to_string(),
        action: action.to_string(),
        timestamp: DateTime::now(),
        ip_address,
    };
    let result = collection.insert_one(new_audit_log).await?;
    Ok(result.inserted_id.as_object_id().unwrap().to_hex())
}

/// Function to add dashboard data
pub async fn add_dashboard_data(
    collection: &Collection<SecurityDashboardData>,
    user_id: &str,
    total_passwords: u32,
    weak_passwords: u32,
    last_health_scan: Option<DateTime>,
    alerts: Option<Vec<String>>,
) -> mongodb::error::Result<String> {
    let dashboard_data = SecurityDashboardData {
        user_id: user_id.to_string(),
        total_passwords,
        weak_passwords,
        last_health_scan,
        alerts,
    };
    let result = collection.insert_one(dashboard_data).await?;
    Ok(result.inserted_id.as_object_id().unwrap().to_hex())
}

/// Function to add user settings
pub async fn add_user_settings(
    collection: &Collection<UserSettings>,
    user_id: &str,
    auto_lock_timeout: u32,
    backup_preference: &str,
    dark_web_monitoring: bool,
    in_app_notifications: bool,
) -> mongodb::error::Result<String> {
    let settings = UserSettings {
        user_id: user_id.to_string(),
        auto_lock_timeout,
        backup_preference: backup_preference.to_string(),
        dark_web_monitoring,
        in_app_notifications,
        created_at: DateTime::now(),
    };
    let result = collection.insert_one(settings).await?;
    Ok(result.inserted_id.as_object_id().unwrap().to_hex())
}

pub(crate) async fn connect_rust_db() -> mongodb::error::Result<MongoClientState> {
    dotenv().ok();

    // MongoDB URI
    let mongo_uri = env::var("MONGO_URI").expect("MONGO_URI must be set");
    let client_options = ClientOptions::parse(&mongo_uri).await?;
    let client = Client::with_options(client_options)?;

    match Client::with_options(ClientOptions::parse(&mongo_uri).await?) {
        Ok(_) => {
            println!("Connected to MongoDB securely! Foo");
        }
        Err(e) => {
            eprintln!("Failed to connect to MongoDB: {}", e);
            return Err(e);
        }
    }

    println!("Connected to MongoDB securely!");

    Ok(MongoClientState::new(client).await)
}
