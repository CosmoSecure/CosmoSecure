import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes, bottomRoutes } from '../../routes';
import { useUser } from '../../contexts/UserContext';
// import { Pro } from '../../assets/';
import SensorOccupiedIcon from '@mui/icons-material/SensorOccupied';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
// import MenuIcon from '@mui/icons-material/Menu';

const ButtonNav: React.FC<{ toggleProfileVisibility: () => void }> = ({ }) => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [, setUsername] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

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

    const toggleNavigation = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={`transition-all duration-300 ease-in-out bg-theme-background-transparent 
            ${isExpanded ? 'w-64' : 'w-14'} h-full rounded-md flex flex-col justify-between relative`}>

            {/* Profile Section */}
            <div className="p-2">
                {/* <button
                    onClick={toggleProfileVisibility}
                    className="relative flex flex-col items-center justify-center"
                >
                    <div className={`text-4xl transition-transform duration-300 
                        ${isExpanded ? 'scale-150 translate-x-24 translate-y-3' : ''}`}>
                        <img src={Pro} alt="Profile" className="w-10 h-10 rounded-full active:scale-95" />
                    </div>
                </button> */}

                {/* Username */}
                {/* <div className={`absolute top-[5rem] left-[47%] -translate-x-1/2 
                    text-theme-text font-bold text-center text-xl transition-opacity duration-300
                    ${isExpanded ? 'opacity-100' : 'opacity-0 invisible'}`}>
                    <Link to="#" onClick={toggleProfileVisibility}>{username}</Link>
                </div> */}

                {/* Toggle Button - Moved below profile */}
                <button
                    onClick={toggleNavigation}
                    className="absolute top-3 z-10 h-[40px] w-[40px] bg-theme-accent p-1 rounded-full text-theme-text hover:scale-110 transition-transform duration-300"
                >
                    {isExpanded ?
                        <MenuOpenIcon className="w-5 h-5" /> :
                        <SensorOccupiedIcon className="w-5 h-5" />
                    }
                </button>
            </div>

            {/* Navigation Links */}
            <div>
                <nav className="p-2 space-y-4 mt-10">
                    {routes.map((route) => (
                        <div key={route.path} className="flex gap-2">
                            {/* Icon Tile */}
                            <button
                                onClick={() => navigate(route.path)}
                                className="flex items-center justify-center text-theme-text h-[40px] w-[40px] 
                                    rounded-md bg-theme-accent-transparent hover:bg-theme-accent active:scale-95"
                            >
                                <div className="text-3xl flex items-center justify-center">
                                    {route.icon || <span>🔗</span>}
                                </div>
                            </button>

                            {/* Label Tile */}
                            <button
                                onClick={() => navigate(route.path)}
                                className={`items-center justify-start flex-1 text-theme-text h-[40px] 
                                    rounded-md bg-theme-accent-transparent hover:bg-theme-accent active:scale-95
                                    transition-opacity duration-300
                                    ${isExpanded ? 'flex opacity-100' : 'hidden opacity-0'}`}
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
                                className="flex items-center justify-center text-theme-text h-[40px] w-[40px] 
                                    rounded-md bg-theme-accent-transparent hover:bg-theme-accent active:scale-95"
                            >
                                <div className="text-3xl flex items-center justify-center">
                                    {route.icon || <span>🔗</span>}
                                </div>
                            </button>

                            {/* Label Tile */}
                            <button
                                onClick={() => navigate(route.path)}
                                className={`items-center justify-start flex-1 text-theme-text h-[40px] 
                                    rounded-md bg-theme-accent-transparent hover:bg-theme-accent active:scale-95
                                    transition-opacity duration-300
                                    ${isExpanded ? 'flex opacity-100' : 'hidden opacity-0'}`}
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

export default ButtonNav;