use crate::db::{
    db_connect::MongoClientState,
    modules::passwords::delete_password_entry,
    schema::db_schema::{PasswordEntries, PasswordEntry, User},
};
use bson::{doc, Bson, DateTime};
use chrono::{Duration, Utc};
use futures_util::TryStreamExt;
use tauri::State;

// ! Trash Management
#[tauri::command]
pub async fn trash(
    state: State<'_, MongoClientState>,
    ui: String, // User ID
) -> Result<Vec<PasswordEntry>, String> {
    if !state.is_connected() {
        return Err("Database not connected. Cannot retrieve trash.".to_string());
    }

    let db = state.get_database("password_manager")?;
    let passwords_collection = db.collection::<PasswordEntries>("password_entries");

    let filter = doc! { "ui": &ui }; // Filter by user ID
    println!("Filter : {:#}", filter);

    match passwords_collection.find_one(filter).await {
        Ok(Some(password_entries)) => {
            // println!("Retrieved password entries: {:?}", password_entries.entries);
            let deleted_entries: Vec<PasswordEntry> = password_entries
                .entries
                .into_iter()
                .filter(|entry| entry.deleted.is_some())
                .collect();
            println!("Deleted password entries: {:?}", deleted_entries);
            Ok(deleted_entries)
        }
        Ok(None) => {
            println!("No password entries found for user ID: {}", ui);
            Ok(vec![])
        }
        Err(e) => Err(format!("Error fetching password entries: {}", e)),
    }
}

#[tauri::command]
pub async fn add_to_trash(
    state: State<'_, MongoClientState>,
    user_id: String,
    entry_id: String,
) -> Result<String, String> {
    println!(
        "🗑️ add_to_trash called with user_id: {}, entry_id: {}",
        user_id, entry_id
    );

    if !state.is_connected() {
        return Err("Database not connected. Cannot move to trash.".to_string());
    }

    let db = state.get_database("password_manager")?;
    let passwords_collection = db.collection::<PasswordEntries>("password_entries");
    let user_collection = db.collection::<User>("users");

    // First, verify the password entry exists and is not already deleted
    let verify_filter = doc! {
        "ui": &user_id,
        "entries.aid": &entry_id
    };

    println!("🔍 Verifying entry with filter: {:?}", verify_filter);

    let existing_entry = passwords_collection
        .find_one(verify_filter)
        .await
        .map_err(|e| format!("Error verifying password entry: {}", e))?;

    if let Some(password_entries) = existing_entry {
        println!(
            "📄 Found password entries document with {} entries",
            password_entries.entries.len()
        );

        // Check if the specific entry exists and is not already deleted
        let entry_exists = password_entries.entries.iter().any(|entry| {
            let exists = entry.entry_id == entry_id && entry.deleted.is_none();
            println!(
                "🔍 Checking entry {}: exists={}, deleted={:?}",
                entry.entry_id,
                entry.entry_id == entry_id,
                entry.deleted
            );
            exists
        });

        println!("✅ Entry exists and not deleted: {}", entry_exists);

        if !entry_exists {
            return Err("Password entry not found or already deleted".to_string());
        }
    } else {
        println!(
            "❌ No password entries document found for user: {}",
            user_id
        );
        return Err("User password entries not found".to_string());
    }

    // Update the user's password_count in the users collection - this is critical
    let user_filter = doc! { "ui": &user_id };
    let user_update = doc! {
        "$inc": { "pc.0": -1 }
    };

    user_collection
        .update_one(user_filter, user_update)
        .await
        .map_err(|e| format!("Failed to update user's password_count: {}", e))?;

    // Now move the password to trash
    let filter = doc! { "entries.aid": &entry_id };
    let update = doc! {
        "$set": {
            "entries.$.d": {
                "del": true,
                "d_at": DateTime::now(),
            }
        }
    };

    match passwords_collection.update_one(filter, update).await {
        Ok(result) => {
            if result.matched_count == 0 {
                // If the password entry wasn't found, we need to revert the count decrease
                let revert_filter = doc! { "ui": &user_id };
                let revert_update = doc! {
                    "$inc": { "pc.0": 1 }
                };
                let _ = user_collection
                    .update_one(revert_filter, revert_update)
                    .await;
                Err("Password entry not found".to_string())
            } else {
                println!(
                    "Successfully moved password {} to trash and decremented count for user {}",
                    entry_id, user_id
                );
                Ok(entry_id)
            }
        }
        Err(e) => {
            // If moving to trash failed, revert the count decrease
            let revert_filter = doc! { "ui": &user_id };
            let revert_update = doc! {
                "$inc": { "pc.0": 1 }
            };
            let _ = user_collection
                .update_one(revert_filter, revert_update)
                .await;
            Err(format!("Error adding password entry to trash: {}", e))
        }
    }
}

#[tauri::command]
pub async fn restore_password(
    state: State<'_, MongoClientState>,
    user_id: String,
    entry_id: String,
) -> Result<String, String> {
    if !state.is_connected() {
        return Err("Database not connected. Cannot restore password.".to_string());
    }

    let db = state.get_database("password_manager")?;
    let passwords_collection = db.collection::<PasswordEntries>("password_entries");
    let user_collection = db.collection::<User>("users");

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

    let filter = doc! { "entries.aid": &entry_id };
    println!("Filter : {:#}", filter);
    let update = doc! {
        "$set": {
            "entries.$.d": Bson::Null
        }
    };
    println!("Update : {:#}", update);

    match passwords_collection.update_one(filter, update).await {
        Ok(_) => Ok(entry_id),
        Err(e) => Err(format!("Error restoring password: {}", e)),
    }
}

#[tauri::command]
pub async fn clean_old_trash(state: State<'_, MongoClientState>) -> Result<usize, String> {
    if !state.is_connected() {
        return Err("Database not connected. Cannot clean trash.".to_string());
    }

    let db = state.get_database("password_manager")?;
    let passwords_collection = db.collection::<PasswordEntries>("password_entries");

    let now = Utc::now();
    let threshold = now - Duration::days(30);

    // Find all password_entries documents
    let mut cursor = passwords_collection
        .find(doc! {})
        .await
        .map_err(|e| format!("DB error: {}", e))?;

    let mut total_deleted = 0;

    while let Some(doc) = cursor
        .try_next()
        .await
        .map_err(|e| format!("DB error: {}", e))?
    {
        for entry in &doc.entries {
            if let Some(deleted) = &entry.deleted {
                let d_at = deleted.deleted_at;
                let deleted_at_chrono: chrono::DateTime<Utc> = d_at.to_chrono();

                // ! logs:
                println!(
                    "\n\n\nChecking entry: {},\n deleted_at: {},\n threshold: {},\n now: {}\n\n\n",
                    entry.entry_id, deleted_at_chrono, threshold, now
                );

                if deleted_at_chrono < threshold {
                    // Call your delete_password_entry function for this entry
                    // Ignore errors for individual deletes, but log them
                    match delete_password_entry(state.clone(), entry.entry_id.clone()).await {
                        Ok(_) => total_deleted += 1,
                        Err(e) => eprintln!("Failed to delete entry {}: {}", entry.entry_id, e),
                    }
                }
            }
        }
    }
    Ok(total_deleted)
}
