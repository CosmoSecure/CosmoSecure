import React, { useEffect, useState } from 'react';
import { Pro } from '../assets/';
import { decryptUser } from './auth/token_secure';
import CakeIcon from '@mui/icons-material/Cake';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import PasswordIcon from '@mui/icons-material/Password';
import { invoke } from '@tauri-apps/api/core';

// Function to fetch the total number of passwords
const fetchTotalPasswords = async (userId: string): Promise<number> => {
    try {
        const entries: { entry_id: string }[] = await invoke('get_password_entries', { userId });
        return entries.length;
    } catch (error) {
        console.error('Error fetching total passwords:', error);
        return 0;
    }
};

const Dashboard: React.FC = () => {
    const [username, setUsername] = useState('');
    const [joinDate, setJoinDate] = useState('');
    const [email, setEmail] = useState('');
    const [totalPasswords, setTotalPasswords] = useState(0);

    useEffect(() => {
        try {
            const user = decryptUser();
            if (user && user.name && user.created_at) {
                setUsername(user.name);
                setEmail(user.email);
                const createdAt = new Date(parseInt(user.created_at.$date.$numberLong));
                const formattedDate = `${String(createdAt.getDate()).padStart(2, '0')}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${createdAt.getFullYear()}`;
                setJoinDate(formattedDate);
                console.log('User data decrypted:', user);

                // Fetch the total number of passwords
                fetchTotalPasswords(user.username).then((total) => {
                    setTotalPasswords(total);
                }).catch((error) => {
                    console.error('Error fetching total passwords:', error);
                });
            } else {
                console.error('No user found in decrypted data');
            }
        } catch (error) {
            console.error('Error decrypting or parsing user data:', error);
        }
    }, []);

    return (
        <div className="bg-theme-background flex flex-col h-full w-full items-center">
            {/* Profile Box */}
            <div className="w-[95%] h-32 p-4 m-4 rounded-xl bg-gradient-to-r from-theme-secondary-transparent via-theme-primary to-theme-secondary-transparent flex items-center">
                <img src={Pro} alt="Profile" className="rounded-full h-24 w-24" />
                <div className="ml-4 text-center flex-1">
                    <div className="text-3xl font-bold">{username}</div>
                    <div className="flex justify-center gap-10 mt-2">
                        <div className="text-xl hidden xl:flex items-center">
                            <CakeIcon className="mr-1 mb-2" /> {joinDate}
                        </div>
                        <div className="text-xl flex items-center">
                            <AlternateEmailIcon className="mr-1 mb-2" /> {email}
                        </div>
                        <div className="text-xl flex items-center">
                            <PasswordIcon className="mr-1 mb-2" /> {totalPasswords}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="bg-theme-background grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 py-6 w-full">
                <div className="bg-theme-primary-transparent h-[200px] rounded-md flex justify-center items-center text-theme-text">
                    <h1>Dashboard</h1>
                </div>
                <div className="bg-theme-primary-transparent h-[200px] rounded-md flex justify-center items-center text-theme-text">
                    <h1>Dashboard</h1>
                </div>
                <div className="bg-theme-primary-transparent h-[200px] rounded-md flex justify-center items-center text-theme-text">
                    <h1>Dashboard</h1>
                </div>
                <div className="bg-theme-primary-transparent h-[200px] rounded-md flex justify-center items-center text-theme-text">
                    <h1>Dashboard</h1>
                </div>
                <div className="bg-theme-primary-transparent h-[200px] rounded-md flex justify-center items-center text-theme-text">
                    <h1>Dashboard</h1>
                </div>
                <div className="bg-theme-primary-transparent h-[200px] rounded-md flex justify-center items-center text-theme-text">
                    <h1>Dashboard</h1>
                </div>
                <div className="bg-theme-primary-transparent h-[200px] rounded-md flex justify-center items-center text-theme-text">
                    <h1>Dashboard</h1>
                </div>
                <div className="bg-theme-primary-transparent h-[200px] rounded-md flex justify-center items-center text-theme-text">
                    <h1>Dashboard</h1>
                </div>
                <div className="bg-theme-primary-transparent h-[200px] rounded-md flex justify-center items-center text-theme-text">
                    <h1>Dashboard</h1>
                </div>
                <div className="bg-theme-primary-transparent h-[200px] rounded-md flex justify-center items-center text-theme-text">
                    <h1>Dashboard</h1>
                </div>
                <div className="bg-theme-primary-transparent h-[200px] rounded-md flex justify-center items-center text-theme-text">
                    <h1>Dashboard</h1>
                </div>
                <div className="bg-theme-primary-transparent h-[200px] rounded-md flex justify-center items-center text-theme-text">
                    <h1>Dashboard</h1>
                </div>
                <div className="bg-theme-primary-transparent h-[200px] rounded-md flex justify-center items-center text-theme-text">
                    <h1>Dashboard</h1>
                </div>
                <div className="bg-theme-primary-transparent h-[200px] rounded-md flex justify-center items-center text-theme-text">
                    <h1>Dashboard</h1>
                </div>
                <div className="bg-theme-primary-transparent h-[200px] rounded-md flex justify-center items-center text-theme-text">
                    <h1>Dashboard</h1>
                </div>
                <div className="bg-theme-primary-transparent h-[200px] rounded-md flex justify-center items-center text-theme-text">
                    <h1>Dashboard</h1>
                </div>
                <div className="bg-theme-primary-transparent h-[200px] rounded-md flex justify-center items-center text-theme-text">
                    <h1>Dashboard</h1>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;