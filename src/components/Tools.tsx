import React from 'react';

const Tools: React.FC = () => {
    return (
        <div className="bg-theme-background h-full p-8 flex flex-col justify-center items-center text-theme-accent">
            <div className='flex flex-col justify-center items-center -z-0'>
                <h1 className="text-4xl font-bold">Tools</h1>
                <p className="text-xl">This page will contain various tools to help
                    you manage your passwords and other security-related tasks.</p>
                <p className="text-xl">Coming Soon!</p>
                <p className="text-xl">Stay tuned for updates!</p>
            </div>
        </div>
    );
};

export default Tools;