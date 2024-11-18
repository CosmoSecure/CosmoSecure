use dotenv::dotenv;
use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use std::{
    env,
    time::{Duration, SystemTime},
};

#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String, // User ID or username
    exp: usize,  // Expiration time
}

pub fn generate_token(user_id: &str) -> Result<String, String> {
    dotenv().ok();

    let token_secret = env::var("TOKEN_SECRET").map_err(|e| e.to_string())?;
    // Calculate expiration time (current time + 1 hour)
    let expiration = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map_err(|e| e.to_string())? // Handle potential errors
        + Duration::new(25, 0); // Token expires in 1 hour

    let claims = Claims {
        sub: user_id.to_string(),
        exp: expiration.as_secs() as usize,
    };

    let header = Header::new(Algorithm::HS256);
    let encoding_key = EncodingKey::from_secret(token_secret.as_ref());

    // Encode the claims into a JWT token
    encode(&header, &claims, &encoding_key).map_err(|e| e.to_string()) // Convert errors to String
}
