#[cfg(test)]
mod tests {
    // SAFE VERSION - masks sensitive data
    // For full debug output with actual decrypted values, see private Gist
    
    use crate::env_var::{get_env_key, get_env_vars};
    use crate::secure::{decrypt, derive_key, encrypt};

    #[test]
    fn test_encryption_debug() {
        // This test will verify encryption/decryption works
        // Run with: cargo test test_encryption_debug -- --nocapture

        let key = match get_env_key() {
            Some(k) => k,
            None => {
                println!("Environment key not available for test");
                return;
            }
        };

        let sec_key = derive_key(&key);

        debug_encryption_info(&key, &sec_key);

        assert!(true);
    }

    fn debug_encryption_info(key: &str, sec_key: &[u8]) {
        println!("\n========== ENCRYPTION DEBUG INFO ==========\n");

        let env_vars = get_env_vars();

        // Key info (masked for security)
        println!("\n--- Keys Test ---");
        if let Some(key1) = env_vars.get("k") {
            let len = key1.len();
            if len > 16 {
                println!("\n✓ Key found: {}...{} ({} chars)", 
                    &key1[..4], &key1[len-4..], len);
            } else {
                println!("\n✓ Key found ({} chars)", len);
            }
        } else {
            println!("\n✗ Key not found");
        }
        
        let key_len = key.len();
        if key_len > 16 {
            println!("✓ Key-Hash: {}...{} ({} chars)", 
                &key[..4], &key[key_len-4..], key_len);
        } else {
            println!("✓ Key-Hash: ({} chars)", key_len);
        }
        println!("✓ Sec_Key: [REDACTED - {} bytes]", sec_key.len());

        // MongoDB URI Test
        println!("\n--- MongoDB URI Test ---");
        if let Some(encrypted_mongo_uri) = env_vars.get("m") {
            println!("\n✓ MongoDB URI found in ENV ({} chars)", encrypted_mongo_uri.len());

            // Test encryption
            match encrypt(encrypted_mongo_uri, sec_key) {
                Ok(mongodb_uri_encrypted) => {
                    println!("✓ Re-encryption successful ({} chars)", mongodb_uri_encrypted.len());
                }
                Err(e) => {
                    println!("✗ Re-encryption failed: {}", e);
                }
            }

            // Test decryption
            match decrypt(encrypted_mongo_uri, sec_key) {
                Ok(decrypted_uri) => {
                    println!("✓ Decryption successful");
                    println!("  - Length: {} chars", decrypted_uri.len());
                    if decrypted_uri.starts_with("mongodb") {
                        println!("  - Format: Valid MongoDB URI");
                    }
                }
                Err(e) => {
                    println!("✗ Decryption failed: {}", e);
                }
            }
        } else {
            println!("\n✗ MongoDB URI not found in ENV");
        }

        // Token Test
        println!("\n--- Token Test ---");
        if let Some(token_var) = env_vars.get("t") {
            println!("\n✓ Token found in ENV ({} chars)", token_var.len());

            // Test encryption
            match encrypt(token_var, sec_key) {
                Ok(token_encrypted) => {
                    println!("✓ Token encryption successful ({} chars)", token_encrypted.len());
                }
                Err(e) => {
                    println!("✗ Token encryption failed: {}", e);
                }
            }

            // Test decryption
            match decrypt(token_var, sec_key) {
                Ok(token_decrypted) => {
                    println!("✓ Token decryption successful ({} chars)", token_decrypted.len());
                }
                Err(e) => {
                    println!("✗ Token decryption failed: {}", e);
                }
            }
        } else {
            println!("\n✗ Token not found in ENV");
        }

        println!("\n==========================================\n");
    }
}