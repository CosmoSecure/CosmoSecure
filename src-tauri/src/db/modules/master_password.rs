use crate::db::{
    db_connect::MongoClientState,
    schema::db_schema::{MasterPasswordAuth, User},
};
use bson::{doc, DateTime};
use tauri::State;

#[tauri::command]
pub async fn setup_master_password(
    state: State<'_, MongoClientState>,
    user_id: String,
    master_password_hash: String, // Pre-hashed on client
    salt: String,
) -> Result<String, String> {
    let user_collection = state
        .get_database("password_manager")
        .collection::<User>("users");

    let master_auth = MasterPasswordAuth {
        password_hash: master_password_hash,
        salt,
        created_at: DateTime::now(),
    };

    let filter = doc! { "ui": &user_id };
    let update = doc! {
        "$set": {
            "hp.0.mp": bson::to_bson(&master_auth).unwrap(),
        }
    };

    user_collection
        .update_one(filter, update)
        .await
        .map_err(|e| e.to_string())?;

    Ok("Master password setup completed.".to_string())
}

#[tauri::command]
pub async fn update_user_session(
    state: State<'_, MongoClientState>,
    user_id: String,
    token_data: String, // Token data from the client
) -> Result<serde_json::Value, String> {
    let user_collection = state
        .get_database("password_manager")
        .collection::<User>("users");

    let filter = doc! { "ui": &user_id };

    // Fetch the updated user data from the database
    let user_doc = user_collection
        .find_one(filter)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(user) = user_doc {
        Ok(serde_json::json!({
            "token": token_data,
            "data": user
        }))
    } else {
        Err("User not found.".to_string())
    }
}

// Verify master password (for additional security checks)
#[tauri::command]
pub async fn verify_master_password(
    state: State<'_, MongoClientState>,
    user_id: String,
    provided_hash: String, // Hash computed on client
) -> Result<bool, String> {
    let user_collection = state
        .get_database("password_manager")
        .collection::<User>("users");

    let user_filter = doc! { "ui": &user_id };
    let user_doc = user_collection
        .find_one(user_filter)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(user) = user_doc {
        if let Some(master_auth) = user.hashed_password.get(0).map(|hp| &hp.master) {
            // Compare hashes (both computed on client side)
            Ok(master_auth.password_hash == provided_hash)
        } else {
            Err("No master password set for user.".to_string())
        }
    } else {
        Err("User not found.".to_string())
    }
}

// Get master password salt for a user (for encryption/decryption operations)
#[tauri::command]
pub async fn get_master_salt(
    state: State<'_, MongoClientState>,
    user_id: String,
) -> Result<String, String> {
    let user_collection = state
        .get_database("password_manager")
        .collection::<User>("users");

    let user_filter = doc! { "ui": &user_id };
    let user_doc = user_collection
        .find_one(user_filter)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(user) = user_doc {
        if let Some(master_auth) = user.hashed_password.get(0).map(|hp| &hp.master) {
            Ok(master_auth.salt.clone())
        } else {
            Err("No master password set for user.".to_string())
        }
    } else {
        Err("User not found.".to_string())
    }
}

// Hex-encoded salt (alternative format)
#[tauri::command]
pub fn generate_salt_hex(byte_length: Option<usize>) -> Result<String, String> {
    use rand::RngCore;

    let length = byte_length.unwrap_or(16); // Default to 16 bytes (32 hex chars)

    // Validate length
    if length < 8 || length > 32 {
        return Err("Salt byte length must be between 8 and 32 bytes.".to_string());
    }

    let mut salt_bytes = vec![0u8; length];
    rand::rng().fill_bytes(&mut salt_bytes);

    let salt = hex::encode(&salt_bytes);
    Ok(salt)
}
