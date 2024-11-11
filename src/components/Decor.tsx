import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

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
            <div>
                win-name
            </div>
            <div>
                search
            </div>
            <div className='flex justify-end'>
                <button className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded-md ml-2 items-center" onClick={minimizeWebview}>-</button>
                <button className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded-md ml-2 items-center" onClick={maximizeWebview}>#</button>
                <button className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded-md ml-2 items-center" onClick={closeWebview}>X</button>
            </div>
        </div>
    );
};

export default Decor;
