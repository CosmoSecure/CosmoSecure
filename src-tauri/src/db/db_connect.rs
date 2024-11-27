use crate::db::schema::db_schema::User;
use crate::db::token::generate_token;
use crate::secure::decrypt;
// use crate::secure::encrypt;
use bcrypt::{hash, verify, DEFAULT_COST};
use dotenv::dotenv;
use mongodb::bson::DateTime;
use mongodb::bson::{doc, oid::ObjectId};
use mongodb::error::Error;
use mongodb::options::{ClientOptions, IndexOptions};
use mongodb::{Client, Collection, Database, IndexModel};
use serde_json::json;
use sha2::{Digest, Sha256};
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
            if verify(&password, &user.hashed_password).unwrap_or(false) {
                let filter = doc! { "user_id": &user.user_id };
                let update = doc! {
                    "$set": {
                        "last_login": DateTime::now()
                    }
                };
                if let Err(e) = users_collection.update_one(filter, update).await {
                    eprintln!("Failed to update last login timestamp: {}", e);
                }

                let token_result = generate_token(&user.user_id);
                match token_result {
                    Ok(token) => {
                        return Ok(json!({
                            "token": token,
                            "data": user
                        }));
                    }
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
    password: String, // Receive plain password here
    email: String,
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
        &name,
        &hashed_password, // Use the hashed password
        &email,
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
    let new_user = User {
        user_id: ObjectId::new().to_hex(),
        username: username.to_string(),
        name: name.to_string(),
        hashed_password: hashed_password.to_string(),
        email: email.to_string(),
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
    dotenv().ok();

    // MongoDB URI
    let encrypted_mongo_uri = env::var("MONGO_URI").expect("MONGO_URI must be set");
    let key = env::var("KEY").expect("KEY must be set");

    let sec_key = derive_key(&key);
    // let sec_key_str = hex::encode(sec_key);

    println!("Mongo URI: {}", encrypted_mongo_uri);
    // let mongo_uri = encrypt(&encrypted_mongo_uri, &sec_key).expect("Failed to decrypt Mongo URI");
    // println!("Encrypted Mongo URI: {}", mongo_uri);
    let mongo_uri = decrypt(&encrypted_mongo_uri, &sec_key).expect("Failed to decrypt Mongo URI");
    println!("Decrypted Mongo URI: {}", mongo_uri);

    let client_options = ClientOptions::parse(&mongo_uri).await?;
    let client = Client::with_options(client_options)?;

    match Client::with_options(ClientOptions::parse(&mongo_uri).await?) {
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
