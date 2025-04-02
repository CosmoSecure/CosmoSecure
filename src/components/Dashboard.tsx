import React, { useEffect, useState } from 'react';
import { Pro } from '../assets/';
import { decryptUser } from './auth/token_secure';
import { invoke } from '@tauri-apps/api/core';
import CakeIcon from '@mui/icons-material/Cake';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import PasswordIcon from '@mui/icons-material/Password';
import { List, ListItemButton, ListItemIcon, ListItemText, Collapse, TextField, Button } from '@mui/material';
import { ExpandLess, ExpandMore, Warning as WarningIcon } from '@mui/icons-material';

// Fetch total passwords
const fetchTotalPasswords = async (userId: string): Promise<number> => {
    try {
        const entries: { entry_id: string }[] = await invoke('get_password_entries', { userId });
        return entries.length;
    } catch (error) {
        console.error('Error fetching total passwords:', error);
        return 0;
    }
};

// Fetch weak passwords
const fetchWeakPasswords = async (userId: string): Promise<string[]> => {
    try {
        const entries: { entry_id: string, password: string }[] = await invoke('get_password_entries', { userId });
        return entries.filter(entry => entry.password.length < 8).map(entry => entry.password);
    } catch (error) {
        console.error('Error fetching weak passwords:', error);
        return [];
    }
};

// Dashboard Component
const Dashboard: React.FC = () => {
    const [username, setUsername] = useState('');
    const [joinDate, setJoinDate] = useState('');
    const [email, setEmail] = useState('');
    const [totalPasswords, setTotalPasswords] = useState(0);
    const [weakPasswords, setWeakPasswords] = useState<string[]>([]);
    const [openWeakPasswords, setOpenWeakPasswords] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [passLen, setPassLen] = useState(8);

    // Fetch user data & passwords
    useEffect(() => {
        try {
            const user = decryptUser();
            if (user && user.name && user.created_at) {
                setUsername(user.name);
                setEmail(user.email);
                const createdAt = new Date(parseInt(user.created_at.$date.$numberLong));
                const formattedDate = `${String(createdAt.getDate()).padStart(2, '0')}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${createdAt.getFullYear()}`;
                setJoinDate(formattedDate);

                fetchTotalPasswords(user.username).then(setTotalPasswords);
                fetchWeakPasswords(user.username).then(setWeakPasswords);
            }
        } catch (error) {
            console.error('Error decrypting user data:', error);
        }
    }, []);

    // Periodically update password count
    useEffect(() => {
        const updatePasswordCount = () => {
            const passwordCount = sessionStorage.getItem('p_count');
            setTotalPasswords(passwordCount ? parseInt(passwordCount) : 0);
        };

        updatePasswordCount();
        const intervalId = setInterval(updatePasswordCount, 2000);
        return () => clearInterval(intervalId);
    }, []);

    // Handle password generation
    const handleGeneratePassword = async () => {
        try {
            const result = await invoke<{ password: string }>('generate_password', { length: passLen });
            setGeneratedPassword(result.password);
        } catch (error) {
            console.error('Failed to generate password:', error);
        }
    };

    return (
        <div className="bg-theme-background flex flex-col h-full w-full p-6 rounded-md">
            {/* Main Layout: 2:1 Column Split */}
            <div className="grid grid-cols-3 gap-6 h-full">

                {/* Left Side (Takes 2 Parts) */}
                <div className="col-span-2 flex flex-col gap-6">

                    {/* Profile & Password Storage (1:3 Ratio in a Row) */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Profile Section (1 Part) */}
                        <div className="grid grid-cols-3 gap-5 bg-gradient-to-r from-theme-secondary-transparent via-theme-primary to-theme-secondary-transparent p-6 rounded-lg items-center">
                            {/* Profile Image - Hidden when width is below 300px */}
                            <img
                                src={Pro}
                                alt="Profile"
                                className="rounded-full h-24 w-24 hidden xl:block"
                            />

                            {/* Profile Details (Take Full Width When Image is Hidden) */}
                            <div className="ml-4 col-span-2 min-[300px]:col-span-2">
                                <div className="text-3xl font-bold">{username}</div>
                                <div className="flex flex-col gap-2 mt-2">
                                    <div className="text-xl flex items-center">
                                        <CakeIcon className="mr-1" /> {joinDate}
                                    </div>
                                    <div className="text-xl flex items-center">
                                        <AlternateEmailIcon className="mr-1" /> {email}
                                    </div>
                                    <div className="text-xl flex items-center">
                                        <PasswordIcon className="mr-1" /> {totalPasswords}
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Password Storage Section (3 Parts) */}
                        <div className="bg-theme-primary-transparent p-6 rounded-lg flex flex-col items-center justify-center">
                            <h1 className="text-xl font-bold">Password Storage</h1>
                            <div className="w-full bg-gray-300 rounded-full h-4 mt-2">
                                <div
                                    className="bg-ultra-violet h-4 rounded-full"
                                    style={{ width: `${(totalPasswords / 25) * 100}%` }}
                                ></div>
                            </div>
                            <p className="text-lg mt-2">{totalPasswords} / 25</p>
                        </div>
                    </div>

                    {/* Password Generator Section (Takes Full Width Below) */}
                    <div className="bg-theme-primary-transparent p-6 rounded-lg flex flex-col items-center h-full">
                        <h1 className="text-2xl font-bold mb-4">Password Generator</h1>
                        <TextField
                            label="Password Length"
                            type="number"
                            value={passLen}
                            onChange={(e) => setPassLen(parseInt(e.target.value))}
                            variant="standard"
                            InputProps={{ style: { color: 'var(--theme-text)' } }}
                            InputLabelProps={{ style: { color: 'var(--theme-text)' } }}
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
                                InputProps={{ readOnly: true, style: { color: 'var(--theme-text)' } }}
                                InputLabelProps={{ style: { color: 'var(--theme-text)' } }}
                                className="mt-4"
                            />
                        )}
                    </div>
                </div>

                {/* Right Side (Takes 1 Part) */}
                <div className="col-span-1 flex flex-col h-fit bg-theme-primary-transparent p-4 rounded-lg shadow-lg">
                    <ListItemButton
                        onClick={() => setOpenWeakPasswords(!openWeakPasswords)}
                        className="text-theme-text font-bold p-4 rounded-lg flex justify-between items-center bg-transparent hover:rounded-lg"
                    >
                        <span>Weak Passwords ({weakPasswords.length})</span>
                        {openWeakPasswords ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>

                    <Collapse in={openWeakPasswords} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding className="bg-gray-100 rounded-lg mt-2 shadow-inner">
                            {weakPasswords.length > 0 ? (
                                weakPasswords.map((password, index) => (
                                    <ListItemButton key={index} className="hover:text-black border-b border-gray-300">
                                        <ListItemIcon>
                                            <WarningIcon color="error" />
                                        </ListItemIcon>
                                        <ListItemText primary={`Password ${index + 1}: ${password}`} />
                                    </ListItemButton>
                                ))
                            ) : (
                                <div className="text-gray-700 p-4 text-center">No weak passwords found</div>
                            )}
                        </List>
                    </Collapse>
                </div>

            </div>
        </div>

    );
};

export default Dashboard;
