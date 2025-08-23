use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use anyhow::Error;
use base64::Engine;
use rand::RngCore;
use sha2::{Digest, Sha256};

/// Derives a 32-byte encryption key from master password and salt using PBKDF2-like approach
pub fn derive_password_key(master_password: &str, salt: &str) -> Result<[u8; 32], Error> {
    // Add multiple rounds for better security (similar to PBKDF2)
    let mut current_hash = format!("{}{}", master_password, salt);
    for _ in 0..10000 {
        let result = Sha256::digest(current_hash.as_bytes());
        current_hash = hex::encode(&result);
    }

    // Final hash for the key
    let result = Sha256::digest(current_hash.as_bytes());

    let mut key = [0u8; 32];
    key.copy_from_slice(&result[..32]);
    Ok(key)
}

/// Encrypts a password using master password and salt
pub fn encrypt_user_password(
    plaintext: &str,
    master_password: &str,
    salt: &str,
) -> Result<String, Error> {
    if plaintext.is_empty() {
        return Err(Error::msg("Cannot encrypt empty password"));
    }

    if master_password.is_empty() {
        return Err(Error::msg("Master password cannot be empty"));
    }

    // Derive key from master password and salt
    let key = derive_password_key(master_password, salt)?;
    let key_bytes = Key::<Aes256Gcm>::from_slice(&key);
    let cipher = Aes256Gcm::new(key_bytes);

    // Generate a random 12-byte nonce for each encryption
    let mut nonce_bytes = [0u8; 12];
    rand::rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    // Encrypt the password
    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| Error::msg(format!("Password encryption failed: {}", e)))?;

    // Combine nonce + ciphertext and encode as base64
    let mut result = Vec::new();
    result.extend_from_slice(&nonce_bytes);
    result.extend_from_slice(&ciphertext);

    Ok(base64::engine::general_purpose::STANDARD.encode(result))
}

/// Decrypts a password using master password and salt
pub fn decrypt_user_password(
    encrypted_data: &str,
    master_password: &str,
    salt: &str,
) -> Result<String, Error> {
    if encrypted_data.is_empty() {
        return Err(Error::msg("Cannot decrypt empty data"));
    }

    if master_password.is_empty() {
        return Err(Error::msg("Master password cannot be empty"));
    }

    // Derive key from master password and salt
    let key = derive_password_key(master_password, salt)?;
    let key_bytes = Key::<Aes256Gcm>::from_slice(&key);
    let cipher = Aes256Gcm::new(key_bytes);

    // Decode the base64-encoded data
    let combined_data = base64::engine::general_purpose::STANDARD
        .decode(encrypted_data)
        .map_err(|e| Error::msg(format!("Invalid base64 encrypted data: {}", e)))?;

    if combined_data.len() < 12 {
        return Err(Error::msg("Invalid encrypted data: too short"));
    }

    // Extract nonce (first 12 bytes) and ciphertext (rest)
    let (nonce_bytes, ciphertext) = combined_data.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);

    // Decrypt the password
    let plaintext_bytes = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| Error::msg(format!("Password decryption failed: {}", e)))?;

    // Convert decrypted bytes back to a UTF-8 string
    String::from_utf8(plaintext_bytes)
        .map_err(|e| Error::msg(format!("Invalid UTF-8 in decrypted password: {}", e)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_encryption_decryption() {
        let password = "MySecretPassword123!";
        let master_password = "1234";
        let salt = "random_salt_value";

        let encrypted = encrypt_user_password(password, master_password, salt).unwrap();
        let decrypted = decrypt_user_password(&encrypted, master_password, salt).unwrap();

        println!("Encrypted: {}", encrypted);
        println!("Decrypted: {}", decrypted);
        assert_eq!(password, decrypted);
    }

    #[test]
    fn test_different_salts_produce_different_results() {
        let password = "MySecretPassword123!";
        let master_password = "1234";
        let salt1 = "salt1";
        let salt2 = "salt2";

        let encrypted1 = encrypt_user_password(password, master_password, salt1).unwrap();
        let encrypted2 = encrypt_user_password(password, master_password, salt2).unwrap();

        println!("Encrypted with salt1: {}", encrypted1);
        println!("Encrypted with salt2: {}", encrypted2);

        assert_ne!(encrypted1, encrypted2);
    }

    #[test]
    fn test_wrong_master_password_fails() {
        let password = "MySecretPassword123!";
        let master_password = "1234";
        let wrong_master_password = "5678";
        let salt = "random_salt_value";

        let encrypted = encrypt_user_password(password, master_password, salt).unwrap();
        let result = decrypt_user_password(&encrypted, wrong_master_password, salt);

        assert!(result.is_err());
    }

    #[test]
    fn test_empty_inputs() {
        assert!(encrypt_user_password("", "1234", "salt").is_err());
        assert!(encrypt_user_password("password", "", "salt").is_err());
        assert!(decrypt_user_password("", "1234", "salt").is_err());
        assert!(decrypt_user_password("encrypted", "", "salt").is_err());
    }
}
