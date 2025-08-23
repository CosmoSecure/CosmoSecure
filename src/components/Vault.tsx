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

// Simple client-side PIN hashing function
const hashPin = async (pin: string, salt: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Master Password Prompt Component
const MasterPasswordPrompt = ({ onPasswordProvided }: { onPasswordProvided: (password: string) => void }) => {
    const [pin, setPin] = useState(['', '', '', '']);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useUser();

    const handlePinChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value.slice(-1);
        setPin(newPin);

        if (value && index < 3) {
            const nextInput = document.getElementById(`master-pin-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleSubmit = async () => {
        const masterPin = pin.join('');
        if (masterPin.length !== 4) {
            setError('Please enter a 4-digit PIN');
            return;
        }

        if (!user?.userId) {
            setError('User data not available');
            return;
        }

        setIsLoading(true);
        try {
            // Get the salt for this user
            const salt = await invoke<string>('get_master_salt', { userId: user.userId });

            // Hash the PIN with the same method used during setup
            const hashedPin = await hashPin(masterPin, salt);

            // Verify the master password
            const isValid = await invoke<boolean>('verify_master_password', {
                userId: user.userId,
                providedHash: hashedPin
            });

            if (isValid) {
                onPasswordProvided(masterPin);
                setError('');
            } else {
                setError('Incorrect PIN. Please try again.');
                setPin(['', '', '', '']);
            }
        } catch (error) {
            console.error('Master password verification failed:', error);
            setError('Failed to verify PIN. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-700">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Enter Master PIN</h2>
                    <p className="text-slate-400 text-sm">Enter your 4-digit PIN to access your passwords</p>
                </div>

                <div className="flex justify-center gap-3 mb-6">
                    {pin.map((digit, index) => (
                        <input
                            key={index}
                            id={`master-pin-${index}`}
                            type="text"
                            value={digit}
                            onChange={(e) => handlePinChange(index, e.target.value)}
                            className="w-12 h-12 text-center text-xl font-bold bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                            maxLength={1}
                            disabled={isLoading}
                        />
                    ))}
                </div>

                {error && (
                    <div className="text-red-400 text-sm text-center mb-4">{error}</div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={isLoading || pin.join('').length !== 4}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                    {isLoading ? 'Verifying...' : 'Unlock Vault'}
                </button>
            </div>
        </div>
    );
};

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
    const [masterPassword, setMasterPassword] = useState<string | null>(null);
    const [showMasterPasswordPrompt, setShowMasterPasswordPrompt] = useState(false);

    useEffect(() => {
        if (!user) {
            setShowZKPPopup(false);
            setMasterPassword(null);
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
            // If master password is set but we don't have it in memory, prompt for it
            if (!masterPassword) {
                setShowMasterPasswordPrompt(true);
            }
        }
    }, [user, user?.masterPassword?.isSet, masterPassword]);

    // Fetch passwords from the backend
    const fetchPasswords = useCallback(async () => {
        // Don't fetch if user data is not available, still loading, or no master password
        if (!user?.userId || userLoading || !masterPassword) {
            console.log("Cannot fetch passwords yet", {
                hasUserId: !!user?.userId,
                userLoading,
                hasMasterPassword: !!masterPassword
            });
            return;
        }

        try {
            console.log("Fetching passwords for user:", user.userId);
            setIsLoading(true);
            setError(null);

            const entries = await invoke<any[]>('get_password_entries', {
                ui: user.userId,
                masterPassword: masterPassword, // Pass master password for decryption
            });

            console.log("Fetched entries:", entries);

            // Map backend fields to frontend structure
            const mappedEntries: PasswordEntry[] = entries.map(entry => ({
                entry_id: entry.aid,
                account_name: entry.an,
                username: entry.aun,
                password: entry.ap,
                strength: entry.aps,
            }));

            console.log("Mapped entries with strength:", mappedEntries);
            setPasswords(mappedEntries);
            setInitialLoadDone(true);
        } catch (error) {
            setError("Error fetching passwords. Please try again.");
            console.error("Error fetching passwords:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.userId, userLoading, masterPassword]);

    useEffect(() => {
        // Reset state when user changes
        if (!user?.userId) {
            setPasswords([]);
            setError(null);
            setInitialLoadDone(false);
            setMasterPassword(null);
            return;
        }

        // Only fetch passwords if user data is available, not currently loading, and we have master password
        if (user?.userId && !userLoading && masterPassword && !initialLoadDone) {
            console.log("User data and master password available, fetching passwords");
            fetchPasswords();
        }
    }, [user?.userId, userLoading, masterPassword, fetchPasswords, initialLoadDone]);

    const handleAddPassword = useCallback(async () => {
        if (!user?.userId || !masterPassword) {
            setError("User data or master password not available. Please try again.");
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
                    userId: user.userId,
                    entryId: editId,
                    accountName: accountName.trim(),
                    username: username.trim(),
                    password: password.trim(),
                    masterPassword: masterPassword, // Pass master password for encryption
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
                    userId: user.userId,
                    accountName: accountName.trim(),
                    username: username.trim(),
                    password: password.trim(),
                    masterPassword: masterPassword, // Pass master password for encryption
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
    }, [accountName, username, password, editId, user?.userId, masterPassword, fetchPasswords]);

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

    const handleMasterPasswordProvided = (providedPassword: string) => {
        setMasterPassword(providedPassword);
        setShowMasterPasswordPrompt(false);
        setError(null);
    };

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
    ), [passwords, handleDeletePassword]);

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

            {showMasterPasswordPrompt && (
                <MasterPasswordPrompt onPasswordProvided={handleMasterPasswordProvided} />
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

                {/* Show master password prompt message */}
                {!userLoading && user && user.masterPassword?.isSet && !masterPassword && (
                    <div className="text-yellow-500 mb-4">Please enter your master PIN to access your passwords.</div>
                )}

                {/* Show password-related content only when user data and master password are available */}
                {!userLoading && user && masterPassword && (
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
                                disabled={!user?.userId || isLoading || !masterPassword}
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