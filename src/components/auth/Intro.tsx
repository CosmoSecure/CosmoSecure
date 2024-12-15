import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Intro: React.FC = () => {
    const navigate = useNavigate();

    const handleGoToLogin = () => {
        localStorage.setItem('introVisited', 'true');
        navigate('/login');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col justify-center items-center h-full"
        >
            <div>Intro</div>
            <button
                onClick={handleGoToLogin}
                className="mt-4 p-2 bg-blue-500 text-white rounded"
            >
                Go to Login
            </button>
        </motion.div>
    );
};

export default Intro;