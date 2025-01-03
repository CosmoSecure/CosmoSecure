import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Decor from './Decor';
import Navigate from './Navigate';
import Profile from './Profile';

const AppLayout: React.FC = () => {
    const location = useLocation();
    const [isProfileVisible, setProfileVisible] = useState(false);

    const getPageName = (pathname: string) => {
        if (pathname === '/') {
            return 'Dashboard';
        }
        const pathParts = pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
            return pathParts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' / ');
        }
        return 'Speed Meets Security';
    };

    const pageName = getPageName(location.pathname);

    // Function to toggle profile visibility
    const toggleProfileVisibility = () => {
        setProfileVisible(!isProfileVisible);
    };

    return (
        <div className="flex h-screen">
            <div className='m-1'>
                <Navigate toggleProfileVisibility={toggleProfileVisibility} />
            </div>
            <div className="flex-1 flex flex-col m-1 ml-0">
                <Decor pageName={pageName} />
                <main className="flex-1 overflow-auto bg-blue-100 mt-1 rounded-md relative">
                    <Outlet />

                    {/* Conditionally render Profile component inside the main area */}
                    <Profile isVisible={isProfileVisible} onClose={toggleProfileVisibility} />
                </main>
            </div>
        </div>
    );
};

export default AppLayout;