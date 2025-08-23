import React, { useEffect, useState } from 'react';
import { Pro } from '../assets/';
import { useUser } from '../contexts/UserContext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CakeIcon from '@mui/icons-material/Cake';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import DoubleArrowIcon from '@mui/icons-material/DoubleArrow';
import PasswordIcon from '@mui/icons-material/Password';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';

// Fetch total passwords using the new stats function
const fetchTotalPasswords = async (userId: string): Promise<number> => {
    try {
        console.log("userID : ", userId);
        const stats = await invoke<{
            total_passwords: number;
            weak_passwords_count: number;
            weak_entries: Array<any>;
        }>('get_password_stats', { ui: userId });
        return stats.total_passwords;
    } catch (error) {
        console.error('Error fetching total passwords:', error);
        return 0;
    }
};

const Profile: React.FC<{ isVisible: boolean; onClose: () => void }> = ({ isVisible, onClose }) => {
    const { user, isLoading } = useUser();
    const [totalPasswords, setTotalPasswords] = useState(0);

    useEffect(() => {
        if (!isVisible || !user?.userId) return; // Only fetch data when the profile is visible and user is available

        const initializeData = async () => {
            try {
                // Fetch total passwords directly from the backend
                const total = await fetchTotalPasswords(user.userId);
                setTotalPasswords(total);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        initializeData();
    }, [isVisible, user?.userId]); // Run this effect when `isVisible` or `user.userId` changes

    if (!user && !isLoading) {
        return null; // Don't render if user data is not available
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop with fade animation */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black bg-opacity-50 z-20"
                        onClick={onClose}
                    />

                    {/* Profile Panel with slide animation */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed top-0 right-0 rounded-xl w-2/5 bg-theme-background opacity-90
                            shadow-lg z-30"
                    >
                        <motion.main className="relative h-full flex flex-col items-center rounded-xl mb-4">
                            {/* Header gradient with slide up animation */}
                            <motion.div
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className='h-28 w-full bg-gradient-to-r from-theme-secondary-transparent 
                                    via-theme-primary to-theme-secondary-transparent rounded-tl-xl rounded-tr-md'
                            />

                            {/* Close button with fade animation */}
                            <motion.button
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                onClick={onClose}
                                className="absolute top-4 left-4 bg-transparent border-2 
                                    border-gray-500 text-white p-2 rounded-xl"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <DoubleArrowIcon />
                            </motion.button>

                            <div className="relative flex flex-col items-center">
                                {/* Profile image with pop animation */}
                                <motion.img
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 260,
                                        damping: 20,
                                        delay: 0.4
                                    }}
                                    src={Pro}
                                    alt=""
                                    className='rounded-full h-32 w-32 absolute top-[-4rem] z-10'
                                />

                                {/* Profile info with staggered fade in */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="mt-20 text-center text-theme-text"
                                >
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="text-3xl font-bold text-center"
                                    >
                                        {user?.name || 'User'}
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                        className="text-xl mt-2 flex justify-center items-center break-all"
                                    >
                                        <AccountCircleIcon className="mr-2" /> {user?.username || 'N/A'}
                                    </motion.div>

                                    {/* Staggered info items */}
                                    {[
                                        { Icon: CakeIcon, text: user?.joinDate || 'N/A' },
                                        { Icon: AlternateEmailIcon, text: user?.email || 'N/A' },
                                        { Icon: PasswordIcon, text: totalPasswords },
                                        { Icon: HourglassEmptyIcon, text: user?.lastLogin || 'N/A' }
                                    ].map(({ Icon, text }, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.7 + (index * 0.1) }}
                                            className="text-xl mt-2 flex justify-center break-all"
                                        >
                                            <Icon className="mr-2" /> {text}
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>
                        </motion.main>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Profile;