import React, { useState, useMemo } from 'react';
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

    // Memoize components to prevent unnecessary re-renders
    const memoizedProfile = useMemo(() => (
        <Profile isVisible={isProfileVisible} onClose={toggleProfileVisibility} />
    ), [isProfileVisible]);

    const memoizedDecor = useMemo(() => (
        <Decor 
            pageName={pageName} 
            onVisibilityChange={setIsDecorVisible}
        />
    ), [pageName]);

    return (
        <div className="flex h-screen">
            <div className='m-1'>
                <Navigate toggleProfileVisibility={toggleProfileVisibility} />
            </div>
            <div className="flex-1 flex flex-col m-1 ml-0">
                {memoizedDecor}
                <main 
                    className="flex-1 overflow-auto bg-blue-100 rounded-md relative"
                    style={{
                        marginTop: isDecorVisible ? '3.25rem' : '0.75rem',
                        transition: 'margin-top 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: 'translateZ(0)',
                        willChange: 'margin-top',
                        backfaceVisibility: 'hidden'
                    }}
                >
                    <Outlet />
                    {memoizedProfile}
                    <VersionDisplay />
                </main>
            </div>
        </div>
    );
};

export default AppLayout;