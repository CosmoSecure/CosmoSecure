import { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useUser } from '../contexts/UserContext';
import ZKPMasterPasswordPopup from "./auth/ZKPMasterPasswordPopup";

interface PasswordEntry {
    entry_id: string;
    account_name: string;
    username: string;
    password: string;
    strength?: number;
}

const Vault = () => {
    const { user, isLoading: userLoading, refreshUser } = useUser();
    const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
    const [accountName, setAccountName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [editId, setEditId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showZKPPopup, setShowZKPPopup] = useState(false);
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    useEffect(() => {
        if (!user) {
            setShowZKPPopup(false);
            return;
        }

        console.log("Vault user data:", user);
        console.log("Vault password:", user.isSecureVault);
        console.log("Vault master:", user.masterPassword);
        console.log("Vault master isSet:", user.masterPassword?.isSet);

        // Show ZKP popup only if master password is not set
        if (!user.masterPassword?.isSet) {
            console.log("Master password not set, showing ZKP popup");
            setShowZKPPopup(true);
        } else {
            console.log("Master password is set, hiding ZKP popup");
            setShowZKPPopup(false);
        }
    }, [user, user?.masterPassword?.isSet]);

    // Fetch passwords from the backend
    const fetchPasswords = useCallback(async () => {
        // Don't fetch if user data is not available or still loading
        if (!user?.userId || userLoading) {
            console.log("User data not available yet, skipping password fetch", {
                hasUserId: !!user?.userId,
                userLoading
            });
            return;
        }

        try {
            console.log("Fetching passwords for user:", user.userId);
            setIsLoading(true);
            setError(null);

            const entries = await invoke<any[]>('get_password_entries', {
                ui: user.userId, // Pass `userId` as the user ID
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
            setInitialLoadDone(true);
        } catch (error) {
            setError("Error fetching passwords. Please try again.");
            console.error("Error fetching passwords:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.userId, userLoading]);

    useEffect(() => {
        // Reset state when user changes
        if (!user?.userId) {
            setPasswords([]);
            setError(null);
            setInitialLoadDone(false);
            return;
        }

        // Only fetch passwords if user data is available and not currently loading
        if (user?.userId && !userLoading && !initialLoadDone) {
            console.log("User data available, fetching passwords");
            fetchPasswords();
        }
    }, [user?.userId, userLoading, fetchPasswords, initialLoadDone]);

    const handleAddPassword = useCallback(async () => {
        if (!user?.userId) {
            setError("User data not available. Please try again.");
            return;
        }

        if (!accountName.trim() || !username.trim() || !password.trim()) {
            setError("Please fill in all fields");
            return;
        }

        try {
            setIsLoading(true);

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
                    userId: user.userId, // Pass `userId` as `userId`
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
    }, [accountName, username, password, editId, user?.userId, fetchPasswords]);

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
        if (!user?.userId) {
            setError("User data not available. Please try again.");
            return;
        }

        try {
            setIsLoading(true);
            await invoke('add_to_trash', {
                userId: user.userId,
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
    }, [user?.userId, fetchPasswords]);

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
            {showZKPPopup && (
                <ZKPMasterPasswordPopup
                    onSetupComplete={async () => {
                        console.log("Master password setup completed, refreshing user data");
                        setShowZKPPopup(false);
                        // Refresh user context to get updated master password status
                        await refreshUser();
                    }}
                />
            )}
            <div className="p-4 h-full bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text">
                <h1 className="text-2xl font-bold mb-4">Vault</h1>

                {/* Show loading state when user data is still loading */}
                {userLoading && (
                    <div className="text-blue-500 mb-4">Loading user data...</div>
                )}

                {/* Show error if user data failed to load */}
                {!userLoading && !user && (
                    <div className="text-red-500 mb-4">Failed to load user data. Please refresh the page.</div>
                )}

                {/* Show password-related content only when user data is available */}
                {!userLoading && user && (
                    <>
                        {error && <div className="text-red-500 mb-4">{error}</div>}
                        {isLoading && <div className="text-blue-500 mb-4">Loading passwords...</div>}

                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Account Name"
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value)}
                                className="border p-2 mr-2 bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text"
                                disabled={!user?.userId || isLoading}
                            />
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="border p-2 mr-2 bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text"
                                disabled={!user?.userId || isLoading}
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="border p-2 mr-2 bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text"
                                disabled={!user?.userId || isLoading}
                            />
                            <button
                                onClick={handleAddPassword}
                                disabled={!user?.userId || isLoading}
                                className="bg-light-primary dark:bg-dark-primary text-light-text dark:text-dark-text p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {editId !== null ? 'Update' : 'Add'}
                            </button>
                        </div>

                        {/* Show password list or empty state */}
                        {!isLoading && passwords.length === 0 && initialLoadDone && (
                            <div className="text-gray-500 mb-4">No passwords found. Add your first password above.</div>
                        )}

                        {passwords.length > 0 && passwordList}
                    </>
                )}
            </div>
        </>
    );
};

export default Vault;