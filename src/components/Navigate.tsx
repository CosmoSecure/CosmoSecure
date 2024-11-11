import React from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../routes/RoutesConf';

const Navigate: React.FC = () => {
    return (
        <div className="transition-all duration-300 ease-in-out bg-[azure] group hover:w-64 w-16 h-full rounded-md">
            <nav className="p-4 space-y-4">
                {routes.map((route) => (
                    <li key={route.path} className="flex items-center space-x-4 text-blue-600 hover:underline">
                        <Link to={route.path} className="flex items-center">
                            {/* Icon - Always visible */}
                            <div className="text-xl">
                                {/* {route.icon ? route.icon : <span>🔗</span>} Replace with actual icon */}
                            </div>
                            {/* Label - Visible on expand */}
                            <span className="hidden group-hover:inline-block">{route.label}</span>
                        </Link>
                    </li>
                ))}
            </nav>
        </div>
    );
};

export default Navigate;
