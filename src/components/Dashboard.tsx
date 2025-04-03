import React, { useEffect, useState, useCallback } from 'react';
import { Pro } from '../assets/';
import { decryptUser } from './auth/token_secure';
import { invoke } from '@tauri-apps/api/core';
import CakeIcon from '@mui/icons-material/Cake';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import PasswordIcon from '@mui/icons-material/Password';
import { List, ListItemButton, ListItemIcon, ListItemText, Collapse, TextField, Button } from '@mui/material';
import { ExpandLess, ExpandMore, Warning as WarningIcon } from '@mui/icons-material';

// API Functions
const fetchTotalPasswords = async (userId: string) => {
    try {
        const entries = await invoke<{ entry_id: string }[]>('get_password_entries', { userId });
        return entries.length;
    } catch (error) {
        console.error('Error fetching total passwords:', error);
        return 0;
    }
};

const fetchWeakPasswords = async (userId: string) => {
    try {
        const entries = await invoke<{ entry_id: string, password: string }[]>('get_password_entries', { userId });
        const weakPasswords = await Promise.all(
            entries.map(async (entry) => {
                const strength = await invoke<{ score: number }>('check_password_strength', {
                    password: entry.password
                });
                return strength.score < 3 ? {
                    password: entry.password,
                    score: strength.score
                } : null;
            })
        );
        return weakPasswords.filter(Boolean);
    } catch (error) {
        console.error('Error fetching weak passwords:', error);
        return [];
    }
};

// Dashboard Component
const Dashboard: React.FC = () => {
    const [userData, setUserData] = useState({
        username: '',
        email: '',
        joinDate: '',
        userId: '',
    });

    const [passwordStats, setPasswordStats] = useState({
        totalPasswords: 0,
        weakPasswords: [] as { password: string; score: number }[],
    });

    const [openWeakPasswords, setOpenWeakPasswords] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [passLen, setPassLen] = useState(8);

    // Fetch user data once
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = decryptUser();
                if (user && user.name && user.created_at) {
                    const formattedDate = new Date(parseInt(user.created_at.$date.$numberLong))
                        .toLocaleDateString('en-GB');

                    setUserData({
                        username: user.name,
                        email: user.email,
                        joinDate: formattedDate,
                        userId: user.user_id,
                    });
                }
            } catch (error) {
                console.error('Error decrypting user data:', error);
            }
        };

        fetchUserData();
    }, []);

    // Fetch password statistics (optimized)
    const fetchPasswordStats = useCallback(async () => {
        if (!userData.userId) return;

        try {
            const [total, weak] = await Promise.all([
                fetchTotalPasswords(userData.userId),
                fetchWeakPasswords(userData.userId),
            ]);

            setPasswordStats({ totalPasswords: total, weakPasswords: weak.filter((entry): entry is { password: string; score: number } => entry !== null) });
        } catch (error) {
            console.error('Error fetching password stats:', error);
        }
    }, [userData.userId]);

    // Fetch password stats initially and then every 10 seconds
    useEffect(() => {
        fetchPasswordStats();
        const interval = setInterval(fetchPasswordStats, 10000);
        return () => clearInterval(interval);
    }, [fetchPasswordStats]);

    // Handle password generation
    const handleGeneratePassword = async () => {
        try {
            const { password } = await invoke<{ password: string }>('generate_password', { length: passLen });
            setGeneratedPassword(password);
        } catch (error) {
            console.error('Failed to generate password:', error);
        }
    };

    return (
        <div className="bg-theme-background flex flex-col h-full w-full p-6 rounded-md">
            <div className="grid grid-cols-3 gap-6 h-full">
                {/* Left Side (2/3 width) */}
                <div className="col-span-2 flex flex-col gap-6">
                    {/* Profile & Password Storage */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Profile Section */}
                        <div className="grid grid-cols-3 gap-5 bg-gradient-to-r from-theme-secondary-transparent via-theme-primary to-theme-secondary-transparent p-6 rounded-lg items-center">
                            <img src={Pro} alt="Profile" className="rounded-full h-24 w-24 hidden xl:block" />
                            <div className="ml-4 col-span-2">
                                <div className="text-3xl font-bold">{userData.username}</div>
                                <div className="flex flex-col gap-2 mt-2">
                                    <div className="text-xl flex items-center">
                                        <CakeIcon className="mr-1" /> {userData.joinDate}
                                    </div>
                                    <div className="text-xl flex items-center">
                                        <AlternateEmailIcon className="mr-1" /> {userData.email}
                                    </div>
                                    <div className="text-xl flex items-center">
                                        <PasswordIcon className="mr-1" /> {passwordStats.totalPasswords}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Password Storage Section */}
                        <div className="bg-theme-primary-transparent p-6 rounded-lg flex flex-col items-center">
                            <h1 className="text-xl font-bold">Password Storage</h1>
                            <div className="w-full bg-gray-300 rounded-full h-4 mt-2">
                                <div
                                    className="bg-ultra-violet h-4 rounded-full"
                                    style={{ width: `${(passwordStats.totalPasswords / 25) * 100}%` }}
                                ></div>
                            </div>
                            <p className="text-lg mt-2">{passwordStats.totalPasswords} / 25</p>
                        </div>
                    </div>

                    {/* Password Generator */}
                    <div className="bg-theme-primary-transparent p-6 rounded-lg flex flex-col items-center h-full">
                        <h1 className="text-2xl font-bold mb-4">Password Generator</h1>
                        <TextField
                            label="Password Length"
                            type="number"
                            value={passLen}
                            onChange={(e) => setPassLen(parseInt(e.target.value))}
                            variant="standard"
                            className="mb-4"
                        />
                        <Button onClick={handleGeneratePassword} variant="contained" color="primary">
                            Generate Password
                        </Button>
                        {generatedPassword && (
                            <TextField
                                label="Generated Password"
                                value={generatedPassword}
                                variant="standard"
                                InputProps={{ readOnly: true }}
                                className="mt-4"
                            />
                        )}
                    </div>
                </div>

                {/* Right Side (1/3 width) */}
                <div className="col-span-1 flex flex-col h-fit bg-theme-primary-transparent p-4 rounded-lg shadow-lg">
                    <ListItemButton
                        onClick={() => setOpenWeakPasswords(!openWeakPasswords)}
                        className="text-theme-text font-bold p-4 rounded-lg flex justify-between items-center bg-transparent hover:rounded-lg"
                    >
                        <span>Weak Passwords ({passwordStats.weakPasswords.length})</span>
                        {openWeakPasswords ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>

                    <Collapse in={openWeakPasswords} timeout="auto" unmountOnExit>
                        <List
                            component="div"
                            disablePadding
                            className="bg-transparent rounded-lg mt-2 shadow-inner overflow-y-auto max-h-[calc(100vh-180px)] space-y-2 p-2"
                        >
                            {passwordStats.weakPasswords.length > 0 ? (
                                passwordStats.weakPasswords.map((entry, index) => (
                                    <ListItemButton
                                        key={index}
                                        sx={{
                                            borderRadius: '8px',
                                            bgcolor: 'rgba(255, 255, 255, 0.3)',
                                        }}
                                        className="hover:text-theme-text rounded-lg p-3 flex items-center gap-3"
                                    >
                                        <ListItemIcon>
                                            <WarningIcon color="error" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={`Password ${index + 1}: ${entry.password}`}
                                            secondary={`Strength Score: ${entry.score}/4`}
                                        />
                                    </ListItemButton>
                                ))
                            ) : (
                                <div className="text-theme-text-transparent p-4 text-center">
                                    No weak passwords found
                                </div>
                            )}
                        </List>
                    </Collapse>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
