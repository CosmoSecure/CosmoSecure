import React, { useEffect, useState } from 'react';
import { Pro } from '../assets/';
import { decryptUser } from './auth/token_secure';
import CakeIcon from '@mui/icons-material/Cake';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import CloseIcon from '@mui/icons-material/Close';

const Profile: React.FC<{ isVisible: boolean; onClose: () => void }> = ({ isVisible, onClose }) => {
    const [username, setUsername] = useState('');
    const [joinDate, setJoinDate] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        try {
            const user = decryptUser();
            if (user && user.name && user.created_at) {
                setUsername(user.name);
                setEmail(user.email);
                const createdAt = new Date(parseInt(user.created_at.$date.$numberLong));
                const formattedDate = `${String(createdAt.getDate()).padStart(2, '0')}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${createdAt.getFullYear()}`;
                setJoinDate(formattedDate);
                console.log('User data decrypted:', user);
            } else {
                console.error('No user found in decrypted data');
            }
        } catch (error) {
            console.error('Error decrypting or parsing user data:', error);
        }
    }, []);

    return (
        <div
            className={`fixed top-14 right-0 h-[94.3%] w-1/2 bg-theme-background-transparent text-theme-text transform transition-transform duration-300 ease-in-out rounded-r-md rounded-l-xl mr-[4px]`}
            style={{ transform: isVisible ? 'translateX(0)' : 'translateX(120%)' }} // Custom translation value
        >
            <main className="relative h-full flex flex-col items-center rounded-xl">
                <div className='h-28 w-full bg-gradient-to-r from-theme-secondary-transparent via-theme-primary to-theme-secondary-transparent rounded-tl-xl rounded-tr-md'></div>
                <button onClick={onClose} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full">
                    <CloseIcon />
                </button>
                <div className="relative flex flex-col items-center">
                    <img src={Pro} alt="" className='rounded-full h-32 w-32 absolute top-[-4rem] z-10' />
                    <div className="mt-20 text-center">
                        <div className="text-3xl font-bold mt-2">{username}</div>
                        <div className="text-xl mt-2 flex items-center">
                            <CakeIcon className="mr-2" /> {joinDate}
                        </div>
                        <div className="text-xl mt-2 flex items-center">
                            <AlternateEmailIcon className="mr-2" /> {email}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Profile;