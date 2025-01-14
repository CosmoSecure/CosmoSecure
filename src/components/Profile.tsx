import React, { useEffect, useState } from 'react';
import { Pro } from '../assets/';
import { decryptUser } from './auth/token_secure';
import CakeIcon from '@mui/icons-material/Cake';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import DoubleArrowIcon from '@mui/icons-material/DoubleArrow';
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

const Profile: React.FC<{ isVisible: boolean; onClose: () => void }> = ({ isVisible, onClose }) => {
    const [username, setUsername] = useState('');
    const [joinDate, setJoinDate] = useState('');
    const [email, setEmail] = useState('');
    const [totalPasswords, setTotalPasswords] = useState(0);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        const initializeData = async () => {
            try {
                const user = decryptUser();
                if (user && user.name && user.created_at) {
                    setUsername(user.name);
                    setEmail(user.email);

                    const createdAt = new Date(parseInt(user.created_at.$date.$numberLong));
                    const formattedDate = `${String(createdAt.getDate()).padStart(2, '0')}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${createdAt.getFullYear()}`;
                    setJoinDate(formattedDate);

                    console.log('User data decrypted:', user);

                    // Fetch the initial total number of passwords
                    const initialTotal = await fetchTotalPasswords(user.username);
                    setTotalPasswords(initialTotal);

                    // Set up an interval to fetch the total passwords every 1 seconds
                    intervalId = setInterval(async () => {
                        try {
                            const updatedTotal = await fetchTotalPasswords(user.username);
                            setTotalPasswords(updatedTotal);
                        } catch (error) {
                            console.error('Error fetching total passwords in interval:', error);
                        }
                    }, 1000);
                } else {
                    console.error('No user found in decrypted data');
                }
            } catch (error) {
                console.error('Error decrypting or parsing user data:', error);
            }
        };

        initializeData();

        // Cleanup interval on component unmount
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, []);

    return (
        <div
            className={`fixed top-14 right-0 h-auto w-1/2 bg-theme-background-transparent text-theme-text transform transition-transform duration-300 ease-in-out rounded-r-md rounded-l-xl mr-[4px]`}
            style={{ transform: isVisible ? 'translateX(0)' : 'translateX(120%)' }} // Custom translation value
        >
            <main className="relative h-full flex flex-col items-center rounded-xl mb-4">
                <div className='h-28 w-full bg-gradient-to-r from-theme-secondary-transparent via-theme-primary to-theme-secondary-transparent rounded-tl-xl rounded-tr-md'></div>
                <button onClick={onClose} className="absolute top-4 left-4 bg-transparent border-2 border-gray-500 text-white p-2 rounded-xl active:scale-95">
                    <DoubleArrowIcon />
                </button>
                <div className="relative flex flex-col items-center">
                    <img src={Pro} alt="" className='rounded-full h-32 w-32 absolute top-[-4rem] z-10' />
                    <div className="mt-20 text-center">
                        <div className="text-3xl font-bold mt-2">{username}</div>
                        <div className="text-xl mt-2 flex justify-center">
                            <CakeIcon className="mr-2" /> {joinDate}
                        </div>
                        <div className="text-xl mt-2 flex justify-center">
                            <AlternateEmailIcon className="mr-2" /> {email}
                        </div>
                        <div className="text-xl mt-2 flex justify-center">
                            <PasswordIcon className="mr-2" /> {totalPasswords}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Profile;
