use crate::db::schema::db_schema::User;
use crate::db::token::generate_token;
use bcrypt::{hash, verify, DEFAULT_COST};
use dotenv::dotenv;
use mongodb::bson::DateTime;
use mongodb::bson::{doc, oid::ObjectId};
use mongodb::error::Error;
use mongodb::options::ClientOptions;
use mongodb::{Client, Collection, Database};
use serde_json::json;
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

pub async fn get_user_by_username(
    username: &str,
    collection: &Collection<User>,
) -> Result<User, Error> {
    let filter = doc! { "username": username };
    collection.find_one(filter).await?.ok_or_else(|| {
        Error::from(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("User with username '{}' not found.", username),
        ))
    })
}

#[tauri::command]
pub async fn authenticate_user(
    username: String,
    password: String,
    state: State<'_, MongoClientState>,
) -> Result<serde_json::Value, String> {
    // Change return type to Json
    // Retrieve the users collection
    let users_collection = state
        .get_database("password_manager")
        .collection::<User>("users");

    // Debug: Check the username
    println!("Attempting to authenticate user: {}", username);

    match get_user_by_username(&username, &users_collection).await {
        Ok(user) => {
            // Debug: Check if user is found
            println!("User found: {:?}", user);

            // Verify the password
            if verify(&password, &user.hashed_password).unwrap_or(false) {
                // Update `last_login` timestamp
                let filter = doc! { "user_id": &user.user_id };
                let update = doc! {
                    "$set": {
                        "last_login": DateTime::now()
                    }
                };
                if let Err(e) = users_collection.update_one(filter, update).await {
                    eprintln!("Failed to update last login timestamp: {}", e);
                }

                // Generate JWT token after successful authentication
                let token_result = generate_token(&user.user_id);
                match token_result {
                    Ok(token) => {
                        // Debug: Check if token was generated
                        println!("Generated token: {}", token);
                        // Return the generated token along with user data in JSON format
                        return Ok(json!({
                            "token": token,
                            "data": user
                        }));
                    }
                    Err(e) => {
                        // Return an error message if token generation fails
                        Err(format!("Error generating token: {}", e))
                    }
                }
            } else {
                eprintln!(
                    "Failed login attempt: Incorrect password for user '{}'",
                    username
                );
                // Invalid credentials
                Err("Invalid credentials.".to_string())
            }
        }
        Err(e) => {
            // Handle case where user is not found
            Err(format!("Authentication failed: {}", e))
        }
    }
}

#[tauri::command]
pub async fn tauri_add_user(
    state: State<'_, MongoClientState>,
    username: String,
    password: String, // Receive plain password here
    two_factor_secret: Option<String>,
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
    )
    .await
    .map_err(|e| e.to_string())
}

pub async fn add_user(
    collection: &Collection<User>,
    username: &str,
    hashed_password: &str,
    two_factor_secret: Option<String>,
) -> mongodb::error::Result<String> {
    let new_user = User {
        user_id: ObjectId::new().to_hex(),
        username: username.to_string(),
        hashed_password: hashed_password.to_string(),
        two_factor_secret,
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
