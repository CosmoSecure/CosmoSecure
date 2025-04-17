import React, { useEffect, useState, useCallback } from 'react';
import { Pro } from '../assets/';
import { decryptUser } from './auth/token_secure';
import { invoke } from '@tauri-apps/api/core';
import CakeIcon from '@mui/icons-material/Cake';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import PasswordIcon from '@mui/icons-material/Password';
import { List, ListItemButton, ListItemIcon, ListItemText, Collapse } from '@mui/material';
import { ExpandLess, ExpandMore, Warning as WarningIcon } from '@mui/icons-material';

// API Functions
const fetchTotalPasswords = async (userId: string) => {
    try {
        const entries = await invoke<{ entry_id: string }[]>('get_password_entries', { ui: userId });
        return entries.length;
    } catch (error) {
        console.error('Error fetching total passwords:', error);
        return 0;
    }
};

const fetchWeakPasswords = async (userId: string) => {
    try {
        const entries = await invoke<{ aid: string; ap: string; aps: number }[]>('get_password_entries', { ui: userId });

        // Filter weak passwords directly based on `aps` (strength score)
        const weakPasswords = entries
            .filter(entry => entry.aps < 3) // Weak passwords have a strength score less than 3
            .map(entry => ({
                password: entry.ap,
                score: entry.aps,
            }));

        console.log("Weak passwords:", weakPasswords); // Debugging log
        return weakPasswords;
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

    // Fetch user data once when the component is mounted
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = decryptUser();
                if (user && user.n && user.c) {
                    const formattedDate = new Date(parseInt(user.c.$date.$numberLong))
                        .toLocaleDateString('en-GB');

                    setUserData({
                        username: user.n,
                        email: user.email,
                        joinDate: formattedDate,
                        userId: user.ui,
                    });
                }
            } catch (error) {
                console.error('Error decrypting user data:', error);
            }
        };

        fetchUserData();
    }, []);

    // Fetch password statistics when the component is opened
    useEffect(() => {
        const fetchPasswordStats = async () => {
            if (!userData.userId) return;

            try {
                const [total, weak] = await Promise.all([
                    fetchTotalPasswords(userData.userId),
                    fetchWeakPasswords(userData.userId),
                ]);

                setPasswordStats({
                    totalPasswords: total,
                    weakPasswords: weak.filter((entry): entry is { password: string; score: number } => entry !== null),
                });
            } catch (error) {
                console.error('Error fetching password stats:', error);
            }
        };

        fetchPasswordStats();
    }, [userData.userId]); // Fetch stats only when `userId` is available

    return (
        <div className="bg-theme-background flex flex-col h-full w-full p-6 rounded-md">
            <div className="grid grid-cols-3 gap-6 h-full">
                {/* Left Side (2/3 width) */}
                <div className="col-span-2 flex flex-col gap-6">
                    {/* Profile & Password Storage */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Profile Section */}
                        <div className="flex flex-row gap-5 bg-gradient-to-r from-theme-secondary-transparent via-theme-primary to-theme-secondary-transparent py-4 px-0 rounded-lg items-center">
                            <img src={Pro} alt="Profile" className="rounded-full h-24 w-24 hidden xl:block ml-6" />
                            <div className="ml-4 col-span-2">
                                <div className="text-2xl font-bold">{userData.username}</div>
                                <div className="flex flex-col gap-2 mt-2">
                                    <div className="text-lg flex items-center">
                                        <CakeIcon className="mr-1" /> {userData.joinDate}
                                    </div>
                                    <div className="text-lg flex items-center break-all">
                                        <AlternateEmailIcon className="mr-1" />
                                        <span className="break-all">{userData.email}</span>
                                    </div>
                                    <div className="text-lg flex items-center">
                                        <PasswordIcon className="mr-1" /> {passwordStats.totalPasswords}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Password Storage Section */}
                        <div className="bg-theme-primary-transparent p-6 rounded-lg flex flex-col items-center justify-center">
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

                    {/* Future Features */}
                    <div className="bg-theme-primary-transparent p-6 rounded-lg flex flex-col items-center justify-center h-full text-gray-500">
                        <h1 className="text-2xl font-bold mb-4">Future Features</h1>
                        <p className="text-center text-lg">
                            This section is reserved for upcoming features. Stay tuned for updates!
                        </p>
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
