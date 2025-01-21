import { invoke } from '@tauri-apps/api/core';
import { encryptUser } from './auth/token_secure';

interface User {
    id: number;
    name: string;
    email: string;
    username: string;
    created_at: string;
    last_login: string;
    // Add other fields as necessary
}

export const reloadApp_Update = async (userId: string) => {
    try {
        const user = await invoke<User>('reloadapp_update', { userId });
        const updatedEncryptedUser = encryptUser(user);
        sessionStorage.setItem('user', updatedEncryptedUser);
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
};