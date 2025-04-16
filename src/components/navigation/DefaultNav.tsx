import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes, bottomRoutes } from '../../routes';
import { decryptUser } from '../auth/token_secure';
import { Pro } from '../../assets';
// import SensorOccupiedIcon from '@mui/icons-material/SensorOccupied';

const DefaultNav: React.FC<{ toggleProfileVisibility: () => void }> = ({ toggleProfileVisibility }) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');

    useEffect(() => {
        try {
            const user = decryptUser();
            if (user && user.name) {
                setUsername(user.name);
            } else {
                console.error('No user found in decrypted data');
            }
        } catch (error) {
            console.error('Error decrypting or parsing user data:', error);
        }
    }, []);

    // Add cleanup for transitions
    useEffect(() => {
        const cleanupTransitions = () => {
            const elements = document.querySelectorAll('.transition-all');
            elements.forEach(el => {
                (el as HTMLElement).style.transition = 'none';
            });
        };

        return () => cleanupTransitions();
    }, []);

    return (
        <div className="transition-all duration-300 ease-in-out bg-theme-background-transparent group hover:w-64 w-14 h-full rounded-md flex flex-col justify-between relative z-10">
            {/* Profile Icon */}
            <div className="p-2 relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleProfileVisibility();
                    }}
                    className="relative flex flex-col items-center justify-center space-y-2 group"
                >
                    <div className="text-4xl transition-transform duration-300 group-hover:scale-150 group-hover:translate-x-24 group-hover:translate-y-3">
                        <img src={Pro} alt="Profile" className="w-10 h-10 rounded-full active:scale-95" />
                    </div>
                </button>

                {/* Username */}
                <div
                    className="absolute top-[5rem] left-[47%] -translate-x-1/2 hidden group-hover:block text-theme-text font-bold text-center text-xl transition-all duration-300 active:scale-95"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleProfileVisibility();
                    }}
                >
                    <span className="cursor-pointer">{username}</span>
                </div>
            </div>

            {/* Navigation Links */}
            <div>
                <nav className="p-2 space-y-4">
                    {routes.map((route) => (
                        <div key={route.path} className="flex gap-2">
                            {/* Icon Tile */}
                            <button
                                onClick={() => navigate(route.path)}
                                className="flex items-center justify-center text-theme-text h-[40px] w-[40px] rounded-md bg-theme-accent-transparent hover:bg-theme-accent active:scale-95"
                            >
                                <div className="text-3xl flex items-center justify-center">
                                    {route.icon ? route.icon : <span>🔗</span>}
                                </div>
                            </button>

                            {/* Label Tile */}
                            <button
                                onClick={() => navigate(route.path)}
                                className="hidden group-hover:flex items-center justify-start flex-1 text-theme-text h-[40px] rounded-md bg-theme-accent-transparent hover:bg-theme-accent active:scale-95"
                            >
                                <span className="font-bold text-lg px-4">
                                    {route.label}
                                </span>
                            </button>
                        </div>
                    ))}
                </nav>
            </div>

            {/* Bottom Links */}
            <div>
                <nav className="p-2 space-y-4">
                    {bottomRoutes.map((route) => (
                        <div key={route.path} className="flex gap-2">
                            {/* Icon Tile */}
                            <button
                                onClick={() => navigate(route.path)}
                                className="flex items-center justify-center text-theme-text h-[40px] w-[40px] rounded-md bg-theme-accent-transparent hover:bg-theme-accent active:scale-95"
                            >
                                <div className="text-3xl flex items-center justify-center">
                                    {route.icon ? route.icon : <span>🔗</span>}
                                </div>
                            </button>

                            {/* Label Tile */}
                            <button
                                onClick={() => navigate(route.path)}
                                className="hidden group-hover:flex items-center justify-start flex-1 text-theme-text h-[40px] rounded-md bg-theme-accent-transparent hover:bg-theme-accent active:scale-95"
                            >
                                <span className="font-bold text-lg px-4">
                                    {route.label}
                                </span>
                            </button>
                        </div>
                    ))}
                </nav>
            </div>
        </div>
    );
};

export default DefaultNav;