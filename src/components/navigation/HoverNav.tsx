import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes, bottomRoutes } from '../../routes';
import { useUser } from '../../contexts/UserContext';
import { Pro } from '../../assets/';
import { useLogoutModal } from './LogoutModal';

const NavButton = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
    <div className="relative group">
        <button
            onClick={onClick}
            className="flex items-center justify-center text-theme-text h-[40px] w-[40px] 
                rounded-md bg-theme-accent-transparent hover:bg-theme-accent 
                hover:scale-110 active:scale-95 transition-all duration-300"
        >
            {/* Changed from text-2xl to text-3xl to match OriginalNav */}
            <div className="text-3xl flex justify-center items-center">{icon}</div>
        </button>
        <span
            className="absolute left-full top-1/2 -translate-y-1/2 ml-2 h-[40px] px-4
                rounded-md bg-theme-accent-transparent border border-theme-accent
                text-theme-text text-lg whitespace-nowrap opacity-0 scale-95
                group-hover:opacity-100 group-hover:scale-100 group-hover:bg-theme-accent
                pointer-events-none transform origin-left z-[9999]
                flex items-center justify-center font-medium transition-all duration-300"
        >
            {label}
        </span>
    </div>
);

const HoverNav: React.FC<{ toggleProfileVisibility: () => void }> = ({ toggleProfileVisibility }) => {
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
        <div className="w-14 h-full rounded-md flex flex-col justify-between bg-theme-background-transparent z-10">
            {/* Profile Section */}
            <div className='h-3/5 flex flex-col justify-between'>
                <div className="p-2">
                    <div className="relative group">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleProfileVisibility();
                            }}
                            className="flex items-center justify-center hover:scale-110 transition-transform duration-300"
                        >
                            <img src={Pro} alt="Profile" className="w-10 h-10 rounded-full active:scale-95" />
                        </button>
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleProfileVisibility();
                            }}
                            className="absolute left-full top-1/2 -translate-y-1/2 ml-2 h-[40px] px-4
                            rounded-md bg-theme-accent-transparent border border-theme-accent
                            text-theme-text text-lg whitespace-nowrap opacity-0 scale-95
                            group-hover:opacity-100 group-hover:scale-100 group-hover:bg-theme-accent
                            cursor-pointer transform origin-left z-[9999]
                            flex items-center justify-center font-medium transition-all duration-300"
                        >
                            {username || "Profile"}
                        </span>
                    </div>
                </div>

                {/* Navigation Links */}
                <div>
                    <nav className="p-2 space-y-4">
                        {routes.map((route) => (
                            <NavButton
                                key={route.path}
                                icon={route.icon || <span>🔗</span>}
                                label={route.label}
                                onClick={() => navigate(route.path)}
                            />
                        ))}
                    </nav>
                </div>
            </div>

            {/* Bottom Links */}
            <div>
                <nav className="p-2 space-y-4">
                    {bottomRoutes.map((route) => (
                        <NavButton
                            key={route.path}
                            icon={route.icon || <span>🔗</span>}
                            label={route.label}
                            onClick={() => handleNavClick(route)}
                        />
                    ))}
                </nav>
            </div>

            {/* Logout Confirmation Popup */}
            <LogoutModalComponent />
        </div >
    );
};

export default HoverNav;