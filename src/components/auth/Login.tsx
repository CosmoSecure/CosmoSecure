import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import { VisibilityOffTwoToneIcon, VisibilityTwoToneIcon } from './passCSS';
import { token_secure } from "./token_secure";
import { Background, Logo } from "../../assets";
import { useNotificationMiddleware, useQuickNotifications } from '../../utils/notifications';
import { useUser } from '../../contexts/UserContext';

interface User {
    id: number;
    username: string;
    name: string;
    email: string;
    created_at: string;
    last_login: string;
}

interface LoginProps {
    setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean | null>>;
}

const Login: React.FC<LoginProps> = ({ setIsAuthenticated }) => {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const navigate = useNavigate();
    const middleware = useNotificationMiddleware();
    const quick = useQuickNotifications();
    const { refreshUserFromBackend } = useUser();

    const handleLogin = async () => {
        if (identifier.length < 3 || identifier.length > 50) {
            quick.warning('Invalid Input', 'Identifier must be between 3 and 50 characters long.');
            return;
        }

        const performLogin = async (): Promise<{ token: string; data: User }> => {
            const response = await invoke<{ token: string; data: User }>("authenticate_user", { identifier, password });
            if (!response) {
                throw new Error("Invalid credentials. Please try again.");
            }
            return response;
        };

        try {
            const response = await middleware.auth.login(performLogin, identifier);
            console.log("Login response received:", {
                hasResponse: !!response,
                hasToken: !!(response?.token),
                hasData: !!(response?.data),
                dataId: response?.data?.id,
                dataIdType: typeof response?.data?.id
            });

            if (response) {
                token_secure(response);
                await invoke('save_token_command', {
                    token: sessionStorage.getItem('token'),
                    user: sessionStorage.getItem('user')
                });

                // Get updated user session with fresh last_login time
                try {
                    console.log("Fetching updated user session after login...");

                    // Validate response structure before proceeding
                    if (!response || !response.data || !response.data.id) {
                        console.warn("Invalid response structure, skipping user session update");
                        throw new Error("Invalid response structure");
                    }

                    const userId = response.data.id.toString();
                    console.log("Using userId for session update:", userId);

                    const updatedResponse = await invoke<{ token: string; data: User }>('update_user_session', {
                        userId: userId,
                        tokenData: sessionStorage.getItem('token'),
                    });

                    if (updatedResponse) {
                        console.log("Updated user session received:", updatedResponse);
                        token_secure(updatedResponse);
                        await invoke('save_token_command', {
                            token: sessionStorage.getItem('token'),
                            user: sessionStorage.getItem('user')
                        });
                    }
                } catch (updateError) {
                    console.warn("Failed to get updated user session:", updateError);
                    // Continue with original login flow even if update fails
                }

                // Dispatch custom event to notify UserContext of data change
                window.dispatchEvent(new CustomEvent('userDataChanged'));

                // Refresh UserContext with fresh user data from backend (includes updated last_login)
                await refreshUserFromBackend();

                setIsAuthenticated(true);
                navigate("/");
            }
        } catch (error) {
            console.error("Login failed:", error);
            // Error is already handled by the middleware
        }
    };

    const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ' ') e.preventDefault();
    };

    const handleSignupRedirect = async () => {
        try {
            await invoke('open_url', { url: 'https://cosmosecure.vercel.app/signup' });
        } catch (error) {
            console.error('Failed to open signup URL:', error);
            quick.error('Error', 'Failed to open signup page. Please visit https://cosmosecure.vercel.app/signup manually.');
        }
    };

    const handleForgotPasswordRedirect = async () => {
        try {
            await invoke('open_url', { url: 'https://cosmosecure.vercel.app/forgot-password' });
        } catch (error) {
            console.error('Failed to open forgot password URL:', error);
            quick.error('Error', 'Failed to open forgot password page. Please visit https://cosmosecure.vercel.app/forgot-password manually.');
        }
    };

    return (
        <div className="w-full h-full flex justify-center items-center bg-theme-background text-theme-text rounded-md">
            <div className="max-w-4xl w-full h-5/6 m-2 mx-auto border border-theme-secondary-transparent rounded-lg shadow-lg bg-theme-primary-transparent grid grid-cols-[3fr,4fr]">
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
                            src={Logo}
                            alt="Logo"
                            className="w-auto h-auto object-contain mx-auto"
                        />
                    </div>
                    <div className="mx-8">
                        <h2 className="text-2xl font-bold text-center mb-6 text-theme-text">Welcome Back!</h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Username or Email"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full p-3 border border-theme-secondary-transparent rounded-lg bg-theme-background text-theme-text"
                                />
                            </div>
                            <div className="mb-4 relative">
                                <input
                                    type={passwordVisible ? "text" : "password"}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full p-3 border border-theme-secondary-transparent rounded-lg bg-theme-background text-theme-text pr-10"
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
                                className="w-full p-3 bg-theme-primary text-theme-text font-bold rounded-lg hover:bg-theme-secondary"
                            >
                                Login
                            </button>
                        </form>

                        {/* Forgot Password */}
                        <div className="mt-4 text-center">
                            <button
                                onClick={handleForgotPasswordRedirect}
                                className="text-theme-accent hover:text-[#019690] font-semibold"
                            >
                                Forgot Password?
                            </button>
                        </div>

                        {/* Signup */}
                        <div className="mt-2 text-center">
                            Don't have an account?{" "}
                            <button
                                onClick={handleSignupRedirect}
                                className="text-theme-accent hover:text-[#019690] font-semibold"
                            >
                                Signup
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;