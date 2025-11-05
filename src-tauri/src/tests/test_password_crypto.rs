#[cfg(test)]
mod tests {
    use crate::password_crypto::{decrypt_user_password, encrypt_user_password};

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
