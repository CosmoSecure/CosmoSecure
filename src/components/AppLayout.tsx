import React from 'react';
import { Outlet } from 'react-router-dom';
import Decor from '../components/Decor';
import Navigate from './Navigate';

const AppLayout: React.FC = () => {
    return (
        <div className="flex h-screen">
            <div className='m-1'>
                <Navigate />
            </div>
            <div className="flex-1 flex flex-col m-1 ml-0">
                <Decor />
                <main className="flex-1 overflow-auto bg-blue-100 mt-1 rounded-md">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
