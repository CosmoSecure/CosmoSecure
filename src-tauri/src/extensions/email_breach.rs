use serde_json::Value;

#[tauri::command]
pub async fn fetch_email_breach_info(email: String) -> Result<Value, String> {
    let url = format!(
        "https://api.xposedornot.com/v1/breach-analytics?email={}",
        email
    );

    // Send GET request to the API
    match reqwest::get(&url).await {
        Ok(response) => {
            if response.status().is_success() {
                // Log the response body for debugging
                match response.text().await {
                    Ok(body) => {
                        println!("Response Body: {}", body); // Log the raw response body
                        match serde_json::from_str::<Value>(&body) {
                            Ok(json) => Ok(json), // Parse the JSON response
                            Err(err) => Err(format!("Failed to parse JSON: {}", err)),
                        }
                    }
                    Err(err) => Err(format!("Failed to read response body: {}", err)),
                }
            } else {
                Err(format!("Failed to fetch data: HTTP {}", response.status()))
            }
        }
        Err(err) => Err(format!("Request error: {}", err)),
    }
}
