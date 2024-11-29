use crate::env_var::{get_env_key, get_env_vars};
// use crate::secure::encrypt;
use crate::secure::decrypt;
use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::time::{Duration, SystemTime};

#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String, // User ID or username
    exp: usize,  // Expiration time
}

pub fn generate_token(user_id: &str) -> Result<String, String> {
    let env_vars = get_env_vars();

    let token_var = env_vars
        .get("TOKEN_SECRET")
        .ok_or("TOKEN_SECRET not found")?;
    let key = get_env_key().expect("KEY must be set");
    let sec_key = derive_key(key);

    // let token = encrypt(token_var, &sec_key);
    // println!("Encoded - Token: {:?} \n", token.unwrap());
    let token_secret = decrypt(token_var, &sec_key);
    let token_sec = token_secret.unwrap();

    let expiration = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map_err(|e| e.to_string())? // Handle potential errors
        + Duration::new(3 * 24 * 3600, 0); // Token expires in 3 days

    let claims = Claims {
        sub: user_id.to_string(),
        exp: expiration.as_secs() as usize,
    };

    let header = Header::new(Algorithm::HS256);
    let encoding_key = EncodingKey::from_secret(token_sec.as_ref());

    // Encode the claims into a JWT token
    encode(&header, &claims, &encoding_key).map_err(|e| e.to_string()) // Convert errors to String
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

use crate::config::{delete_config, load_from_config, save_to_config};

pub fn save_token(token: &str, user: &str) {
    save_to_config(token, user);
}

pub fn load_token() -> (String, String) {
    load_from_config()
}

pub fn delete_token() {
    delete_config();
}
