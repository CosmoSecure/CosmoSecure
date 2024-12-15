import React from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Decor from '../Decor';

const Auth_page: React.FC = () => {
    return (
        <div className="flex h-screen">
            <div className="flex-1 flex flex-col m-1">
                <Decor pageName="Welcome!!!" />
                <main className="flex-1 bg-amber-700 mt-1 rounded-md">
                    <AnimatePresence mode="wait">
                        <motion.div
                            transition={{ duration: 0.6 }}
                            className="flex-grow flex justify-center items-center bg-rich-black text-white h-full"
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