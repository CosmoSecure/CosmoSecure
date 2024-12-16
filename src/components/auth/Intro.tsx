import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import { Key, Old, Crow } from '../../assets';

const Intro: React.FC = () => {
    const navigate = useNavigate();
    const controls = useAnimation();
    const [rotation, setRotation] = useState(-45);

    const handleRotate = async () => {
        const newRotation = rotation + 45;
        setRotation(newRotation);
        await controls.start({ rotate: newRotation });

        if (newRotation >= 0) {
            localStorage.setItem('introVisited', 'true');
            navigate('/login');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col justify-between items-center h-full w-full bg-[#f4e7c3] rounded-md p-8 pb-4"
            style={{
                backgroundImage: `url(${Old})`,
                backgroundSize: 'cover',
                backgroundBlendMode: 'multiply',
                color: '#5b4636',
                fontFamily: 'serif',
            }}
        >
            <div className="flex flex-col items-center">
                <h1 className="text-4xl font-bold mb-4">Welcome to CosmoSecure!</h1>
                <p className="text-xl font-semibold mb-8 text-center">
                    CosmoSecure is the next-generation password manager built to protect your credentials effortlessly. With modern technologies like Tauri, Rust, and React, it delivers robust performance, top-notch security, and a seamless user experience.
                </p>
                <section className="mt-5 mb-5 text-center">
                    <h1 className="text-2xl font-bold">About Me</h1>
                    <p className="text-xl font-medium mt-4">
                        Hi, I am <span className="font-bold">Akash</span> (GitHub: <a href="https://github.com/akash2061" className="text-cyan-800 underline">akash2061</a>), a passionate Full Stack Developer and Rustacean. <br />I specialize in building secure, scalable, and efficient software solutions. Feel free to explore my <a href="https://github.com/akash2061/Code_Canvas" target="_blank" className="text-cyan-800 underline">projects</a> and reach out for collaborations & <a href="https://www.linkedin.com/in/akash-soni-01475924b/" target="_blank" className="text-cyan-800 underline">connection</a>.
                    </p>
                </section>
                <div className="flex justify-evenly">
                    <img src={Crow} alt="Crow" className="w-[240px] h-auto ml-4 mt-5" />
                    <section className="mt-10 w-full flex flex-col text-center">
                        <h2 className="text-3xl font-bold mb-4">Why Choose CosmoSecure?</h2>
                        <ul className="list-disc list-inside text-left mx-auto w-3/4">
                            <li><span className="text-xl font-bold">🔐 Secure Storage:</span> Your passwords are protected with cutting-edge AES encryption.</li>
                            <li><span className="text-xl font-bold">🗂️ Effortless Management:</span> Add, edit, delete, and view stored passwords easily.</li>
                            <li><span className="text-xl font-bold">💻 Cross-Platform:</span> Seamlessly compatible with Windows and Linux.</li>
                            <li><span className="text-xl font-bold">🖼️ User-Friendly Design:</span> Navigate with a clean, intuitive interface.</li>
                            <li><span className="text-xl font-bold">🚀 Lightweight & Fast:</span> Powered by Tauri for high performance and minimal resource use.</li>
                            <li><span className="text-xl font-bold">🔒 Zero-Knowledge Proof:</span> Your data is yours alone—CosmoSecure never stores or processes your master password.</li>
                        </ul>
                    </section>
                </div>
            </div>
            <footer className="w-full text-center mt-10">
                <h2 className="text-2xl mb-4">
                    Unlock a smarter way to manage your passwords
                </h2>
                <div className='flex justify-center items-center mb-6'>
                    <h2 className="text-2xl mr-10">
                        Rotate the key:
                    </h2>
                    <motion.img
                        src={Key}
                        alt="Key"
                        className="w-28 h-28 cursor-pointer"
                        animate={controls}
                        initial={{ rotate: -45 }}
                        onClick={handleRotate}
                        transition={{ duration: 0.5 }}
                    />
                </div>
                <p className="text-base mt-4">
                    © 2024 CosmoSecure. All rights reserved. <a href="https://github.com/CosmoSecure/CosmoSecure/blob/master/LICENSE" target="_blank" className="text-cyan-800 underline">License</a>
                </p>
            </footer>
        </motion.div>
    );
};

export default Intro;