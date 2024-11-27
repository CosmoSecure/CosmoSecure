use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Key, Nonce}; // Or any preferred encryption crate
use anyhow::Error;
use base64::Engine;

/// Encrypts a plaintext value using a key
pub fn _encrypt(plaintext: &str, key: &[u8]) -> Result<String, Error> {
    // Ensure the key is 32 bytes (256 bits)
    let key_bytes = Key::<Aes256Gcm>::from_slice(key);
    if key_bytes.len() != 32 {
        return Err(Error::msg("Key length must be 32 bytes"));
    }
    let cipher = Aes256Gcm::new(key_bytes);

    // Create a nonce (random value); must be unique per encryption
    let nonce = Nonce::from_slice(b"unique_nonce"); // Example nonce (12 bytes)
    if nonce.len() != 12 {
        return Err(Error::msg("Nonce length must be 12 bytes"));
    }
    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(Error::msg)?;

    // Return the ciphertext as a base64 string for storage or transmission
    Ok(base64::engine::general_purpose::STANDARD.encode(ciphertext))
}

/// Decrypts a ciphertext value using a key
pub fn decrypt(ciphertext: &str, key: &[u8]) -> Result<String, Error> {
    // Ensure the key is 32 bytes (256 bits)
    let key_bytes = Key::<Aes256Gcm>::from_slice(key);
    if key_bytes.len() != 32 {
        return Err(Error::msg("Key length must be 32 bytes"));
    }
    let cipher = Aes256Gcm::new(key_bytes);

    // Decode the base64-encoded ciphertext
    let ciphertext_bytes = base64::engine::general_purpose::STANDARD.decode(ciphertext)?;

    // Use the same nonce as in encryption
    let nonce = Nonce::from_slice(b"unique_nonce"); // Example nonce (12 bytes)
    if nonce.len() != 12 {
        return Err(Error::msg("Nonce length must be 12 bytes"));
    }
    let plaintext_bytes = cipher
        .decrypt(nonce, ciphertext_bytes.as_ref())
        .map_err(Error::msg)?;

    // Convert decrypted bytes back to a UTF-8 string
    Ok(String::from_utf8(plaintext_bytes)?)
}
