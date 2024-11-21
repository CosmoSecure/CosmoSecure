import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import { token_secure } from "./token_secure";
import { timeOut } from "./timeout";
import { VisibilityOffTwoToneIcon, VisibilityTwoToneIcon } from './passCSS';

interface User {
    id: number;
    name: string;
    email: string;
    // Add other fields as necessary
}

interface LoginProps {
    setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean | null>>;
}

const Login: React.FC<LoginProps> = ({ setIsAuthenticated }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const navigate = useNavigate();

    const handleSignupClick = () => {
        navigate("/signup");// This triggers navigation to the signup page
    };

    const handleLogin = async () => {
        if (username.length < 3 || username.length > 15) {
            alert('Username must be between 3 and 15 characters long.');
            return;
        }

        // if (password.length < 6) {
        //     alert('Password must be at least 6 characters long.');
        //     return;
        // }

        try {
            // Send the login request to your backend
            const response = await invoke<{ token: string; data: User }>("authenticate_user", { username, password });

            if (response) {
                // Store the token in sessionStorage
                sessionStorage.setItem('token', response.token);
                token_secure(response);
                alert("Login successful!");
                setIsAuthenticated(true); // Update the authentication state
                navigate("/"); // Navigate to the main application
                timeOut(navigate);
            } else {
                alert("Invalid credentials. Please try again.");
            }
        } catch (error) {
            console.error("Login failed:", error);
            alert("Login failed. Invalid credentials. Please try again.");
        }
    };

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ' ') {
            e.preventDefault();
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
                    onKeyDown={handleKeyDown}
                    className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
                />
                <div className="mb-4 relative">
                    <input
                        type={passwordVisible ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full p-3 border border-gray-300 rounded-lg pr-10"
                    />
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 px-3 py-2 text-gray-600"
                    >
                        {passwordVisible ? <VisibilityOffTwoToneIcon /> : <VisibilityTwoToneIcon />}
                    </button>
                </div>
                <button
                    onClick={handleLogin}
                    className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
                >
                    Login
                </button>
                <div className="mt-4 text-center"></div>
                <span>Don't have an account? </span>
                <button
                    onClick={handleSignupClick}
                    className="text-blue-500 hover:underline"
                >
                    Signup
                </button>
            </div>

        </div>
    );
};

export default Login;
