import React, { useEffect, useState } from 'react';
import { Pro } from '../assets/';
import { useUser } from '../contexts/UserContext';
import { invoke } from '@tauri-apps/api/core';
import CakeIcon from '@mui/icons-material/Cake';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import PasswordIcon from '@mui/icons-material/Password';
import { List, ListItemButton, ListItemIcon, ListItemText, Collapse } from '@mui/material';
import { ExpandLess, ExpandMore, Warning as WarningIcon } from '@mui/icons-material';
import DashboardEmailBreach from './tools/DashboardEmailBreach';

// API Functions
const fetchPasswordStats = async (userId: string) => {
    try {
        const stats = await invoke<{
            total_passwords: number;
            weak_passwords_count: number;
            weak_entries: Array<{
                aid: string;
                plt: string;
                aun: string;
                aps: number;
            }>;
        }>('get_password_stats', { ui: userId });

        return {
            totalPasswords: stats.total_passwords,
            weakPasswords: stats.weak_entries.map(entry => ({
                password: `${entry.plt} (${entry.aun})`, // Show platform name and username instead of actual password
                score: entry.aps,
            }))
        };
    } catch (error) {
        console.error('Error fetching password stats:', error);
        return {
            totalPasswords: 0,
            weakPasswords: []
        };
    }
};

// Dashboard Component
const Dashboard: React.FC = () => {
    const { user, isLoading } = useUser();
    const [email, setEmail] = useState('');

    console.log("User: ", user);

    const [passwordStats, setPasswordStats] = useState({
        totalPasswords: 0,
        weakPasswords: [] as { password: string; score: number }[],
    });

    const [openWeakPasswords, setOpenWeakPasswords] = useState(false);

    // Fetch password statistics when user data is available
    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.userId) return;

            try {
                const stats = await fetchPasswordStats(user.userId);
                setEmail(user.email);
                setPasswordStats(stats);
            } catch (error) {
                console.error('Error fetching password stats:', error);
            }
        };

        fetchStats();
    }, [user?.userId]); // Fetch stats only when `userId` is available

    if (isLoading) {
        return (
            <div className="bg-theme-background flex items-center justify-center h-full w-full p-6 rounded-md">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="bg-theme-background flex items-center justify-center h-full w-full p-6 rounded-md">
                <div className="text-xl text-red-500">Unable to load user data</div>
            </div>
        );
    }

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
                                <div className="text-xl font-bold">{user.name}</div>
                                <div className="flex flex-col gap-2 mt-2">
                                    <div className="text-base font-semibold flex items-center">
                                        <CakeIcon className="mr-1" /> {user.joinDate}
                                    </div>
                                    <div className="text-base font-semibold flex items-center break-all">
                                        <AlternateEmailIcon className="mr-1" />
                                        <span className="break-all">{user.email}</span>
                                    </div>
                                    <div className="text-base font-semibold flex items-center">
                                        <PasswordIcon className="mr-1" /> {passwordStats.totalPasswords}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Password Storage Section */}
                        <div className="bg-theme-primary-transparent p-6 rounded-lg flex flex-col items-center justify-center">
                            <h1 className="text-xl font-bold">Password Storage</h1>
                            <div className="w-full bg-theme-secondary-transparent rounded-full h-4 mt-2">
                                <div
                                    className="bg-theme-background-transparent h-4 rounded-full"
                                    style={{ width: `${(passwordStats.totalPasswords / user.maxPasswordCount) * 100}%` }}
                                ></div>
                            </div>
                            <p className="text-lg mt-2">{passwordStats.totalPasswords} / {user.maxPasswordCount}</p>
                        </div>
                    </div>

                    {/* Future Features */}
                    <div className="bg-theme-primary-transparent p-6 rounded-lg flex flex-col items-center justify-center h-full overflow-scroll">
                        {/* <h1 className="text-2xl font-bold mb-4">Future Features</h1>
                        <p className="text-center text-lg">
                            This section is reserved for upcoming features. Stay tuned for updates!
                        </p> */}
                        <DashboardEmailBreach userEmail={email} />
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
                                            paddingLeft: 1.5, // Reduce left padding
                                            paddingRight: 1.5, // Reduce right padding
                                            minHeight: 0, // Remove extra vertical space
                                        }}
                                        className="hover:text-theme-text rounded-lg flex items-center overflow-scroll"
                                    >
                                        <ListItemIcon sx={{ minWidth: 32, marginRight: 0 }}> {/* Reduce minWidth and remove right margin */}
                                            <WarningIcon color="error" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={`${entry.password}`}
                                            secondary={`Strength Score: ${entry.score}/4`}
                                            sx={{ margin: 0 }} // Remove default margin
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
