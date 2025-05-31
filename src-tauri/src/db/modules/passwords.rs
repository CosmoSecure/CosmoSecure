use crate::db::{
    db_connect::MongoClientState,
    schema::db_schema::{PasswordEntries, PasswordEntry, User},
};
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
) -> Result<String, String> {
    // Use the shared client/database from db_connect.rs
    let db: Database = state.get_database("password_manager");
    let passwords_collection: Collection<PasswordEntries> = db.collection("password_entries");
    let user_collection: Collection<User> = db.collection("users");

    // Fetch User document for password_count
    let user_filter = doc! { "ui": &user_id };
    let user_doc = user_collection
        .find_one(user_filter.clone())
        .await
        .map_err(|e| e.to_string())?;

    // Fetch current_count and max_count from User document
    let (current_count, max_count) = if let Some(user) = user_doc {
        (user.password_count[0], user.password_count[1])
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

    let strength_score = get_password_strength(&password);

    let new_entry = PasswordEntry {
        entry_id: ObjectId::new().to_hex(),
        account_name,
        username,
        password,
        created_at: DateTime::now(),
        password_strength: Some(strength_score), // Store the strength score here
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
    entry_id: String,
    account_name: String,
    username: String,
    password: String,
) -> Result<String, String> {
    let passwords_collection = state
        .get_database("password_manager")
        .collection::<PasswordEntries>("password_entries");

    // Get password strength score
    let strength_score = get_password_strength(&password);

    let filter = doc! { "entries.aid": &entry_id };
    let update = doc! {
        "$set": {
            "entries.$.an": account_name,
            "entries.$.aun": username,
            "entries.$.ap": password,
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
    ui: String, // User ID
) -> Result<Vec<PasswordEntry>, String> {
    let passwords_collection = state
        .get_database("password_manager")
        .collection::<PasswordEntries>("password_entries");

    let filter = doc! { "ui": &ui }; // Filter by user ID
    println!("Filter : {:#}", filter);

    match passwords_collection.find_one(filter).await {
        Ok(Some(password_entries)) => {
            // println!("Retrieved password entries: {:?}", password_entries.entries);
            let active_entries: Vec<PasswordEntry> = password_entries
                .entries
                .into_iter()
                .filter(|entry| entry.deleted.is_none())
                .collect();
            println!("Active password entries: {:?}", active_entries);
            Ok(active_entries)
        }
        Ok(None) => {
            println!("No password entries found for user ID: {}", ui);
            Ok(vec![])
        }
        Err(e) => Err(format!("Error fetching password entries: {}", e)),
    }
}
