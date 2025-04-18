import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Decor from '../Decor';

const Auth_page: React.FC = () => {
    const [isDecorVisible, setIsDecorVisible] = useState(false);

    return (
        <div className="flex h-screen">
            <div className="flex-1 flex flex-col m-1">
                <Decor
                    pageName="Welcome!!!"
                    onVisibilityChange={(visible) => {
                        setIsDecorVisible(visible);
                        console.log(`Decor visibility changed: ${visible}`);
                    }}
                />
                <main
                    className="flex-1 bg-transparent rounded-md"
                    style={{
                        marginTop: isDecorVisible ? '3.25rem' : '0.5rem',
                        transition: 'margin-top 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: 'translateZ(0)',
                        willChange: 'margin-top',
                        backfaceVisibility: 'hidden',
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            transition={{ duration: 0.6 }}
                            className="flex-grow flex justify-center items-center bg-transparent text-theme-text h-full rounded-md"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default Auth_page;