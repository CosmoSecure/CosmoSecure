import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { DecorLogo } from '../assets'; // Adjust the path as necessary

interface DecorProps {
    pageName: string;
}

const Decor: React.FC<DecorProps> = ({ pageName }) => {

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
        <div data-tauri-drag-region className="bg-theme-background text-theme-text p-4 h-12 w-full text-center rounded-md flex items-center justify-between">
            <div data-tauri-drag-region className="flex items-center justify-start">
                <img data-tauri-drag-region src={DecorLogo} alt="Logo" className="h-20 mr-2" style={{ userSelect: 'none' }} />
            </div>
            <div data-tauri-drag-region className='flex-grow flex justify-center font-serif font-semibold text-3xl'>
                {pageName}
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