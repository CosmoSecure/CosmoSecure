use rand::{seq::SliceRandom, Rng};
use serde::Serialize;

#[derive(Serialize)]
pub struct GeneratedPassword {
    password: String,
}

#[tauri::command]
pub fn generate_password(length: usize) -> Result<GeneratedPassword, String> {
    if length < 8 {
        return Err("Password length must be at least 8 characters.".into());
    }

    let mut rng = rand::rng();
    let mut password = String::with_capacity(length);

    // Define character sets
    let uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let lowercase = "abcdefghijklmnopqrstuvwxyz";
    let digits = "0123456789";
    let special = "!@#$%^&*()-_=+[]{}|;:,.<>?";

    // Ensure at least one character from each category
    password.push(
        uppercase
            .chars()
            .nth(rng.random_range(0..uppercase.len()))
            .unwrap(),
    );
    password.push(
        lowercase
            .chars()
            .nth(rng.random_range(0..lowercase.len()))
            .unwrap(),
    );
    password.push(
        digits
            .chars()
            .nth(rng.random_range(0..digits.len()))
            .unwrap(),
    );
    password.push(
        special
            .chars()
            .nth(rng.random_range(0..special.len()))
            .unwrap(),
    );

    // Fill the rest of the password length with random characters from all categories
    let all_chars = format!("{}{}{}{}", uppercase, lowercase, digits, special);
    for _ in 4..length {
        password.push(
            all_chars
                .chars()
                .nth(rng.random_range(0..all_chars.len()))
                .unwrap(),
        );
    }

    // Shuffle the password to ensure randomness
    let mut password_chars: Vec<char> = password.chars().collect();
    password_chars.shuffle(&mut rng);
    let password: String = password_chars.into_iter().collect();

    Ok(GeneratedPassword { password })
}
