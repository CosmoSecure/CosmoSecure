import CryptoJS from "crypto-js";

interface User {
    id: number;
    name: string;
    email: string;
    username: string;
    // Add other fields as necessary
}

interface Response {
    token: string;
    data: User;
}

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;

if (!SECRET_KEY) {
    throw new Error("VITE_SECRET_KEY is not defined in the environment variables");
}

export function token_secure(response: Response) {
    // Encrypt the token using AES encryption
    const encryptedToken = CryptoJS.AES.encrypt(response.token, SECRET_KEY).toString();
    sessionStorage.setItem("token", encryptedToken);

    // Encrypt the user data using AES encryption
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(response.data), SECRET_KEY).toString();
    sessionStorage.setItem("user", encryptedData);
}

export function signup_token_secure(response: { token: string }) {
    // Encrypt the token using AES encryption
    const encryptedToken = CryptoJS.AES.encrypt(response.token, SECRET_KEY).toString();
    sessionStorage.setItem("token", encryptedToken);
}

// Decrypt the token and user data for use in the application
export function decryptToken() {
    const encryptedToken = sessionStorage.getItem("token");
    if (encryptedToken) {
        const bytes = CryptoJS.AES.decrypt(encryptedToken, SECRET_KEY);
        try {
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error("Failed to decrypt token:", error);
            return null;
        }
    }
    return null;
}

export function decryptUser() {
    const encryptedData = sessionStorage.getItem("user");
    if (encryptedData) {
        const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
        try {
            return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        } catch (error) {
            console.error("Failed to decrypt user data:", error);
            return null;
        }
    }
    return null;
}