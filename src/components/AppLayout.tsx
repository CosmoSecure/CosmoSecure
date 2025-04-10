import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Decor from './Decor';
import Navigate from './Navigate';
import Profile from './Profile';
import VersionDisplay from '../version/version';

const AppLayout: React.FC = () => {
    const location = useLocation();
    const [isProfileVisible, setProfileVisible] = useState(false);
    const [isDecorVisible, setIsDecorVisible] = useState(false);

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

    const toggleProfileVisibility = () => {
        setProfileVisible(!isProfileVisible);
    };

    return (
        <div className="flex h-screen">
            <div className='m-1'>
                <Navigate toggleProfileVisibility={toggleProfileVisibility} />
            </div>
            <div className="flex-1 flex flex-col m-1 ml-0">
                <Decor 
                    pageName={pageName} 
                    onVisibilityChange={setIsDecorVisible}
                />
                <main 
                    className={`flex-1 overflow-auto bg-blue-100 rounded-md relative transition-all duration-300 ease-in-out ${
                        isDecorVisible ? 'mt-16' : 'mt-1'
                    }`}
                    style={{
                        marginTop: isDecorVisible ? '3.25rem' : '0.75rem',
                        transition: 'margin-top 0.3s ease-in-out'
                    }}
                >
                    <Outlet />
                    <Profile isVisible={isProfileVisible} onClose={toggleProfileVisibility} />
                    <VersionDisplay />
                </main>
            </div>
        </div>
    );
};

export default AppLayout;