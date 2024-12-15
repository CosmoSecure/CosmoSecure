import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import { VisibilityOffTwoToneIcon, VisibilityTwoToneIcon } from './passCSS';
import { token_secure } from "./token_secure";
import { Background, Logo } from "../../assets";
import { motion } from 'framer-motion';

interface User {
    id: number;
    username: string;
    name: string;
    email: string;
}

interface LoginProps {
    setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean | null>>;
}

const Login: React.FC<LoginProps> = ({ setIsAuthenticated }) => {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async () => {
        if (identifier.length < 3 || identifier.length > 50) {
            alert('Identifier must be between 3 and 50 characters long.');
            return;
        }

        try {
            const response = await invoke<{ token: string; data: User }>("authenticate_user", { identifier, password });
            if (response) {
                token_secure(response);
                await invoke('save_token_command', { token: sessionStorage.getItem('token'), user: sessionStorage.getItem('user') });
                // alert("Login successful!");
                setIsAuthenticated(true);
                navigate("/");
            } else {
                alert("Invalid credentials. Please try again.");
            }
        } catch (error) {
            console.error("Login failed:", error);
            alert("Login failed. Invalid credentials. Please try again.");
        }
    };

    const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ' ') e.preventDefault();
    };

    return (
        <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -300 }}
        transition={{ duration: 0.6 }}
            className="w-full h-full flex justify-center items-center bg-rich-black text-white rounded-md"
        >
            <div className="max-w-4xl w-full h-5/6 m-2 mx-auto border border-rich-black-2 rounded-lg shadow-lg bg-raisin-black grid grid-cols-[3fr,4fr]">
                <div>
                    <img
                        src={Background} // Replace with your image path
                        alt="Login Illustration"
                        className="w-full h-full object-cover rounded-md"
                    />
                </div>
                <div className="m-5 grid grid-rows-[1fr,2fr]">
                    <div className="w-1/2 mx-auto">
                        <img
                            src={Logo} // Replace with your image path
                            alt="Logo"
                            className="w-auto h-auto object-cover mx-auto"
                        />
                    </div>
                    <div className="mx-8">
                        <h2 className="text-2xl font-bold text-center mb-6 text-african-violet">Welcome Back!</h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Username or Email"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full p-3 border border-paynes-gray rounded-lg bg-ultra-violet text-white"
                                />
                            </div>
                            <div className="mb-4 relative">
                                <input
                                    type={passwordVisible ? "text" : "password"}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full p-3 border border-paynes-gray rounded-lg bg-ultra-violet text-white pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute inset-y-0 right-0 px-3 py-2 text-gray-400"
                                >
                                    {passwordVisible ? <VisibilityOffTwoToneIcon /> : <VisibilityTwoToneIcon />}
                                </button>
                            </div>
                            <button
                                type="submit"
                                className="w-full p-3 bg-glaucous text-white rounded-lg hover:bg-mauve"
                            >
                                Login
                            </button>
                        </form>
                        <div className="mt-4 text-center">
                            Don't have an account?{" "}
                            <button
                                onClick={() => navigate("/signup")}
                                className="text-persian-pink hover:underline"
                            >
                                Signup
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Login;