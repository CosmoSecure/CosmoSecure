import React, { useEffect, useState } from 'react';
import { Pro } from '../assets/';
import { decryptUser } from './auth/token_secure';
import CakeIcon from '@mui/icons-material/Cake';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';

const Profile: React.FC = () => {
    const [username, setUsername] = useState('');
    const [joinDate, setJoinDate] = useState('');
    const [email, setemail] = useState('');

    useEffect(() => {
        try {
            const user = decryptUser();
            if (user && user.name && user.created_at) {
                setUsername(user.name);
                setemail(user.email);
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
        <div className='bg-theme-background text-theme-text h-full w-full'>
            <main className="relative">
                <div className='h-28 bg-gradient-to-r from-theme-secondary-transparent via-theme-primary to-theme-secondary-transparent'></div>
                <div className="absolute top-12 left-1/2 w-[99%] transform -translate-x-1/2 flex">
                    <img src={Pro} alt="" className='rounded-full h-32 w-32 absolute left-10' />
                    <div className="ml-4 mt-5 absolute left-48">
                        <div className="text-3xl font-bold mt-2">{username}</div>
                        <div className="text-xl mt-2"><CakeIcon className='mr-2 mb-2' /> {joinDate} <AlternateEmailIcon className='mx-2 mb-2' /> {email} </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Profile;