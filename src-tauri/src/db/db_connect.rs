use crate::config::update_config;
use crate::db::schema::db_schema::{
    DeletedUser, HashedPasswordEntry, MasterPasswordAuth, PasswordEntries, User,
};
use crate::db::token::generate_token;
use crate::env_var::{get_env_key, get_env_vars};
// use crate::secure::encrypt;
use crate::secure::decrypt;
use bcrypt::{hash, verify, DEFAULT_COST};
use mongodb::bson::DateTime;
use mongodb::bson::{doc, oid::ObjectId};
use mongodb::error::Error;
use mongodb::options::{ClientOptions, IndexOptions};
use mongodb::{Client, Collection, Database, IndexModel};
use serde_json::json;
use sha2::{Digest, Sha256};
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

// ! User Management
#[tauri::command]
pub async fn check_username_availability(
    state: State<'_, MongoClientState>,
    username: String,
) -> Result<bool, String> {
    let users_collection = state
        .get_database("password_manager")
        .collection::<User>("users");

    match users_collection
        .find_one(doc! { "username": &username })
        .await
    {
        Ok(Some(_)) => Ok(false), // Username exists
        Ok(None) => Ok(true),     // Username is available
        Err(e) => Err(format!("Error checking username: {}", e)),
    }
}

#[tauri::command]
pub async fn update_name_username(
    state: State<'_, MongoClientState>,
    user_id: String,
    new_name: Option<String>,
    new_username: Option<String>,
) -> Result<(), String> {
    let users_collection = state
        .get_database("password_manager")
        .collection::<User>("users");

    let mut update_doc = doc! {};

    if let Some(name) = new_name {
        update_doc.insert("n", name);
    }

    if let Some(username) = new_username {
        // Check if the new username is available
        match check_username_availability(state.clone(), username.clone()).await {
            Ok(true) => {
                update_doc.insert("username", username);
            }
            Ok(false) => return Err("Username is already taken.".to_string()),
            Err(e) => return Err(format!("Error checking username availability: {}", e)),
        }
    }

    let filter = doc! { "ui": &user_id };

    match users_collection
        .update_one(filter, doc! { "$set": update_doc })
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Error updating name and/or username: {}", e)),
    }
}

#[tauri::command]
pub async fn update_user_password(
    state: State<'_, MongoClientState>,
    user_id: String,
    current_password: String,
    new_password: String,
) -> Result<(), String> {
    let users_collection = state
        .get_database("password_manager")
        .collection::<User>("users");

    let filter = doc! { "ui": &user_id };

    match users_collection.find_one(filter.clone()).await {
        Ok(Some(user)) => {
            // Verify the current password
            if !verify(&current_password, &user.hashed_password[0].password_hash).unwrap_or(false) {
                return Err("Current password is incorrect.".to_string());
            }

            // Ensure the new password is not the same as the current password
            if verify(&new_password, &user.hashed_password[0].password_hash).unwrap_or(false) {
                return Err("New password cannot be the same as the current password.".to_string());
            }

            // Hash the new password
            let hashed_password = match hash(new_password, DEFAULT_COST) {
                Ok(hashed) => hashed,
                Err(e) => return Err(format!("Error hashing new password: {}", e)),
            };

            // Update the password in the database
            let update = doc! { "$set": { "hp.0.ph": hashed_password } };
            match users_collection.update_one(filter, update).await {
                Ok(_) => Ok(()),
                Err(e) => Err(format!("Error updating password: {}", e)),
            }
        }
        Ok(None) => Err("User not found.".to_string()),
        Err(e) => Err(format!("Error fetching user: {}", e)),
    }
}

#[tauri::command]
pub async fn reloadapp_update(
    state: State<'_, MongoClientState>,
    user_id: String,
) -> Result<User, String> {
    let users_collection = state
        .get_database("password_manager")
        .collection::<User>("users");

    let filter = doc! { "ui": &user_id };

    match users_collection.find_one(filter).await {
        Ok(Some(user)) => Ok(user),
        Ok(None) => Err("User not found.".to_string()),
        Err(e) => Err(format!("Error fetching user: {}", e)),
    }
}

pub async fn get_user_by_username_or_email(
    identifier: &str,
    collection: &Collection<User>,
) -> Result<User, Error> {
    let filter = doc! {
        "$or": [
            { "username": identifier },
            { "email": identifier }
        ]
    };
    collection.find_one(filter).await?.ok_or_else(|| {
        Error::from(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("User with identifier '{}' not found.", identifier),
        ))
    })
}

#[tauri::command]
pub async fn authenticate_user(
    identifier: String,
    password: String,
    state: State<'_, MongoClientState>,
) -> Result<serde_json::Value, String> {
    let users_collection = state
        .get_database("password_manager")
        .collection::<User>("users");

    match get_user_by_username_or_email(&identifier, &users_collection).await {
        Ok(user) => {
            if verify(&password, &user.hashed_password[0].password_hash).unwrap_or(false) {
                let filter = doc! { "ui": &user.user_id };
                let last_login = DateTime::now(); // Get the current timestamp
                let update = doc! {
                    "$set": {
                        "l": &last_login
                    }
                };

                // Update the last login timestamp in the database
                if let Err(e) = users_collection.update_one(filter, update).await {
                    eprintln!("Failed to update last login timestamp: {}", e);
                }

                update_config(&user, &last_login.to_string());

                // Generate and return the token
                let token_result = generate_token(&user.user_id);
                match token_result {
                    Ok(token) => Ok(json!({
                        "token": token,
                        "data": user
                    })),
                    Err(e) => Err(format!("Error generating token: {}", e)),
                }
            } else {
                Err("Invalid credentials.".to_string())
            }
        }
        Err(e) => Err(format!("Authentication failed: {}", e)),
    }
}

#[tauri::command]
pub async fn tauri_add_user(
    state: State<'_, MongoClientState>,
    username: String,
    name: String,
    password: String,
    email: String,
) -> Result<String, String> {
    let trimmed_name = name.trim();
    let trimmed_email = email.trim();

    println!("Received username: {}", username);
    println!("Received email: {}", email);

    if username.is_empty() {
        return Err("Username cannot be empty.".to_string());
    }

    let hashed_password = match hash(password, DEFAULT_COST) {
        Ok(hashed) => hashed,
        Err(e) => {
            println!("Error hashing password: {}", e);
            return Err(format!("Error hashing password: {}", e));
        }
    };

    let users_collection = state
        .get_database("password_manager")
        .collection::<User>("users");

    add_user(
        &users_collection,
        &username,
        trimmed_name,
        &hashed_password, // Use the hashed password
        trimmed_email,
    )
    .await
    .map_err(|e| e.to_string())
}

pub async fn add_user(
    collection: &Collection<User>,
    username: &str,
    name: &str,
    hashed_password: &str,
    email: &str,
) -> mongodb::error::Result<String> {
    println!("Inserting user with username: {}", username);

    let new_user = User {
        user_id: ObjectId::new().to_string(),
        username: username.to_string(),
        name: name.to_string(),
        hashed_password: vec![HashedPasswordEntry {
            password_hash: hashed_password.to_string(),
            master: MasterPasswordAuth {
                password_hash: String::new(),
                salt: String::new(),
                created_at: DateTime::now(),
            },
        }],
        email: email.to_string(),
        created_at: DateTime::now(),
        last_login: DateTime::now(),
        username_change_count: 0,
        password_count: [0, 25],
    };

    println!("New user object: {:?}", new_user);

    match collection.insert_one(new_user).await {
        Ok(result) => {
            println!("User Added Secuessfully");
            Ok(result.inserted_id.as_object_id().unwrap().to_hex())
        }
        Err(e) => Err(e),
    }
}

// ? User Deletion
#[tauri::command]
pub async fn user_delete(
    state: State<'_, MongoClientState>,
    username: String,
    password: String,
) -> Result<(), String> {
    let users_collection = state
        .get_database("password_manager")
        .collection::<User>("users");
    let deleted_users_collection = state
        .get_database("password_manager")
        .collection::<DeletedUser>("deleted_users");
    let passwords_collection = state
        .get_database("password_manager")
        .collection::<PasswordEntries>("password_entries");

    match users_collection
        .find_one(doc! { "username": &username })
        .await
    {
        Ok(Some(user)) => {
            // Verify the password
            if !verify(&password, &user.hashed_password[0].password_hash).unwrap_or(false) {
                return Err("Invalid credentials.".to_string());
            }

            // Fetch the user's passwords
            let filter = doc! { "ui": &user.user_id };
            let user_passwords = match passwords_collection.find_one(filter.clone()).await {
                Ok(Some(password_entries)) => password_entries.entries,
                Ok(None) => vec![], // No passwords found
                Err(e) => return Err(format!("Error fetching user passwords: {}", e)),
            };

            // Delete the user's passwords from the password_entries collection
            if let Err(e) = passwords_collection.delete_one(filter).await {
                return Err(format!("Error deleting user passwords: {}", e));
            }

            // Create a DeletedUser entry with the passwords
            let deleted_user = DeletedUser {
                user_id: user.user_id.clone(),
                username: user.username.clone(),
                name: user.name.clone(),
                hashed_password: user.hashed_password.clone(),
                email: user.email.clone(),
                deleted_at: DateTime::now(),
                passwords: user_passwords,
            };

            // Insert the deleted user into the deleted_users collection
            match deleted_users_collection.insert_one(deleted_user).await {
                Ok(_) => {
                    // Delete the user from the users collection
                    match users_collection
                        .delete_one(doc! { "username": &username })
                        .await
                    {
                        Ok(_) => Ok(()),
                        Err(e) => Err(format!("Error deleting user: {}", e)),
                    }
                }
                Err(e) => Err(format!("Error inserting deleted user: {}", e)),
            }
        }
        Ok(None) => Err("Invalid credentials.".to_string()),
        Err(e) => Err(format!("Error fetching user: {}", e)),
    }
}

// ! Database Indexing & Connection
async fn create_unique_indexes(collection: &Collection<User>) -> mongodb::error::Result<()> {
    // Create unique index for username
    let username_index = IndexModel::builder()
        .keys(doc! { "username": 1 })
        .options(IndexOptions::builder().unique(true).build())
        .build();
    collection.create_index(username_index).await?;

    // Create unique index for email
    let email_index = IndexModel::builder()
        .keys(doc! { "email": 1 })
        .options(IndexOptions::builder().unique(true).build())
        .build();
    collection.create_index(email_index).await?;

    Ok(())
}

pub(crate) async fn connect_rust_db() -> mongodb::error::Result<MongoClientState> {
    let env_vars = get_env_vars();

    // MongoDB URI
    let encrypted_mongo_uri = env_vars.get("MONGO_URI").expect("MONGO_URI must be set");
    // let key1 = env_vars.get("KEY").expect("KEY must be set");
    // println!("Key-test: {} \n\n", key1);

    let key = get_env_key().expect("KEY must be set");
    let sec_key = derive_key(key);

    // let mongodb_uri = encrypt(encrypted_mongo_uri, &sec_key);

    // println!("Mongodb_uri: {:?} \n", encrypted_mongo_uri);
    // println!("Mongodb_uri: {} \n", mongodb_uri.unwrap());
    // println!("Key: {} \n", key1);
    // println!("Key-Hash: {} \n", key);
    // println!("Sec_Key: {:?} \n", sec_key);

    let mongo_uri = decrypt(encrypted_mongo_uri, &sec_key).expect("Failed to decrypt Mongo URI");

    let client_options = ClientOptions::parse(&mongo_uri).await?;
    let client = Client::with_options(client_options)?;

    match client.database("admin").run_command(doc! {"ping": 1}).await {
        Ok(_) => {
            println!("Connected to MongoDB securely!");
        }
        Err(e) => {
            eprintln!("Failed to connect to MongoDB: {}", e);
            return Err(e);
        }
    }

    println!("Connected to MongoDB securely!");

    let db = client.database("password_manager");
    let users_collection = db.collection::<User>("users");
    create_unique_indexes(&users_collection).await?;

    Ok(MongoClientState::new(client).await)
}

// Derive the key using SHA-256
fn derive_key(input_key: &str) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(input_key.as_bytes());
    let result = hasher.finalize();
    let mut key = [0u8; 32];
    key.copy_from_slice(&result[..32]);
    key
}
