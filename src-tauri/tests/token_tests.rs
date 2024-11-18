use dotenv::dotenv;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::{
    env,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

#[cfg(test)]
mod tests {
    use super::*;

    // Claims structure for JWT
    #[derive(Serialize, Deserialize)]
    struct Claims {
        sub: String, // User ID or username
        exp: usize,  // Expiration time (in seconds since Unix epoch)
    }

    // Initialization function to load environment variables for tests
    fn init() {
        dotenv().ok(); // Load the .env file and set environment variables
    }

    // Function to generate a token
    pub fn generate_token(user_id: &str) -> Result<String, String> {
        init(); // Ensure environment variables are loaded

        let token_secret = env::var("TOKEN_SECRET").map_err(|e| e.to_string())?;
        // Calculate expiration time (current time + 25 seconds for the test)
        let expiration = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| e.to_string())?
            + Duration::new(25, 0); // Token expires in 25 seconds

        let claims = Claims {
            sub: user_id.to_string(),
            exp: expiration.as_secs() as usize,
        };

        let header = Header::new(Algorithm::HS256);
        let encoding_key = EncodingKey::from_secret(token_secret.as_ref());

        // Encode the claims into a JWT token
        encode(&header, &claims, &encoding_key).map_err(|e| e.to_string()) // Convert errors to String
    }

    // Function to check token details (example function)
    pub fn check_token_details(token: &str) -> Result<(), String> {
        // Add logic to check the token details, such as decoding or printing them
        println!("Checking token details: {}", token);
        Ok(())
    }

    // Function to check if the token is expired
    pub fn is_token_expired(token: &str) -> Result<bool, String> {
        init(); // Ensure environment variables are loaded

        let token_secret = env::var("TOKEN_SECRET").map_err(|e| e.to_string())?;

        // Initialize validation with the desired algorithm
        let mut validation = Validation::new(Algorithm::HS256);
        validation.validate_exp = true; // Ensure the token's expiration is validated
        validation.leeway = 5; // Set the leeway (e.g., 0 means no leeway)

        // Decode the token to extract the claims
        match decode::<Claims>(
            token,
            &DecodingKey::from_secret(token_secret.as_ref()),
            &validation,
        ) {
            Ok(decoded_token) => {
                // Get the expiration timestamp from the claims
                let exp_timestamp = decoded_token.claims.exp;

                // Get the current time as a timestamp
                let current_timestamp = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .map_err(|e| e.to_string())?
                    .as_secs() as usize;

                // If the current timestamp is greater than the token's expiration timestamp, the token is expired
                let expired = current_timestamp > exp_timestamp;

                if expired {
                    println!("The token has expired.");
                }

                check_token_details(&token).expect("Failed to print token details");

                Ok(expired)
            }
            Err(_) => Err("Invalid or malformed token".to_string()), // Token validation failed
        }
    }

    // Test for token generation
    #[test]
    fn test_generate_token() {
        init(); // Ensure environment variables are loaded
        let user_id = "test_user";
        let token = generate_token(user_id).expect("Failed to generate token");

        println!("Generated Token: {}", token);
        check_token_details(&token).expect("Failed to print token details");

        let is_expired = is_token_expired(&token).expect("Failed to check token expiration");
        assert!(!is_expired, "The token should not be expired");
    }

    // Test for token expiration
    #[test]
    fn test_token_expiration() {
        init(); // Ensure environment variables are loaded
        let user_id = "test_user";
        let token = generate_token(user_id).expect("Failed to generate token");

        // Wait for a bit before checking if the token expired (using sleep for testing)
        std::thread::sleep(std::time::Duration::from_secs(30));

        let is_expired = is_token_expired(&token).expect("Failed to check token expiration");
        assert!(is_expired, "The token should be expired now");
    }
}
