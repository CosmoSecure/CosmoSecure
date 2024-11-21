import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';
import { VisibilityOffTwoToneIcon, VisibilityTwoToneIcon } from './passCSS';
import { signup_token_secure } from './token_secure';

function debounce(func: (...args: any[]) => void, wait: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

const Signup: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [twoFactorSecret, setTwoFactorSecret] = useState('');
    const [message, setMessage] = useState('');
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const navigate = useNavigate();

    const checkUsernameAvailability = async (username: string) => {
        if (username === '' || username === null) {
            setUsernameAvailable(null);
            return;
        }
        try {
            const available = await invoke<boolean>('check_username_availability', { username });
            setUsernameAvailable(available);
        } catch (error) {
            console.error('Error checking username availability:', error);
        }
    };

    const debouncedCheckUsernameAvailability = debounce(checkUsernameAvailability, 300);

    useEffect(() => {
        if (username) {
            debouncedCheckUsernameAvailability(username);
        } else {
            setUsernameAvailable(null);
        }
    }, [username]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (username.length < 3 || username.length > 15) {
            setMessage('Username must be between 3 and 15 characters long.');
            return;
        }

        if (password.length < 6) {
            setMessage('Password must be at least 6 characters long.');
            return;
        }

        try {
            const response = await invoke<{ token: string }>('tauri_add_user', {
                username,
                password,
                twoFactorSecret: twoFactorSecret || null,
            });
            signup_token_secure(response);
            sessionStorage.setItem('username', username);   // Save username
            navigate('/'); // Navigate to the main app
        } catch (error) {
            setMessage(`Error adding user: ${error}`);
        }
    };

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ' ') e.preventDefault();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-full bg-gray-100">
            <h2 className="text-2xl font-bold mb-4">Signup</h2>
            <form onSubmit={handleSignup} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
                <div className="mb-4">
                    <label htmlFor="username" className="block text-gray-700">Username:</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={handleKeyDown}
                        required
                        className="mt-1 p-2 w-full border rounded"
                    />
                    {usernameAvailable === null ? null : usernameAvailable ? (
                        <p className="text-green-500">Username is available</p>
                    ) : (
                        <p className="text-red-500">Username is already taken</p>
                    )}
                </div>
                <div className="mb-4 relative">
                    <label htmlFor="password" className="block text-gray-700">Password:</label>
                    <input
                        type={passwordVisible ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        required
                        className="mt-1 p-2 w-full border rounded"
                    />
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 px-3 py-2 text-gray-600"
                    >
                        {passwordVisible ? <VisibilityOffTwoToneIcon /> : <VisibilityTwoToneIcon />}
                    </button>
                </div>
                <div className="mb-4">
                    <label htmlFor="twoFactorSecret" className="block text-gray-700">Two Factor Secret (optional):</label>
                    <input
                        type="text"
                        id="twoFactorSecret"
                        value={twoFactorSecret}
                        onChange={(e) => setTwoFactorSecret(e.target.value)}
                        className="mt-1 p-2 w-full border rounded"
                    />
                </div>
                <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">Signup</button>
            </form>
            <div className="mt-4 text-center">
                <p>
                    Already have an account?{' '}
                    <button
                        onClick={() => navigate('/')}
                        className="text-blue-500 hover:underline"
                    >
                        Login
                    </button>
                </p>
            </div>
            {message && <p className="mt-4 text-center text-red-500">{message}</p>}
        </div>
    );
};

export default Signup;
