import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { decryptUser } from './auth/token_secure';

interface PasswordEntry {
    entry_id: string;
    account_name: string;
    username: string;
    password: string;
}

const Vault = () => {
    const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
    const [accountName, setAccountName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [editId, setEditId] = useState<string | null>(null);

    useEffect(() => {
        // Fetch password entries on component mount
        const fetchPasswords = async () => {
            try {
                const user = decryptUser();
                if (user) {
                    const userId = user.user_id; // Use user_id instead of username
                    const entries: PasswordEntry[] = await invoke('get_password_entries', { userId });
                    setPasswords(entries);
                } else {
                    console.error("Failed to decrypt user data");
                }
            } catch (error) {
                console.error("Error fetching passwords:", error);
            }
        };

        fetchPasswords();
    }, []);

    const handleAddPassword = async () => {
        try {
            const user = decryptUser();
            if (user) {
                const userId = user.user_id; // Use user_id instead of username
                if (editId !== null) {
                    await invoke('update_password_entry', { entryId: editId, accountName: accountName, username, password });
                    setPasswords(passwords.map(entry =>
                        entry.entry_id === editId ? { entry_id: editId, account_name: accountName, username, password } : entry
                    ));
                    setEditId(null);
                } else {
                    const newEntry: PasswordEntry = {
                        entry_id: '',
                        account_name: accountName,
                        username,
                        password,
                    };
                    const entry_id = await invoke('add_password_entry', { userId, accountName: accountName, username, password });
                    newEntry.entry_id = entry_id as string;
                    setPasswords([...passwords, newEntry]);
                }
                setAccountName('');
                setUsername('');
                setPassword('');
            } else {
                console.error("Failed to decrypt user data");
            }
        } catch (error) {
            console.error("Error adding/updating password:", error);
        }
    };

    const handleEditPassword = (entryId: string) => {
        const entry = passwords.find(entry => entry.entry_id === entryId);
        if (entry) {
            setAccountName(entry.account_name);
            setUsername(entry.username);
            setPassword(entry.password);
            setEditId(entryId);
        }
    };

    const handleDeletePassword = async (entryId: string) => {
        try {
            const user = decryptUser();
            if (user) {
                const userId = user.user_id; // Use user_id instead of username
                await invoke('delete_password_entry', { userId, entryId });
                setPasswords(passwords.filter(entry => entry.entry_id !== entryId));
            } else {
                console.error("Failed to decrypt user data");
            }
        } catch (error) {
            console.error("Error deleting password:", error);
        }
    };

    return (
        <div className="p-4 h-full bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text">
            <h1 className="text-2xl font-bold mb-4">Vault</h1>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Account Name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="border p-2 mr-2 bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text"
                />
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="border p-2 mr-2 bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border p-2 mr-2 bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text"
                />
                <button
                    onClick={handleAddPassword}
                    className="bg-light-primary dark:bg-dark-primary text-light-text dark:text-dark-text p-2 rounded"
                >
                    {editId !== null ? 'Update' : 'Add'}
                </button>
            </div>
            <ul className="list-disc pl-5">
                {passwords.map((entry) => (
                    <li key={entry.entry_id} className="mb-2">
                        <strong>{entry.account_name}</strong> - {entry.username} - {entry.password}
                        <button
                            onClick={() => handleEditPassword(entry.entry_id)}
                            className="bg-light-secondary dark:bg-dark-secondary text-light-text dark:text-dark-text p-1 ml-2 rounded"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => handleDeletePassword(entry.entry_id)}
                            className="bg-light-accent dark:bg-dark-accent text-light-text dark:text-dark-text p-1 ml-2 rounded"
                        >
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Vault;