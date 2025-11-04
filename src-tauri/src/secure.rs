use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::Aes256Gcm;
use anyhow::Error;
use base64::Engine;
use base64::{
    alphabet,
    engine::{self, general_purpose},
};
use once_cell::sync::Lazy;
use sha2::{Digest, Sha256};

use crate::env_var::get_env_vars;

fn load_alphabet_from_env() -> alphabet::Alphabet {
    let env_vars = get_env_vars();
    let alphabet_str = env_vars
        .get("a")
        .expect("Environment variable 'a' not found");

    // Validate length before creating alphabet
    if alphabet_str.len() != 64 {
        panic!(
            "Invalid alphabet length: expected 64, got {}. Alphabet: {}",
            alphabet_str.len(),
            alphabet_str
        );
    }

    alphabet::Alphabet::new(&alphabet_str)
        .expect("Invalid alphabet length — must be exactly 64 characters")
}

// --- Use Lazy to initialize once globally ---
static CUSTOM_ALPHABET: Lazy<alphabet::Alphabet> = Lazy::new(|| load_alphabet_from_env());

// Create engine with custom alphabet
static CUSTOM_ENGINE: Lazy<engine::GeneralPurpose> =
    Lazy::new(|| engine::GeneralPurpose::new(&*CUSTOM_ALPHABET, general_purpose::PAD));

#[cfg(test)]
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
    Ok(CUSTOM_ENGINE.encode(&combined))
}

pub fn decrypt(ciphertext: &str, key: &[u8]) -> Result<String, Error> {
    if key.len() != 32 {
        return Err(Error::msg("Key length must be 32 bytes"));
    }
    let cipher = Aes256Gcm::new(key.into());

    // Decode from base64
    let data = CUSTOM_ENGINE.decode(ciphertext)?;

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

pub fn derive_key(input_key: &str) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(input_key.as_bytes());
    let result = hasher.finalize();
    let mut key = [0u8; 32];
    key.copy_from_slice(&result[..32]);
    key
}
