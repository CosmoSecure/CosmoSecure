use bson::doc;
use chrono::NaiveDateTime;
use mongodb::{
    error::Error as MongoError,
    options::{ClientOptions, IndexOptions},
    Client, Collection, IndexModel,
};
use serde::{Deserialize, Serialize};
use std::error::Error;

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub user_id: i32,
    pub username: String,
    pub hashed_password: String,
    pub two_factor_secret: Option<String>,
    pub two_factor_enabled: bool,
    pub created_at: NaiveDateTime,
    pub last_login: Option<NaiveDateTime>,
}

pub async fn connect_rust_db() -> Result<(), Box<dyn Error>> {
    // MongoDB URI for local server
    let mongo_uri = "mongodb://localhost:27017";
    let client_options = ClientOptions::parse(mongo_uri).await?;

    // Connect to the MongoDB client
    let client = Client::with_options(client_options)?;

    // Specify the test database and collection
    let database = client.database("test_database");
    let user_collection: Collection<User> = database.collection("test_users");

    // Create a unique index on the user_id field
    let index_model = IndexModel::builder()
        .keys(doc! { "user_id": 1 })
        .options(IndexOptions::builder().unique(true).build())
        .build();
    user_collection.create_index(index_model).await?;

    // Create a new user document
    let new_user = User {
        user_id: 1,
        username: "test_username".to_string(),
        hashed_password: "test_password".to_string(),
        two_factor_secret: None,
        two_factor_enabled: false,
        created_at: chrono::Utc::now().naive_utc(),
        last_login: None,
    };

    // Insert the user into the collection with error handling for unique constraint
    match user_collection.insert_one(new_user).await {
        Ok(_) => println!("User inserted successfully into test database!"),
        Err(e) => {
            if let mongodb::error::ErrorKind::Write(_write_error) = *e.kind {
                    let existing_user: Option<User> = user_collection
                        .find_one(doc! { "user_id": 1 })
                        .await
                        .unwrap_or(None);
                    if let Some(user) = existing_user {
                        eprintln!("Error: Duplicate user_id detected for user: {:?}", user);
                    } else {
                        eprintln!("Error: Duplicate user_id detected.");
                    }
            } else {
                eprintln!("Failed to insert user: {}", e);
            }
        }
    }

    Ok(())
}
