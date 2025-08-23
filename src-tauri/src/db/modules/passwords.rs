use crate::db::{
    db_connect::MongoClientState,
    schema::db_schema::{PasswordEntries, PasswordEntry, User},
};
use crate::password_crypto::{decrypt_user_password, encrypt_user_password};
use bson::{doc, oid::ObjectId, DateTime};
use mongodb::{Collection, Database};
use tauri::State;
use zxcvbn::zxcvbn;

// ! Password Management
fn get_password_strength(password: &str) -> u8 {
    let score = zxcvbn(password, &[]);
    score.score() as u8
}

#[tauri::command]
pub async fn add_password_entry(
    state: State<'_, MongoClientState>,
    user_id: String,
    account_name: String,
    username: String,
    password: String,
    master_password: String,
) -> Result<String, String> {
    // Use the shared client/database from db_connect.rs
    let db: Database = state.get_database("password_manager");
    let passwords_collection: Collection<PasswordEntries> = db.collection("password_entries");
    let user_collection: Collection<User> = db.collection("users");

    // Fetch User document for password_count and salt
    let user_filter = doc! { "ui": &user_id };
    let user_doc = user_collection
        .find_one(user_filter.clone())
        .await
        .map_err(|e| e.to_string())?;

    // Fetch current_count, max_count, and salt from User document
    let (current_count, max_count, salt) = if let Some(user) = user_doc {
        let salt = user
            .hashed_password
            .get(0)
            .and_then(|hp| Some(hp.master.salt.clone()))
            .ok_or_else(|| "Master password salt not found".to_string())?;
        (user.password_count[0], user.password_count[1], salt)
    } else {
        return Err("User not found.".to_string());
    };

    if current_count >= max_count {
        return Err(format!(
            "Password limit reached ({}/{})",
            current_count, max_count
        ));
    }

    // Update the user's password_count in the users collection
    let user_update = doc! {
        "$inc": { "pc.0": 1 }
    };
    if let Err(e) = user_collection.update_one(user_filter, user_update).await {
        eprintln!("Failed to update user's password_count: {}", e);
    }

    // Encrypt the password using master password and salt
    let encrypted_password = encrypt_user_password(&password, &master_password, &salt)
        .map_err(|e| format!("Failed to encrypt password: {}", e))?;

    let strength_score = get_password_strength(&password);

    let new_entry = PasswordEntry {
        entry_id: ObjectId::new().to_hex(),
        account_name,
        username,
        password: encrypted_password, // Store encrypted password
        created_at: DateTime::now(),
        password_strength: Some(strength_score),
        last_update: DateTime::now(),
        deleted: None,
    };

    let filter = doc! { "ui": &user_id };
    let update = doc! {
        "$push": { "entries": bson::to_bson(&new_entry).unwrap() },
    };

    match passwords_collection.update_one(filter, update).await {
        Ok(result) => {
            if result.matched_count == 0 {
                let new_password_entries = PasswordEntries {
                    user_id: user_id.clone(),
                    entries: vec![new_entry],
                };
                match passwords_collection.insert_one(new_password_entries).await {
                    Ok(insert_result) => {
                        Ok(insert_result.inserted_id.as_object_id().unwrap().to_hex())
                    }
                    Err(e) => Err(format!("Error adding password entry: {}", e)),
                }
            } else {
                Ok(new_entry.entry_id)
            }
        }
        Err(e) => Err(format!("Error adding password entry: {}", e)),
    }
}

#[tauri::command]
pub async fn update_password_entry(
    state: State<'_, MongoClientState>,
    user_id: String, // Add user_id to get salt
    entry_id: String,
    account_name: String,
    username: String,
    password: String,
    master_password: String, // Master password for encryption
) -> Result<String, String> {
    let db: Database = state.get_database("password_manager");
    let passwords_collection = db.collection::<PasswordEntries>("password_entries");
    let user_collection: Collection<User> = db.collection("users");

    // Fetch User document to get salt
    let user_filter = doc! { "ui": &user_id };
    let user_doc = user_collection
        .find_one(user_filter)
        .await
        .map_err(|e| e.to_string())?;

    let salt = if let Some(user) = user_doc {
        user.hashed_password
            .get(0)
            .and_then(|hp| Some(hp.master.salt.clone()))
            .ok_or_else(|| "Master password salt not found".to_string())?
    } else {
        return Err("User not found.".to_string());
    };

    // Encrypt the password using master password and salt
    let encrypted_password = encrypt_user_password(&password, &master_password, &salt)
        .map_err(|e| format!("Failed to encrypt password: {}", e))?;

    // Get password strength score
    let strength_score = get_password_strength(&password);

    let filter = doc! { "entries.aid": &entry_id };
    let update = doc! {
        "$set": {
            "entries.$.an": account_name,
            "entries.$.aun": username,
            "entries.$.ap": encrypted_password, // Store encrypted password
            "entries.$.aps": bson::to_bson(&strength_score).unwrap(),
            "entries.$.lup": DateTime::now(),
        }
    };

    match passwords_collection.update_one(filter, update).await {
        Ok(_) => Ok(entry_id),
        Err(e) => Err(format!("Error updating password entry: {}", e)),
    }
}

#[tauri::command]
pub async fn delete_password_entry(
    state: State<'_, MongoClientState>,
    entry_id: String,
) -> Result<String, String> {
    let passwords_collection = state
        .get_database("password_manager")
        .collection::<PasswordEntries>("password_entries");

    let filter = doc! { "entries.aid": &entry_id };
    let update = doc! {
        "$pull": {
            "entries": { "aid": &entry_id }
        }
    };

    match passwords_collection.update_one(filter, update).await {
        Ok(_) => Ok(entry_id),
        Err(e) => Err(format!("Error deleting password entry: {}", e)),
    }
}

#[tauri::command]
pub async fn get_password_entries(
    state: State<'_, MongoClientState>,
    ui: String,              // User ID
    master_password: String, // Master password for decryption
) -> Result<Vec<PasswordEntry>, String> {
    let db: Database = state.get_database("password_manager");
    let passwords_collection = db.collection::<PasswordEntries>("password_entries");
    let user_collection: Collection<User> = db.collection("users");

    // Fetch User document to get salt
    let user_filter = doc! { "ui": &ui };
    let user_doc = user_collection
        .find_one(user_filter)
        .await
        .map_err(|e| e.to_string())?;

    let salt = if let Some(user) = user_doc {
        user.hashed_password
            .get(0)
            .and_then(|hp| Some(hp.master.salt.clone()))
            .ok_or_else(|| "Master password salt not found".to_string())?
    } else {
        return Err("User not found.".to_string());
    };

    let filter = doc! { "ui": &ui }; // Filter by user ID
    println!("Filter : {:#}", filter);

    match passwords_collection.find_one(filter).await {
        Ok(Some(password_entries)) => {
            let active_entries: Vec<PasswordEntry> = password_entries
                .entries
                .into_iter()
                .filter(|entry| entry.deleted.is_none())
                .map(|mut entry| {
                    // Decrypt the password before returning
                    match decrypt_user_password(&entry.password, &master_password, &salt) {
                        Ok(decrypted_password) => {
                            entry.password = decrypted_password;
                            entry
                        }
                        Err(e) => {
                            eprintln!(
                                "Failed to decrypt password for entry {}: {}",
                                entry.entry_id, e
                            );
                            // Return entry with placeholder or error message
                            entry.password = "[DECRYPTION_FAILED]".to_string();
                            entry
                        }
                    }
                })
                .collect();

            println!(
                "Active password entries (decrypted): {} entries",
                active_entries.len()
            );
            Ok(active_entries)
        }
        Ok(None) => {
            println!("No password entries found for user ID: {}", ui);
            Ok(vec![])
        }
        Err(e) => Err(format!("Error fetching password entries: {}", e)),
    }
}

// Dashboard Statistics Functions (don't require decryption)
#[tauri::command]
pub async fn get_password_stats(
    state: State<'_, MongoClientState>,
    ui: String, // User ID
) -> Result<serde_json::Value, String> {
    let passwords_collection = state
        .get_database("password_manager")
        .collection::<PasswordEntries>("password_entries");

    let filter = doc! { "ui": &ui };

    match passwords_collection.find_one(filter).await {
        Ok(Some(password_entries)) => {
            let active_entries: Vec<&PasswordEntry> = password_entries
                .entries
                .iter()
                .filter(|entry| entry.deleted.is_none())
                .collect();

            let total_passwords = active_entries.len();

            // Count weak passwords (strength < 3) without decrypting them
            let weak_passwords_count = active_entries
                .iter()
                .filter(|entry| entry.password_strength.unwrap_or(0) < 3)
                .count();

            // Get weak password entries (without decrypted passwords)
            let weak_entries: Vec<serde_json::Value> = active_entries
                .iter()
                .filter(|entry| entry.password_strength.unwrap_or(0) < 3)
                .map(|entry| {
                    serde_json::json!({
                        "aid": entry.entry_id,
                        "an": entry.account_name,
                        "aun": entry.username,
                        "aps": entry.password_strength.unwrap_or(0)
                    })
                })
                .collect();

            Ok(serde_json::json!({
                "total_passwords": total_passwords,
                "weak_passwords_count": weak_passwords_count,
                "weak_entries": weak_entries
            }))
        }
        Ok(None) => Ok(serde_json::json!({
            "total_passwords": 0,
            "weak_passwords_count": 0,
            "weak_entries": []
        })),
        Err(e) => Err(format!("Error fetching password stats: {}", e)),
    }
}
