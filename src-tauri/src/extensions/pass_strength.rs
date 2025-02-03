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

    let feedback = estimate
        .feedback()
        .map_or_else(
            || "No feedback available".to_string(),
            |f| {
            let warning = f
                .warning()
                .map_or("No warning available.".to_string(), |w| w.to_string())
                .to_string(); // Handle warning
            let suggestions = f
                .suggestions()
                .iter()
                .map(|s| s.to_string())
                .collect::<Vec<_>>()
                .join(" "); // Join suggestions
            format!("{} {}", warning, suggestions).trim().to_string()
        });

    Ok(PasswordStrength {
        score: estimate.score() as u8,
        feedback,
    })
}
