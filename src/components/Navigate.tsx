import React from 'react';
import { useNavigate } from 'react-router-dom';
import { routes, bottomRoutes } from '../routes';
import { useEffect, useState } from 'react';
import { decryptUser } from './auth/token_secure';

const Navigate: React.FC = () => {
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
        <div className="transition-all duration-300 ease-in-out bg-blue-100/50 group hover:w-64 w-14 h-full rounded-md flex flex-col justify-between">
            <div className="p-2">
                <p className="text-indigo-900 font-bold">Hello, {username}!</p>
            </div>

            {/* <div className='bg-slate-300/50 rounded-2xl py-2 '> */}
            <div>
                <nav className="p-2 space-y-4">
                    {routes.map((route) => (
                        <button key={route.path} onClick={() => navigate(route.path)} className="flex items-center justify-normal space-x-4 text-indigo-900 h-[40px] w-full rounded-md pl-[3px] bg-blue-100/80 hover:bg-[azure]">
                            {/* Icon - Always visible */}
                            <div className="text-3xl pl-[2px]">
                                {route.icon ? route.icon : <span>🔗</span>} {/* Replace with actual icon */}
                            </div>
                            {/* Label - Visible on expand */}
                            <div className="hidden font-bold w-full pr-6 justify-center text-lg group-hover:inline-block">{route.label}</div>
                        </button>
                    ))}
                </nav>
            </div>
            {/* <div className='bg-blue-100/50 rounded-2xl py-2 '> */}
            <div>
                <nav className="p-2 space-y-4">
                    {bottomRoutes.map((route) => (
                        <button key={route.path} onClick={() => navigate(route.path)} className="flex items-center justify-normal space-x-4 text-indigo-900 h-[40px] w-full rounded-md pl-[3px] bg-blue-100/80 hover:bg-[azure]">
                            {/* Icon - Always visible */}
                            <div className="text-3xl pl-[2px]">
                                {route.icon ? route.icon : <span>🔗</span>} {/* Replace with actual icon */}
                            </div>
                            {/* Label - Visible on expand */}
                            <div className="hidden font-bold w-full pr-6 justify-center text-lg group-hover:inline-block">{route.label}</div>
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
};

export default Navigate;