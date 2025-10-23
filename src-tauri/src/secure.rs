use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use anyhow::Error;
use base64::Engine;

fn bytes_to_latin1_string(bytes: &[u8]) -> String {
    bytes.iter().map(|&b| b as char).collect()
}

fn latin1_string_to_bytes(s: &str) -> Vec<u8> {
    s.chars().map(|c| c as u32 as u8).collect()
}

pub fn encrypt(plaintext: &str, key: &[u8]) -> Result<String, Error> {
    let key_bytes = Key::<Aes256Gcm>::from_slice(key);
    if key_bytes.len() != 32 {
        return Err(Error::msg("Key length must be 32 bytes"));
    }
    let cipher = Aes256Gcm::new(key_bytes);

    // Generate a random nonce (12 bytes)
    let binding = rand::random::<[u8; 12]>();
    let nonce = Nonce::from_slice(&binding);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(Error::msg)?;

    // Prepend the nonce to the ciphertext before encoding
    let mut combined = nonce.to_vec();
    combined.extend_from_slice(&ciphertext);

    // Convert bytes to Latin-1 string, then encode with base64
    let latin1_string = bytes_to_latin1_string(&combined);
    Ok(base64::engine::general_purpose::STANDARD.encode(latin1_string.as_bytes()))
}

pub fn decrypt(ciphertext: &str, key: &[u8]) -> Result<String, Error> {
    let key_bytes = Key::<Aes256Gcm>::from_slice(key);
    if key_bytes.len() != 32 {
        return Err(Error::msg("Key length must be 32 bytes"));
    }
    let cipher = Aes256Gcm::new(key_bytes);

    // Decode from base64, then convert from Latin-1 string to bytes
    let base64_decoded = base64::engine::general_purpose::STANDARD.decode(ciphertext)?;
    let latin1_string = String::from_utf8(base64_decoded)?;
    let data = latin1_string_to_bytes(&latin1_string);

    if data.len() < 12 {
        return Err(Error::msg("Ciphertext too short"));
    }

    // Split nonce and ciphertext
    let (nonce_bytes, ciphertext_bytes) = data.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext_bytes = cipher
        .decrypt(nonce, ciphertext_bytes)
        .map_err(Error::msg)?;

    Ok(String::from_utf8(plaintext_bytes)?)
}
