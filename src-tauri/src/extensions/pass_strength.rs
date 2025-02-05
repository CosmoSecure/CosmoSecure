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

    let feedback = estimate.feedback().map_or_else(
        || "Great Security, Greater Coffee Needed! ☕😅 [buymeacoffee.com/akash2061]".to_string(),
        |f| {
            let warning = f
                .warning()
                .map_or("".to_string(), |w| w.to_string())
                .to_string(); // Handle warning
            let mut suggestions = f
                .suggestions()
                .iter()
                .map(|s| s.to_string())
                .collect::<Vec<_>>()
                .join(" "); // Join suggestions

            match suggestions.contains("Add another word or two.") {
                true => {
                    suggestions = suggestions
                        .replace("Add another word or two.", "")
                        .trim()
                        .to_string();
                    if suggestions.starts_with(" ") {
                        suggestions = suggestions[1..].to_string();
                    }
                }
                false => {}
            }
            format!("{} {}", warning, suggestions).trim().to_string()
        },
    );

    Ok(PasswordStrength {
        score: estimate.score() as u8,
        feedback,
    })
}
