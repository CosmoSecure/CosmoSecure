import { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { decryptUser } from './auth/token_secure';
import ZKPMasterPasswordPopup from "./auth/ZKPMasterPasswordPopup";

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
    const [showZKPPopup, setShowZKPPopup] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userData = decryptUser();
        console.log("Vault Decrypted:", userData);
        console.log("Vault master:", userData.hp);
        console.log("Vault password:", userData.hp[0].ph);
        console.log("Vault master:", userData.hp[0].mp);
        console.log("Vault master:", userData.hp[0].mp.ph);
        setUser(userData);

        if (
            userData.hp[0].mp.ph === ""
        ) {
            setShowZKPPopup(true);
        }
    }, []);

    // Memoize user data
    const getUserData = useCallback(async () => {
        const user = decryptUser();
        if (!user) throw new Error("Failed to decrypt user data");
        return user;
    }, []);

    // Fetch passwords from the backend
    const fetchPasswords = useCallback(async () => {
        try {
            setIsLoading(true);
            const user = await getUserData();
            const entries = await invoke<any[]>('get_password_entries', {
                ui: user.ui, // Pass `ui` as the user ID
            });

            console.log("Fetched entries:", entries); // Debugging log

            // Map backend fields to frontend structure
            const mappedEntries: PasswordEntry[] = entries.map(entry => ({
                entry_id: entry.aid,
                account_name: entry.an,
                username: entry.aun,
                password: entry.ap,
                strength: entry.aps,
            }));

            console.log("Mapped entries with strength:", mappedEntries); // Debugging log
            setPasswords(mappedEntries);
        } catch (error) {
            setError("Error fetching passwords. Please try again.");
            console.error("Error fetching passwords:", error);
        } finally {
            setIsLoading(false);
        }
    }, [getUserData]);

    useEffect(() => {
        fetchPasswords();
        return () => {
            // Cleanup
            setPasswords([]);
            setError(null);
        };
    }, [fetchPasswords]);

    const handleAddPassword = useCallback(async () => {
        if (!accountName.trim() || !username.trim() || !password.trim()) {
            setError("Please fill in all fields");
            return;
        }

        try {
            setIsLoading(true);
            const user = await getUserData();

            if (!user || !user.ui) {
                throw new Error("User data is missing or invalid");
            }

            if (editId) {
                // Update existing password entry
                await invoke('update_password_entry', {
                    entryId: editId,
                    accountName: accountName.trim(),
                    username: username.trim(),
                    password: password.trim(),
                });

                setPasswords(prev =>
                    prev.map(entry =>
                        entry.entry_id === editId
                            ? {
                                entry_id: editId,
                                account_name: accountName.trim(),
                                username: username.trim(),
                                password: password.trim(),
                            }
                            : entry
                    )
                );
            } else {
                // Add new password entry
                const entry_id = await invoke<string>('add_password_entry', {
                    userId: user.ui, // Pass `ui` as `userId`
                    accountName: accountName.trim(),
                    username: username.trim(),
                    password: password.trim(),
                });

                setPasswords(prev => [
                    ...prev,
                    {
                        entry_id,
                        account_name: accountName.trim(),
                        username: username.trim(),
                        password: password.trim(),
                    },
                ]);
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
            await invoke('add_to_trash', {
                userId: user.ui,
                entryId,
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

    const getStrengthColor = (strength?: number) => {
        if (strength === undefined || strength === null) return 'text-gray-500'; // Default for undefined strength
        if (strength >= 4) return 'text-green-500'; // Strong password
        if (strength >= 2) return 'text-yellow-500'; // Medium password
        return 'text-red-500'; // Weak password
    };

    // Render password list
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
        <>
            {showZKPPopup && user && (
                <ZKPMasterPasswordPopup
                    user={user}
                    onSetupComplete={() => setShowZKPPopup(false)}
                />
            )}
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
        </>
    );
};

export default Vault;