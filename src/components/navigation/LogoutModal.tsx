import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';

// Custom hook for logout functionality
export const useLogoutModal = () => {
    const [showLogoutPopup, setShowLogoutPopup] = useState(false);
    const navigate = useNavigate();

    const showLogout = () => {
        setShowLogoutPopup(true);
    };

    const handleLogout = async () => {
        try {
            // Call Tauri delete_config function
            await invoke('delete_config');

            setShowLogoutPopup(false);

            // Additional logout logic:
            // - Clear authentication tokens
            // - Clear user data from context/localStorage
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');

            console.log('Logout confirmed and config deleted');
            navigate('/login');
        } catch (error) {
            console.error('Error during logout:', error);
            setShowLogoutPopup(false);
            navigate('/login');
        }
    };

    const handleCancel = () => {
        setShowLogoutPopup(false);
    };

    const LogoutModalComponent = () => (
        <>
            {showLogoutPopup && (
                <div className="fixed inset-0 bg-black/40 rounded-lg backdrop-blur-sm flex items-center justify-center z-[1000]">
                    <div className="bg-theme-background border border-theme-accent rounded-xl shadow-2xl min-w-[350px] max-w-[400px] mx-4 transform transition-all duration-300 scale-100">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-theme-secondary-transparent via-theme-primary to-theme-secondary-transparent p-6 rounded-t-xl">
                            <h3 className="text-theme-text text-xl font-bold text-center">
                                Confirm Logout
                            </h3>
                        </div>

                        {/* Content */}
                        <div className="p-6 bg-theme-background-transparent rounded-b-xl">
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-16 h-16 bg-theme-accent-transparent rounded-full flex items-center justify-center">
                                    <svg
                                        className="w-8 h-8 text-theme-text"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </div>
                            </div>

                            <p className="text-theme-text text-center text-lg mb-6">
                                Are you sure you want to logout?
                            </p>

                            <p className="text-theme-text-transparent text-center text-sm mb-6">
                                This will clear your session and all stored user data.
                            </p>

                            {/* Buttons */}
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={handleCancel}
                                    className="px-6 py-3 bg-theme-accent-transparent hover:bg-theme-accent text-theme-text font-semibold rounded-lg border border-theme-accent transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                                >
                                    Logout!
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    return {
        showLogout,
        LogoutModalComponent
    };
};