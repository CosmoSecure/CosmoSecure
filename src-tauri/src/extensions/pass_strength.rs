use serde::Serialize;
use zxcvbn::zxcvbn;

#[derive(Serialize)]
pub struct PasswordStrength {
    score: u8,
    feedback: String,
}

#[tauri::command]
pub fn check_password_strength(password: String) -> Result<PasswordStrength, String> {
    let estimate = zxcvbn(&password, &[]);

    let feedback = if let Some(f) = estimate.feedback() {
        // Handle warning - map_or converts Option<Warning> to String
        let warning = f.warning().map_or("".to_string(), |w| w.to_string());

        // Process suggestions
        let suggestions = f
            .suggestions()
            .iter()
            .map(|s| s.to_string())
            .collect::<Vec<_>>()
            .join(" ")
            .replace("Add another word or two.", "")
            .trim()
            .to_string();

        format!("{} {}", warning, suggestions).trim().to_string()
    } else {
        "Great Security, Greater Coffee Needed! ☕😅 [buymeacoffee.com/akash2061]".to_string()
    };

    Ok(PasswordStrength {
        score: estimate.score() as u8,
        feedback,
    })
}
