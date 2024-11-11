import React from 'react';
import { useNavigate } from 'react-router-dom';
import { routes, bottomRoutes } from '../routes';

const Navigate: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="transition-all duration-300 ease-in-out bg-[azure] group hover:w-64 w-16 h-full rounded-md flex flex-col justify-between">
            <div>
                <nav className="p-4 space-y-4">
                    {routes.map((route) => (
                        <button key={route.path} onClick={() => navigate(route.path)} className="flex items-center justify-start space-x-4 text-sky-900 h-full w-full rounded-md p-[2px] bg-slate-100 hover:bg-slate-300">
                            {/* Icon - Always visible */}
                            <div className="text-3xl mr-4 pl-[2px]">
                                {route.icon ? route.icon : <span>🔗</span>} {/* Replace with actual icon */}
                            </div>
                            {/* Label - Visible on expand */}
                            <span className="hidden font-bold group-hover:inline-block">{route.label}</span>
                        </button>
                    ))}
                </nav>
            </div>
            <div>
                <nav className="p-4 space-y-4">
                    {bottomRoutes.map((route) => (
                        <button key={route.path} onClick={() => navigate(route.path)} className="flex items-center justify-start space-x-4 text-sky-900 h-full w-full rounded-md p-[2px] bg-slate-100 hover:bg-slate-300">
                            {/* Icon - Always visible */}
                            <div className="text-3xl mr-4 pl-[2px]">
                                {route.icon ? route.icon : <span>🔗</span>} {/* Replace with actual icon */}
                            </div>
                            {/* Label - Visible on expand */}
                            <span className="hidden font-bold group-hover:inline-block">{route.label}</span>
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
};

export default Navigate;
