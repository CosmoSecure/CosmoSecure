import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes, bottomRoutes } from '../../routes';
import { useUser } from '../../contexts/UserContext';
import { Pro } from '../../assets';
import { useLogoutModal } from './LogoutModal';
import UpdateNotification from './UpdateNotification';

const DefaultNav: React.FC<{ toggleProfileVisibility: () => void }> = ({ toggleProfileVisibility }) => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [username, setUsername] = useState('');
    const { showLogout, LogoutModalComponent } = useLogoutModal();

    useEffect(() => {
        if (user?.name) {
            setUsername(user.name);
        }
    }, [user]);

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

    const handleNavClick = (route: any) => {
        if (route.path === '/logout') {
            showLogout();
        } else {
            navigate(route.path);
        }
    };

    return (
        <div className="transition-all duration-300 ease-in-out bg-theme-background-transparent group hover:w-64 w-14 h-full rounded-md flex flex-col justify-between relative z-10">
            <div className='h-3/5 flex flex-col justify-between'>
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
                                    className="flex items-center justify-center text-theme-text h-[40px] w-[40px] rounded-md bg-gradient-to-br from-theme-accent-transparent to-theme-accent shadow-md border border-theme-accent hover:bg-theme-accent active:scale-95"
                                >
                                    <div className="text-3xl flex items-center justify-center">
                                        {route.icon ? route.icon : <span>🔗</span>}
                                    </div>
                                </button>

                                {/* Label Tile */}
                                <button
                                    onClick={() => navigate(route.path)}
                                    className="hidden group-hover:flex items-center justify-start flex-1 text-theme-text h-[40px] rounded-md bg-gradient-to-r from-theme-accent-transparent to-theme-accent shadow-md border border-theme-accent hover:bg-theme-accent active:scale-95"
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

            {/* Bottom Links */}
            <div>
                <nav className="p-2 space-y-4">
                    {/* Update Notification - show above settings button when expanded */}
                    <div className="group-hover:block hidden">
                        <UpdateNotification isExpanded={true} />
                    </div>

                    {bottomRoutes.map((route) => (
                        <div key={route.path}>
                            {/* Show collapsed update notification above settings button */}
                            {route.path === '/setting' && (
                                <div className="group-hover:hidden block mb-4">
                                    <UpdateNotification isExpanded={false} />
                                </div>
                            )}

                            <div className="flex gap-2">
                                {/* Icon Tile */}
                                <button
                                    onClick={() => handleNavClick(route)}
                                    className="flex items-center justify-center text-theme-text h-[40px] w-[40px] rounded-md bg-gradient-to-br from-theme-accent-transparent to-theme-accent shadow-md border border-theme-accent hover:bg-theme-accent active:scale-95"
                                >
                                    <div className="text-3xl flex items-center justify-center">
                                        {route.icon ? route.icon : <span>🔗</span>}
                                    </div>
                                </button>

                                {/* Label Tile */}
                                <button
                                    onClick={() => handleNavClick(route)}
                                    className="hidden group-hover:flex items-center justify-start flex-1 text-theme-text h-[40px] rounded-md bg-gradient-to-r from-theme-accent-transparent to-theme-accent shadow-md border border-theme-accent hover:bg-theme-accent active:scale-95"
                                >
                                    <span className="font-bold text-lg px-4">
                                        {route.label}
                                    </span>
                                </button>
                            </div>
                        </div>
                    ))}
                </nav>
            </div>

            {/* Logout Confirmation Popup */}
            <LogoutModalComponent />
        </div>
    );
};

export default DefaultNav;