use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::Aes256Gcm;
use anyhow::Error;
use base64::Engine;

pub fn encrypt(plaintext: &str, key: &[u8]) -> Result<String, Error> {
    if key.len() != 32 {
        return Err(Error::msg("Key length must be 32 bytes"));
    }
    let cipher = Aes256Gcm::new(key.into());

    // Generate a random nonce (12 bytes)
    let nonce_bytes = rand::random::<[u8; 12]>();
    let nonce = (&nonce_bytes).into();

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(Error::msg)?;

    // Prepend the nonce to the ciphertext before encoding
    let mut combined = nonce.to_vec();
    combined.extend_from_slice(&ciphertext);

    // Encode with base64
    Ok(base64::engine::general_purpose::STANDARD.encode(&combined))
}

pub fn decrypt(ciphertext: &str, key: &[u8]) -> Result<String, Error> {
    if key.len() != 32 {
        return Err(Error::msg("Key length must be 32 bytes"));
    }
    let cipher = Aes256Gcm::new(key.into());

    // Decode from base64
    let data = base64::engine::general_purpose::STANDARD.decode(ciphertext)?;

    if data.len() < 12 {
        return Err(Error::msg("Ciphertext too short"));
    }

    // Split nonce and ciphertext
    let (nonce_bytes, ciphertext_bytes) = data.split_at(12);
    let nonce = nonce_bytes.into();

    let plaintext_bytes = cipher
        .decrypt(nonce, ciphertext_bytes)
        .map_err(Error::msg)?;

    Ok(String::from_utf8(plaintext_bytes)?)
}