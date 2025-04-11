import React, { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { DecorLogo } from '../assets'; // Adjust the path as necessary

interface DecorProps {
    pageName: string;
    onVisibilityChange: (visible: boolean) => void;
}

const Decor: React.FC<DecorProps> = ({ pageName, onVisibilityChange }) => {
    const [isVisible, setIsVisible] = useState(false);

    const minimizeWebview = async () => {
        const currentWindow = getCurrentWindow();
        await currentWindow.minimize();
    };
    
    const maximizeWebview = async () => {
        const currentWindow = getCurrentWindow();
        await currentWindow.maximize();
    };
    
    const closeWebview = async () => {
        const currentWindow = getCurrentWindow();
        await currentWindow.close();
    };

    useEffect(() => {
        onVisibilityChange(isVisible);
    }, [isVisible, onVisibilityChange]);

    return (
        <div 
            className="relative w-full"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {/* Thin visible bar that hides on hover */}
            <div 
                className={`h-2 w-full bg-theme-background-transparent absolute top-0 rounded-md transition-opacity duration-300 ease-in-out
                          ${isVisible ? 'opacity-0' : 'opacity-100'}`}
            />

            {/* Main Decor content */}
            <div
                data-tauri-drag-region
                className={`bg-theme-background text-theme-text p-4 h-12 w-full text-center rounded-md 
                          flex items-center justify-between transition-opacity duration-300 ease-in-out absolute top-0
                          ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                style={{ 
                    transform: isVisible ? 'translateY(0)' : 'translateY(-100%)', 
                    transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out'
                }}
            >
                <div data-tauri-drag-region className="flex items-center justify-start">
                    <img 
                        data-tauri-drag-region 
                        src={DecorLogo} 
                        alt="Logo" 
                        className="h-20 mr-2" 
                        style={{ userSelect: 'none' }} 
                    />
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
        </div>
    );
};

export default Decor;