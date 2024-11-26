import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import Logo from '../assets/Logo.png'; // Adjust the path as necessary

const Decor: React.FC = () => {

    const minimizeWebview = async () => {
        const currentWindow = await getCurrentWindow();
        await currentWindow.minimize();
    };
    const maximizeWebview = async () => {
        const currentWindow = await getCurrentWindow();
        await currentWindow.maximize();
    };
    const closeWebview = async () => {
        const currentWindow = await getCurrentWindow();
        await currentWindow.close();
    };

    return (
        <div data-tauri-drag-region className="bg-gray-800 text-white p-4 h-12 w-full text-center rounded-md flex items-center justify-between">
            <div data-tauri-drag-region className="flex items-center justify-start">
                <img data-tauri-drag-region src={Logo} alt="Logo" className="h-20 mr-2" />
            </div>
            <div data-tauri-drag-region className='flex-grow flex justify-center'>
                Window Name
            </div>
            <div className='flex justify-end text-sm ml-[124px]'>
                <button className="py-1 ml-2 transition-all duration-300 ease-in-out hover:scale-110" onClick={minimizeWebview}>🟡</button>
                <button className="py-1 ml-2 transition-all duration-300 ease-in-out hover:scale-110" onClick={maximizeWebview}>🟣</button>
                <button className="py-1 ml-2 transition-all duration-300 ease-in-out hover:scale-110" onClick={closeWebview}>🔴</button>
            </div>
        </div>
    );
};

export default Decor;