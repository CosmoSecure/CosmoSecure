import { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { decryptUser } from './auth/token_secure';

interface PasswordEntry {
    entry_id: string;
    account_name: string;
    username: string;
    password: string;
    strength?: number;
}

const Vault = () => {
    const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
    const [accountName, setAccountName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [editId, setEditId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Memoize user data
    const getUserData = useCallback(async () => {
        const user = decryptUser();
        if (!user) throw new Error("Failed to decrypt user data");
        return user;
    }, []);

    // Update password strength check
    const checkPasswordStrength = useCallback(async (entries: PasswordEntry[]) => {
        const updatedEntries = await Promise.all(
            entries.map(async (entry) => {
                try {
                    const strength = await invoke<{ score: number }>('check_password_strength', {
                        password: entry.password
                    });
                    return { ...entry, strength: strength.score };
                } catch (error) {
                    console.error("Error checking password strength:", error);
                    return entry;
                }
            })
        );
        return updatedEntries;
    }, []);

    // Optimized fetch passwords
    const fetchPasswords = useCallback(async () => {
        try {
            setIsLoading(true);
            const user = await getUserData();
            const entries = await invoke('get_password_entries', {
                userId: user.user_id
            }) as PasswordEntry[];

            const entriesWithStrength = await checkPasswordStrength(entries);
            setPasswords(entriesWithStrength);

            // Update weak passwords count
            const weakPws = entriesWithStrength.filter(entry => (entry.strength ?? 0) < 3);
            sessionStorage.setItem('weak_passwords', JSON.stringify(weakPws));
            sessionStorage.setItem('p_count', entries.length.toString());
        } catch (error) {
            setError("Error fetching passwords. Please try again.");
            console.error("Error fetching passwords:", error);
        } finally {
            setIsLoading(false);
        }
    }, [getUserData, checkPasswordStrength]);

    useEffect(() => {
        fetchPasswords();
        return () => {
            // Cleanup
            setPasswords([]);
            setError(null);
        };
    }, [fetchPasswords]);

    const handleAddPassword = useCallback(async () => {
        if (!accountName || !username || !password) {
            setError("Please fill in all fields");
            return;
        }

        try {
            setIsLoading(true);
            const user = await getUserData();

            if (editId) {
                await invoke('update_password_entry', {
                    entryId: editId,
                    accountName,
                    username,
                    password
                });

                setPasswords(prev => prev.map(entry =>
                    entry.entry_id === editId
                        ? { entry_id: editId, account_name: accountName, username, password }
                        : entry
                ));
            } else {
                const entry_id = await invoke<string>('add_password_entry', {
                    userId: user.user_id,
                    accountName,
                    username,
                    password
                });

                setPasswords(prev => [...prev, {
                    entry_id,
                    account_name: accountName,
                    username,
                    password
                }]);
            }

            // Reset form
            setAccountName('');
            setUsername('');
            setPassword('');
            setEditId(null);
            setError(null);

            // Update storage in background
            fetchPasswords();
        } catch (error) {
            setError("Error adding/updating password. Please try again.");
            console.error("Error adding/updating password:", error);
        } finally {
            setIsLoading(false);
        }
    }, [accountName, username, password, editId, getUserData, fetchPasswords]);

    const handleEditPassword = (entryId: string) => {
        const entry = passwords.find(entry => entry.entry_id === entryId);
        if (entry) {
            setAccountName(entry.account_name);
            setUsername(entry.username);
            setPassword(entry.password);
            setEditId(entryId);
        }
    };

    const handleDeletePassword = useCallback(async (entryId: string) => {
        try {
            setIsLoading(true);
            const user = await getUserData();
            await invoke('delete_password_entry', {
                userId: user.user_id,
                entryId
            });

            setPasswords(prev => prev.filter(entry => entry.entry_id !== entryId));
            fetchPasswords(); // Update storage in background
        } catch (error) {
            setError("Error deleting password. Please try again.");
            console.error("Error deleting password:", error);
        } finally {
            setIsLoading(false);
        }
    }, [getUserData, fetchPasswords]);

    // Memoize rendered list
    const getStrengthColor = (strength?: number) => {
        if (!strength) return 'text-gray-500';
        if (strength >= 4) return 'text-green-500';
        if (strength >= 3) return 'text-yellow-500';
        return 'text-red-500';
    };

    const passwordList = useMemo(() => (
        <ul className="list-disc pl-5">
            {passwords.map((entry) => (
                <li key={entry.entry_id} className="mb-2">
                    <strong>{entry.account_name}</strong> - {entry.username} - {entry.password}
                    <span className={`ml-2 ${getStrengthColor(entry.strength)}`}>
                        (Strength: {entry.strength ?? 0}/4)
                    </span>
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
    ), [passwords]);

    return (
        <div className="p-4 h-full bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text">
            <h1 className="text-2xl font-bold mb-4">Vault</h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {isLoading && <div className="text-blue-500 mb-4">Loading...</div>}
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
            {passwordList}
        </div>
    );
};

export default Vault;