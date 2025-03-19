import React, { useState } from 'react';
import { PasswordGenerator } from './tools';

const Tools: React.FC = () => {
    const [selectedTool, setSelectedTool] = useState<string | null>(null);

    const renderContent = () => {
        switch (selectedTool) {
            case 'Password Generator':
                return <PasswordGenerator />;
            default:
                return (
                    <div className="flex flex-col justify-center items-center font-extrabold text-theme-text-transparent text-black">
                        <h1 className="text-2xl font-bold mb-4">Welcome to Tools</h1>
                        <p className="text-xl">Select a tool from the sidebar to get started.</p>
                        <p className="text-xl mt-4 italic">"Security is not a product, but a process." - Bruce Schneier</p>
                    </div>
                );
        }
    };

    return (
        <div className="bg-theme-background h-full p-8 grid grid-cols-4 gap-4 text-theme-accent">
            {/* Sidebar */}
            <div className="col-span-1 flex flex-col items-center bg-theme-primary-transparent p-4 rounded-md">
                <h2 className="text-3xl font-bold mb-4">Tools</h2>
                <div className="space-y-4 w-2/3">
                    <button
                        className={`w-full px-4 py-2 font-semibold shadow-md rounded transition-all duration-300 ease-in-out transform ${selectedTool === 'Password Generator'
                            ? 'bg-theme-secondary text-theme-text scale-105'
                            : 'bg-theme-accent text-theme-text hover:bg-theme-accent-hover hover:scale-105 hover:shadow-lg'
                            }`}
                        onClick={() => setSelectedTool('Password Generator')}
                    >
                        Password Generator
                    </button>
                    <button
                        className={`w-full px-4 py-2 font-semibold shadow-md rounded transition-all duration-300 ease-in-out transform ${selectedTool === 'Another Tool'
                            ? 'bg-theme-secondary text-theme-text scale-105'
                            : 'bg-theme-accent text-theme-text hover:bg-theme-accent-hover hover:scale-105 hover:shadow-lg'
                            }`}
                        onClick={() => setSelectedTool('Another Tool')}
                    >
                        Another Tool
                    </button>
                    <button
                        className={`w-full px-4 py-2 font-semibold shadow-md rounded transition-all duration-300 ease-in-out transform ${selectedTool === 'Another Tool 2'
                            ? 'bg-theme-secondary text-theme-text scale-105'
                            : 'bg-theme-accent text-theme-text hover:bg-theme-accent-hover hover:scale-105 hover:shadow-lg'
                            }`}
                        onClick={() => setSelectedTool('Another Tool 2')}
                    >
                        Another Tool
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="col-span-3 flex justify-center items-center bg-theme-primary-transparent p-4 rounded-md">
                {renderContent()}
            </div>
        </div>
    );
};

export default Tools;
