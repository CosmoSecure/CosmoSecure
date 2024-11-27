import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import { VisibilityOffTwoToneIcon, VisibilityTwoToneIcon } from "./passCSS";
import { signup_token_secure } from "./token_secure";
import { Background, Logo } from "../../assets";

function debounce(func: (...args: any[]) => void, wait: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

const Signup: React.FC = () => {
    const [username, setUsername] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isEmailValid, setIsEmailValid] = useState<boolean | null>(null);
    const [emailTouched, setEmailTouched] = useState(false);
    const navigate = useNavigate();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const checkUsernameAvailability = async (username: string) => {
        if (!username) {
            setUsernameAvailable(null);
            return;
        }
        try {
            const available = await invoke<boolean>("check_username_availability", { username });
            setUsernameAvailable(available);
        } catch (error) {
            console.error("Error checking username availability:", error);
        }
    };

    const debouncedCheckUsernameAvailability = debounce(checkUsernameAvailability, 300);

    useEffect(() => {
        debouncedCheckUsernameAvailability(username);
    }, [username]);

    const checkEmailValidity = (email: string) => {
        setIsEmailValid(emailRegex.test(email));
    };

    const debouncedCheckEmailValidity = debounce(checkEmailValidity, 300);

    useEffect(() => {
        if (emailTouched) {
            debouncedCheckEmailValidity(email);
        }
    }, [email, emailTouched]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (username.length < 3 || username.length > 15) {
            setMessage("Username must be between 3 and 15 characters long.");
            return;
        }

        if (!isEmailValid) {
            setMessage("Invalid email address.");
            return;
        }

        if (password.length < 6) {
            setMessage("Password must be at least 6 characters long.");
            return;
        }

        try {
            const response = await invoke<{ token: string }>("tauri_add_user", {
                username,
                name,
                email,
                password,
            });
            signup_token_secure(response);
            alert("Signup successful!");
            navigate("/"); // Navigate to login
        } catch (error) {
            console.error("Error adding user:", error);
            setMessage("Error adding user. Please try again.");
        }
    };

    const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === " ") e.preventDefault();
    };

    return (
        <div className="w-full h-full flex justify-center items-center bg-rich-black text-white">
            <div className="max-w-4xl w-full h-5/6 m-2 mx-auto border border-rich-black-2 rounded-lg shadow-lg bg-raisin-black grid grid-cols-[4fr,3fr]">
                <div className="m-5 grid grid-rows-[0.5fr,3fr]">
                    <div className="w-1/2 mx-auto">
                        <img
                            src={Logo} // Replace with your image path
                            alt="Logo"
                            className="w-auto h-auto object-cover mx-auto"
                        />
                    </div>
                    <div className="mx-8 flex flex-col justify-center min-h-[0px]">
                        <h2 className="text-2xl font-bold text-center mb-6 text-african-violet">Create an Account</h2>
                        <form onSubmit={handleSignup}>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    required
                                    className="w-full p-3 border border-paynes-gray rounded-lg bg-ultra-violet text-white"
                                />
                                {usernameAvailable === null ? null : usernameAvailable ? (
                                    <p className="text-green-500">Username is available</p>
                                ) : (
                                    <p className="text-red-500">Username is already taken</p>
                                )}
                            </div>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full p-3 border border-paynes-gray rounded-lg bg-ultra-violet text-white"
                                />
                            </div>
                            <div className="mb-4">
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setEmailTouched(true);
                                    }}
                                    required
                                    className="w-full p-3 border border-paynes-gray rounded-lg bg-ultra-violet text-white"
                                />
                                {emailTouched && (isEmailValid === null ? null : isEmailValid ? (
                                    <p className="text-green-500">Valid email address</p>
                                ) : (
                                    <p className="text-red-500">Invalid email address</p>
                                ))}
                            </div>
                            <div className="mb-4 relative">
                                <input
                                    type={passwordVisible ? "text" : "password"}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    required
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
                                Signup
                            </button>
                        </form>
                        <div className="mt-4 text-center">
                            Already have an account?{" "}
                            <button
                                onClick={() => navigate("/")}
                                className="text-persian-pink hover:underline"
                            >
                                Login
                            </button>
                        </div>
                        {message && <p className="mt-4 text-center text-red-500">{message}</p>}
                    </div>
                </div>
                <div>
                    <img
                        src={Background} // Replace with your image path
                        alt="Login Illustration"
                        className="w-full h-full object-cover rounded-md"
                    />
                </div>
            </div>
        </div>
    );
};

export default Signup;
