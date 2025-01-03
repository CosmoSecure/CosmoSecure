import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { routes, bottomRoutes } from '../routes';
import { decryptUser } from './auth/token_secure';
import { Pro } from '../assets/';
// import SensorOccupiedIcon from '@mui/icons-material/SensorOccupied';

const Navigate: React.FC<{ toggleProfileVisibility: () => void }> = ({ toggleProfileVisibility }) => {
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

    return (
        <div className="transition-all duration-300 ease-in-out bg-theme-background-transparent group hover:w-64 w-14 h-full rounded-md flex flex-col justify-between relative">
            {/* Profile Icon */}
            <div className="p-2 relative">
                <button
                    onClick={toggleProfileVisibility}
                    className="relative flex flex-col items-center justify-center space-y-2 group"
                >
                    <div className="text-4xl transition-transform duration-300 group-hover:scale-150 group-hover:translate-x-24 group-hover:translate-y-3">
                        <img src={Pro} alt="Profile" className="w-10 h-10 rounded-full" />
                    </div>
                </button>

                {/* Username */}
                <div
                    className="absolute top-[5rem] left-[47%] -translate-x-1/2 hidden group-hover:block text-theme-text font-bold text-center text-xl transition-all duration-300"
                >
                    <Link to="#" onClick={toggleProfileVisibility}>{username}</Link>
                </div>
            </div>

            {/* Navigation Links */}
            <div>
                <nav className="p-2 space-y-4">
                    {routes.map((route) => (
                        <button
                            key={route.path}
                            onClick={() => navigate(route.path)}
                            className="flex items-center justify-normal space-x-4 text-theme-text h-[40px] w-full rounded-md pl-[3px] bg-theme-accent-transparent hover:bg-theme-accent"
                        >
                            <div className="text-3xl pl-[2px]">
                                {route.icon ? route.icon : <span>🔗</span>}
                            </div>
                            <div className="hidden font-bold w-full pr-6 justify-center text-lg group-hover:inline-block">
                                {route.label}
                            </div>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Bottom Links */}
            <div>
                <nav className="p-2 space-y-4">
                    {bottomRoutes.map((route) => (
                        <button
                            key={route.path}
                            onClick={() => navigate(route.path)}
                            className="flex items-center justify-normal space-x-4 text-theme-text h-[40px] w-full rounded-md pl-[3px] bg-theme-accent-transparent hover:bg-theme-accent"
                        >
                            <div className="text-3xl pl-[2px]">
                                {route.icon ? route.icon : <span>🔗</span>}
                            </div>
                            <div className="hidden font-bold w-full pr-6 justify-center text-lg group-hover:inline-block">
                                {route.label}
                            </div>
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
};

export default Navigate;