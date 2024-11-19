import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import { token_secure } from "./token_secure";
import { timeOut } from "./timeout";

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
                token_secure(response);
                alert("Login successful!");
                navigate("/");
                timeOut(navigate);
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
