import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";

interface User {
    id: number;
    name: string;
    email: string;
    // Add other fields as necessary
}

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            // Send the login request to your backend
            const response = await invoke<{ token: string; data: User }>("authenticate_user", { username, password });

            if (response) {
                // Store the token in sessionStorage
                sessionStorage.setItem("token", response.token);

                // Optionally, store user data
                sessionStorage.setItem("user", JSON.stringify(response.data));

                alert("Login successful!");

                // Navigate to the home page
                navigate("/");

                // Set a timeout for session expiration (example: 10 seconds)
                const sessionTimeout = 10000; // 10 seconds
                const timeoutId = setTimeout(() => {
                    // Remove session on expiration
                    sessionStorage.removeItem("token");
                    sessionStorage.removeItem("user");
                    alert("Session expired. Please log in again.");
                    const timeoutId = localStorage.getItem("sessionTimeoutId");
                    if (timeoutId) {
                        clearTimeout(parseInt(timeoutId, 10));
                    }

                    localStorage.removeItem("sessionTimeoutId");
                    navigate("/login");
                }, sessionTimeout);

                // Store the timeout ID for cleanup on logout/re-login
                sessionStorage.setItem("sessionTimeoutId", timeoutId.toString());
            } else {
                alert("Invalid credentials. Please try again.");
            }
        } catch (error) {
            console.error("Login failed:", error);
            alert("Login failed. Invalid credentials. Please try again.");
        }
    };

    return (
        <div className="w-full h-full flex justify-center items-center bg-slate-500">
            <div className="max-w-md mx-auto p-6 border border-gray-300 rounded-lg shadow-lg bg-white">
                <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
                />
                <button
                    onClick={handleLogin}
                    className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
                >
                    Login
                </button>
            </div>
        </div>
    );
};

export default Login;
