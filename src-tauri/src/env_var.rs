use hex;
use sha2::{Digest, Sha256};
use std::collections::HashMap;

/// Returns a HashMap of environment variables
pub fn get_env_vars() -> HashMap<&'static str, &'static str> {
    let mut env_vars = HashMap::new();

    // Add your environment variables here
    // mongodb://localhost:27017 is the default MongoDB URI
    // env_vars.insert("MONGO_URI", "mongodb://localhost:27017");
    env_vars.insert(
        "MONGO_URI",
        "lM7PEhFes5wh22i8O0wK2WW9smXRsQ/+hOjnQ7Xzs39spyAl1zHtdIM=",
    ); // mongodb_uri hash
    env_vars.insert(
        "TOKEN_SECRET",
        "wMeWEEgJs5U7xD2ybExXiWn2/m/S5wr7ilNfY4jV+6I1YWVDB8BEpSLK688bO2LZwk3McMu+9WymMnIMm4j4mSqpnBLuXNEGHBbxOu5yBb4="
    ); // jwt_token_secret hash ka hash
    env_vars.insert("KEY", "aP9s87f6gR5h4j3k5l1G0n9b8v7c6xO2"); // random key

    env_vars
}

/// Returns the hashed value of the environment variable key using SHA-256
pub fn get_env_key() -> Option<&'static mut str> {
    let env_vars = get_env_vars();
    if let Some(value) = env_vars.get("KEY") {
        let mut hasher = Sha256::new();
        hasher.update(value.as_bytes());
        let result = hasher.finalize();
        let ret = hex::encode(result);
        Some(Box::leak(ret.into_boxed_str()))
    } else {
        None
    }
}
