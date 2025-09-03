import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useUser } from '../contexts/UserContext';
import ZKPMasterPasswordPopup from "./auth/ZKPMasterPasswordPopup";
import { Eye, EyeOff, Copy, Edit2, Trash2, Plus, Lock, ChevronDown, Search, X, RotateCcw } from 'lucide-react';

interface PasswordEntry {
    entry_id: string;
    username: string;
    password: string;
    strength?: number;
    platform?: string;
}

// Platform options with icons
const PLATFORMS = [
    { value: 'google', name: 'Google', icon: '🇬', color: 'bg-red-500' },
    { value: 'github', name: 'GitHub', icon: '🐙', color: 'bg-gray-800' },
    { value: 'facebook', name: 'Facebook', icon: '📘', color: 'bg-blue-600' },
    { value: 'twitter', name: 'Twitter', icon: '🐦', color: 'bg-blue-400' },
    { value: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-700' },
    { value: 'microsoft', name: 'Microsoft', icon: '🏢', color: 'bg-blue-500' },
    { value: 'apple', name: 'Apple', icon: '🍎', color: 'bg-gray-700' },
    { value: 'amazon', name: 'Amazon', icon: '📦', color: 'bg-orange-500' },
    { value: 'netflix', name: 'Netflix', icon: '🎬', color: 'bg-red-600' },
    { value: 'spotify', name: 'Spotify', icon: '🎵', color: 'bg-green-500' },
    { value: 'discord', name: 'Discord', icon: '🎮', color: 'bg-indigo-600' },
    { value: 'slack', name: 'Slack', icon: '💬', color: 'bg-purple-600' },
    { value: 'dropbox', name: 'Dropbox', icon: '📂', color: 'bg-blue-500' },
    { value: 'youtube', name: 'YouTube', icon: '📺', color: 'bg-red-500' },
    { value: 'instagram', name: 'Instagram', icon: '📷', color: 'bg-pink-500' },
    { value: 'other', name: 'Other', icon: '🔐', color: 'bg-gray-500' }
];

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
            <div className="bg-theme-background rounded-2xl shadow-2xl max-w-md w-full p-8 border border-theme-secondary">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-theme-text mb-2">Enter Master PIN</h2>
                    <p className="text-theme-text-transparent text-md">Enter your 4-digit PIN to access your passwords</p>
                </div>

                <div className="flex justify-center gap-3 mb-6">
                    {pin.map((digit, index) => (
                        <input
                            key={index}
                            id={`master-pin-${index}`}
                            type="text"
                            value={digit}
                            onChange={(e) => handlePinChange(index, e.target.value)}
                            className="w-12 h-12 text-center text-xl font-bold bg-theme-secondary border border-theme-secondary rounded-lg text-theme-text focus:border-theme-primary focus:outline-none"
                            maxLength={1}
                            disabled={isLoading}
                        />
                    ))}
                </div>

                {error && (
                    <div className="text-red-400 text-md text-center mb-4">{error}</div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={isLoading || pin.join('').length !== 4}
                    className="w-full bg-theme-primary hover:bg-theme-primary-transparent disabled:bg-theme-secondary text-theme-text font-medium py-3 px-4 rounded-lg transition-colors"
                >
                    {isLoading ? 'Verifying...' : 'Unlock Vault'}
                </button>
            </div>
        </div>
    );
};

// Individual Password Card Component with inline editing
const PasswordCard = React.memo(({
    entry,
    platformInfo,
    isVisible,
    isEditing,
    isLoading,
    onToggleVisibility,
    onCopy,
    onEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    getStrengthColor,
    platforms,
    decryptedPassword,
    isDecrypting,
    onRetryDecryption
}: {
    entry: PasswordEntry;
    platformInfo: any;
    isVisible: boolean;
    isEditing: boolean;
    isLoading: boolean;
    onToggleVisibility: () => void;
    onCopy: (text: string, type: string) => void;
    onEdit: () => void;
    onSaveEdit: (entryId: string, username: string, password: string, platform: string) => void;
    onCancelEdit: () => void;
    onDelete: () => void;
    getStrengthColor: (strength?: number) => string;
    platforms: any[];
    decryptedPassword?: string;
    isDecrypting?: boolean;
    onRetryDecryption?: (entryId: string) => void;
}) => {
    const [editUsername, setEditUsername] = useState(entry.username);
    const [editPassword, setEditPassword] = useState(entry.password);
    const [editPlatform, setEditPlatform] = useState(entry.platform || 'other');
    const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
    const [showEditPassword, setShowEditPassword] = useState(false);

    // Reset form when switching to edit mode
    useEffect(() => {
        if (isEditing) {
            setEditUsername(entry.username);
            // Use decrypted password if available, otherwise use the encrypted one
            setEditPassword(decryptedPassword || entry.password);
            setEditPlatform(entry.platform || 'other');
        }
    }, [isEditing, entry, decryptedPassword]);

    const handleSave = () => {
        onSaveEdit(entry.entry_id, editUsername, editPassword, editPlatform);
    };

    const getPlatformInfo = (platformValue?: string) => {
        return platforms.find(p => p.value === platformValue) || platforms.find(p => p.value === 'other')!;
    };

    if (isEditing) {
        const editPlatformInfo = getPlatformInfo(editPlatform);

        return (
            <div className="bg-theme-secondary rounded-xl shadow-lg p-6 border-2 border-theme-primary">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-theme-text mb-2">Edit Password</h3>
                </div>

                {/* Platform Selection */}
                <div className="mb-4">
                    <label className="block text-xs text-theme-text-transparent mb-1">Platform</label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                            className="w-full px-3 py-2 border border-theme-secondary rounded-md focus:ring-2 focus:ring-theme-primary focus:border-transparent bg-theme-background text-theme-text flex items-center justify-between text-md"
                        >
                            <div className="flex items-center gap-2">
                                <span>{editPlatformInfo.icon}</span>
                                <span>{editPlatformInfo.name}</span>
                            </div>
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        {showPlatformDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-theme-background border border-theme-secondary rounded-md shadow-lg max-h-40 overflow-y-auto">
                                {platforms.map((p) => (
                                    <button
                                        key={p.value}
                                        type="button"
                                        onClick={() => {
                                            setEditPlatform(p.value);
                                            setShowPlatformDropdown(false);
                                        }}
                                        className="w-full px-3 py-2 text-left hover:bg-theme-background-transparent flex items-center gap-2 text-md"
                                    >
                                        <span>{p.icon}</span>
                                        <span className="text-theme-text">{p.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Username */}
                <div className="mb-4">
                    <label className="block text-xs text-theme-text-transparent mb-1">Username</label>
                    <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-theme-secondary rounded-md focus:ring-2 focus:ring-theme-primary focus:border-transparent bg-theme-background text-theme-text text-md"
                    />
                </div>

                {/* Password */}
                <div className="mb-4">
                    <label className="block text-xs text-theme-text-transparent mb-1">Password</label>
                    <div className="relative">
                        <input
                            type={showEditPassword ? "text" : "password"}
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            className="w-full px-3 py-2 pr-10 border border-theme-secondary rounded-md focus:ring-2 focus:ring-theme-primary focus:border-transparent bg-theme-background text-theme-text text-md"
                        />
                        <button
                            type="button"
                            onClick={() => setShowEditPassword(!showEditPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-theme-text-transparent hover:text-theme-text"
                            title={showEditPassword ? 'Hide password' : 'Show password'}
                        >
                            {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={isLoading || !editUsername.trim() || !editPassword.trim()}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-theme-secondary text-theme-text py-2 px-3 rounded-md text-md transition-colors"
                    >
                        {isLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                        onClick={onCancelEdit}
                        className="flex-1 bg-theme-accent hover:bg-theme-accent-transparent text-theme-text py-2 px-3 rounded-md text-md transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    // View mode
    return (
        <div className="bg-theme-accent rounded-xl shadow-lg p-6 border border-theme-secondary">
            {/* Card Header with Platform Icon */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${platformInfo.color} flex items-center justify-center text-white text-lg`}>
                        {platformInfo.icon}
                    </div>
                    <div>
                        <h3 className="font-semibold text-theme-text truncate">
                            {platforms.find(p => p.value === entry.platform)?.name || entry.platform || 'Account'}
                        </h3>
                    </div>
                </div>
                <span className={`text-md font-medium ${getStrengthColor(entry.strength)}`}>
                    {entry.strength ? `${entry.strength}/4` : 'Weak'}
                </span>
            </div>

            {/* Card Content */}
            <div>
                <div className="border border-theme-accent-transparent bg-theme-secondary-transparent p-1 rounded-t-lg">
                    <div className="flex items-center gap-2 mt-1 mx-1">
                        <p className="text-md text-theme-text flex-1 truncate">{entry.username}</p>
                        <button
                            onClick={() => onCopy(entry.username, 'Username')}
                            className="text-theme-text-transparent hover:text-theme-text p-1"
                            title="Copy username"
                        >
                            <Copy className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                <div className="border border-theme-accent-transparent bg-theme-secondary-transparent p-1 rounded-b-lg">
                    <div className="flex items-center gap-2 mt-1 mx-1">
                        <p className="text-md text-theme-text flex-1 font-mono overflow-scroll">
                            {isVisible ? (
                                isDecrypting ? (
                                    <span className="flex items-center gap-2">
                                        <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-theme-primary"></div>
                                        Decrypting...
                                    </span>
                                ) : decryptedPassword === '[DECRYPTION_FAILED]' ? (
                                    <span className="text-red-500 text-sm">Failed to decrypt</span>
                                ) : (
                                    decryptedPassword || '••••••••'
                                )
                            ) : '••••••••'}
                        </p>
                        <button
                            onClick={onToggleVisibility}
                            className="text-theme-text-transparent hover:text-theme-text p-1"
                            title={isVisible ? 'Hide password' : 'Show password'}
                            disabled={isDecrypting}
                        >
                            {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button
                            onClick={() => {
                                if (decryptedPassword && decryptedPassword !== '[DECRYPTION_FAILED]') {
                                    onCopy(decryptedPassword, 'Password');
                                }
                            }}
                            className="text-theme-text-transparent hover:text-theme-text p-1"
                            title="Copy password"
                            disabled={!isVisible || isDecrypting || decryptedPassword === '[DECRYPTION_FAILED]'}
                        >
                            <Copy className="w-3 h-3" />
                        </button>
                        {decryptedPassword === '[DECRYPTION_FAILED]' && onRetryDecryption && (
                            <button
                                onClick={() => onRetryDecryption(entry.entry_id)}
                                className="text-theme-primary hover:text-theme-primary-transparent p-1"
                                title="Retry decryption"
                            >
                                <RotateCcw className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Card Actions */}
            <div className="flex justify-between gap-2 mt-4 pt-3 border-t border-theme-secondary">
                <button
                    onClick={onEdit}
                    className="flex items-center gap-1 bg-theme-primary hover:bg-theme-primary-transparent text-theme-text px-3 py-1.5 rounded-md text-md transition-colors"
                >
                    <Edit2 className="w-3 h-3" />
                    Edit
                </button>
                <button
                    onClick={onDelete}
                    disabled={isLoading}
                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-md transition-colors disabled:opacity-50"
                >
                    <Trash2 className="w-3 h-3" />
                    Delete
                </button>
            </div>
        </div>
    );
});

const Vault = () => {
    const { user, isLoading: userLoading, refreshUser } = useUser();
    const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [platform, setPlatform] = useState('google');
    const [editId, setEditId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showZKPPopup, setShowZKPPopup] = useState(false);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [masterPassword, setMasterPassword] = useState<string | null>(null);
    const [showMasterPasswordPrompt, setShowMasterPasswordPrompt] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
    const [showAddForm, setShowAddForm] = useState(false);
    const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showPasswordInForm, setShowPasswordInForm] = useState(false);
    const [decryptedPasswords, setDecryptedPasswords] = useState<Map<string, string>>(new Map());
    const [decryptingPasswords, setDecryptingPasswords] = useState<Set<string>>(new Set());

    // Memoized helper functions
    const getPlatformInfo = useCallback((platformValue?: string, username?: string) => {
        // First try to find by explicit platform value
        if (platformValue) {
            const platform = PLATFORMS.find(p => p.value === platformValue);
            if (platform) return platform;
        }

        // If no platform value or not found, try to guess from username
        if (username) {
            const usernameLower = username.toLowerCase();
            const platform = PLATFORMS.find(p =>
                usernameLower.includes(p.name.toLowerCase()) ||
                usernameLower.includes(`@${p.value}.`) || // email patterns
                usernameLower.includes(p.value)
            );
            if (platform && platform.value !== 'google') return platform;
        }

        // Default fallback - use platform name as display name
        if (platformValue) {
            return {
                value: platformValue,
                name: platformValue.charAt(0).toUpperCase() + platformValue.slice(1),
                icon: '🔐',
                color: 'bg-gray-600'
            };
        }

        // Last resort - use generic platform
        return {
            value: 'generic',
            name: 'Account',
            icon: '🔐',
            color: 'bg-gray-600'
        };
    }, []);

    const getStrengthColor = useCallback((strength?: number) => {
        if (!strength || strength <= 1) return 'text-red-500';
        if (strength === 2) return 'text-orange-500';
        if (strength === 3) return 'text-yellow-500';
        return 'text-green-500';
    }, []);

    // Copy to clipboard function
    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text);
            // You could add a toast notification here
            console.log(`${type} copied to clipboard`);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };

    // Decrypt individual password on demand
    const decryptPassword = useCallback(async (entryId: string, retryCount = 0) => {
        if (!user?.userId || !masterPassword) {
            console.error("Cannot decrypt: missing user ID or master password");
            return;
        }

        // Check if already decrypted
        if (decryptedPasswords.has(entryId)) {
            return;
        }

        // Check if currently decrypting (but allow retries)
        if (decryptingPasswords.has(entryId) && retryCount === 0) {
            return;
        }

        try {
            setDecryptingPasswords(prev => new Set([...prev, entryId]));

            console.log(`Attempting to decrypt password for entry ${entryId} (attempt ${retryCount + 1})`);

            const decryptedPassword = await invoke<string>('decrypt_single_password', {
                ui: user.userId,
                entryId: entryId,
                masterPassword: masterPassword
            });

            if (decryptedPassword && decryptedPassword.trim() !== '') {
                console.log(`Successfully decrypted password for entry ${entryId}`);
                setDecryptedPasswords(prev => new Map([...prev, [entryId, decryptedPassword]]));
            } else {
                throw new Error('Decrypted password is empty or invalid');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error decrypting password for entry ${entryId} (attempt ${retryCount + 1}):`, {
                error: errorMessage,
                entryId,
                retryCount,
                hasUserId: !!user?.userId,
                hasMasterPassword: !!masterPassword
            });

            // Retry logic with exponential backoff
            if (retryCount < 2) { // Max 3 attempts (0, 1, 2)
                const delay = Math.pow(2, retryCount) * 500; // 500ms, 1s, 2s
                console.log(`Retrying decryption for entry ${entryId} in ${delay}ms... (retry ${retryCount + 1}/2)`);

                setTimeout(() => {
                    decryptPassword(entryId, retryCount + 1);
                }, delay);
            } else {
                console.error(`Failed to decrypt password for entry ${entryId} after ${retryCount + 1} attempts. Final error:`, errorMessage);
                // Set a placeholder to indicate decryption failed
                setDecryptedPasswords(prev => new Map([...prev, [entryId, '[DECRYPTION_FAILED]']]));
            }
        } finally {
            // Only remove from decrypting set if this is the final attempt or success
            if (retryCount === 0 || retryCount >= 2) {
                setDecryptingPasswords(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(entryId);
                    return newSet;
                });
            }
        }
    }, [user?.userId, masterPassword]);

    // Retry function for failed decryptions with debounce
    const retryDecryption = useCallback((entryId: string) => {
        console.log(`Manual retry requested for entry: ${entryId}`);

        // Clear the failed state
        setDecryptedPasswords(prev => {
            const newMap = new Map(prev);
            newMap.delete(entryId);
            return newMap;
        });

        // Clear any ongoing decryption attempts
        setDecryptingPasswords(prev => {
            const newSet = new Set(prev);
            newSet.delete(entryId);
            return newSet;
        });

        // Small delay to prevent rapid retries, then attempt decryption
        setTimeout(() => {
            console.log(`Executing manual retry for entry: ${entryId}`);
            decryptPassword(entryId, 0); // Start from attempt 0
        }, 100);
    }, [decryptPassword]);

    // Toggle password visibility and decrypt on demand
    const togglePasswordVisibility = useCallback(async (entryId: string) => {
        console.log(`Toggle visibility for entry: ${entryId}, current visible count: ${visiblePasswords.size}`);

        // Prevent rapid clicking during decryption
        if (decryptingPasswords.has(entryId)) {
            console.log(`Ignoring toggle - entry ${entryId} is currently decrypting`);
            return;
        }

        setVisiblePasswords(prev => {
            const newVisible = new Set(prev);

            if (newVisible.has(entryId)) {
                // Hide password
                console.log(`Hiding password for entry: ${entryId}`);
                newVisible.delete(entryId);
            } else {
                // Show password - decrypt if not already decrypted
                console.log(`Showing password for entry: ${entryId}`);
                if (!decryptedPasswords.has(entryId)) {
                    console.log(`Need to decrypt entry: ${entryId}`);
                    // Decrypt in background
                    decryptPassword(entryId, 0).catch(err => {
                        console.error(`Failed to decrypt ${entryId}:`, err);
                    });
                }
                newVisible.add(entryId);
            }

            return newVisible;
        });
    }, [decryptPassword]);

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

    // Fetch passwords from the backend (without decryption for performance)
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

            // Fetch encrypted passwords without decryption for faster loading
            const entries = await invoke<any[]>('get_password_entries_encrypted', {
                ui: user.userId
            });

            console.log("Fetched encrypted entries:", entries);

            // Map backend fields to frontend structure (passwords remain encrypted)
            const mappedEntries: PasswordEntry[] = entries.map(entry => ({
                entry_id: entry.aid,
                username: entry.aun,
                password: entry.ap, // This is still encrypted
                strength: entry.aps,
                platform: entry.plt, // Map platform field
            }));

            console.log("Mapped encrypted entries:", mappedEntries);
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
            setDecryptedPasswords(new Map());
            setDecryptingPasswords(new Set());
            setVisiblePasswords(new Set());
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

        const platformInfo = getPlatformInfo(platform);
        if (!username.trim() || !password.trim()) {
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
                    username: username.trim(),
                    password: password.trim(),
                    platform: platform, // Pass the platform value
                    masterPassword: masterPassword, // Pass master password for encryption
                });

                setPasswords(prev =>
                    prev.map(entry =>
                        entry.entry_id === editId
                            ? {
                                entry_id: editId,
                                account_name: platformInfo.name,
                                username: username.trim(),
                                password: password.trim(),
                                platform: platform,
                                strength: entry.strength
                            }
                            : entry
                    )
                );
            } else {
                // Add new password entry
                const entry_id = await invoke<string>('add_password_entry', {
                    userId: user.userId,
                    username: username.trim(),
                    password: password.trim(),
                    platform: platform, // Pass the platform value (like "google", "github")
                    masterPassword: masterPassword, // Pass master password for encryption
                });

                setPasswords(prev => [
                    ...prev,
                    {
                        entry_id,
                        username: username.trim(),
                        password: password.trim(),
                        platform: platform,
                        strength: 0
                    },
                ]);
            }

            // Reset form
            setUsername('');
            setPassword('');
            setPlatform('google');
            setEditId(null);
            setError(null);
            setShowAddForm(false);

            // Update storage in background
            fetchPasswords();
        } catch (error) {
            console.error("Error adding/updating password:", error);

            // Check if it's a password limit error
            const errorMessage = String(error);
            if (errorMessage.includes('Password limit reached') ||
                errorMessage.includes('limit') ||
                errorMessage.includes('maximum') ||
                errorMessage.includes('exceeded')) {
                setError("Password limit reached! You've hit your maximum password storage limit. Consider upgrading your plan or removing some passwords.");
            } else {
                setError("Error adding/updating password. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [username, password, platform, editId, user?.userId, masterPassword, fetchPasswords, getPlatformInfo]);

    const handleEditPassword = (entryId: string) => {
        const entry = passwords.find(entry => entry.entry_id === entryId);
        if (entry) {
            setEditId(entryId);
            // Don't pre-fill form or show add form - we'll edit inline
        }
    };

    const handleSaveEdit = async (entryId: string, newUsername: string, newPassword: string, newPlatform: string) => {
        if (!user?.userId || !masterPassword) {
            setError("User data or master password not available. Please try again.");
            return;
        }

        const platformInfo = getPlatformInfo(newPlatform);
        if (!newUsername.trim() || !newPassword.trim()) {
            setError("Please fill in all fields");
            return;
        }

        try {
            setIsLoading(true);

            await invoke('update_password_entry', {
                userId: user.userId,
                entryId: entryId,
                username: newUsername.trim(),
                password: newPassword.trim(),
                platform: newPlatform, // Pass the platform value
                masterPassword: masterPassword,
            });

            setPasswords(prev =>
                prev.map(entry =>
                    entry.entry_id === entryId
                        ? {
                            ...entry,
                            account_name: platformInfo.name,
                            username: newUsername.trim(),
                            password: newPassword.trim(),
                            platform: newPlatform,
                        }
                        : entry
                )
            );

            setEditId(null);
            setError(null);
            fetchPasswords();
        } catch (error) {
            console.error("Error updating password:", error);

            // Check if it's a password limit error (though unlikely during update)
            const errorMessage = String(error);
            if (errorMessage.includes('Password limit reached') ||
                errorMessage.includes('limit') ||
                errorMessage.includes('maximum') ||
                errorMessage.includes('exceeded')) {
                setError("Password limit reached! You've hit your maximum password storage limit.");
            } else {
                setError("Error updating password. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditId(null);
    };

    // Filter and sort passwords based on search query
    // Optimize filtering with memoized search
    // Optimized filtering with memoized search
    const filteredPasswords = useMemo(() => {
        if (!searchQuery.trim()) {
            return passwords;
        }

        const query = searchQuery.toLowerCase();
        const matchingPasswords = passwords.filter(entry => {
            const platformInfo = getPlatformInfo(entry.platform, entry.username);
            const usernameText = entry.username?.toLowerCase() ?? '';
            const platformName = platformInfo.name.toLowerCase();

            return usernameText.includes(query) ||
                username.includes(query) ||
                platformName.includes(query);
        });

        // Sort by relevance - exact matches first, then partial matches
        return matchingPasswords.sort((a, b) => {
            const platformInfoA = getPlatformInfo(a.platform, a.username);
            const platformInfoB = getPlatformInfo(b.platform, b.username);

            // Calculate relevance scores (higher = more relevant)
            const getRelevanceScore = (entry: PasswordEntry, platformInfo: any) => {
                const usernameMatch = entry.username?.toLowerCase() || '';
                const platformMatch = platformInfo.name.toLowerCase();

                let score = 0;

                // Exact matches get highest priority
                if (usernameMatch === query) score += 90;
                if (platformMatch === query) score += 80;

                // Starts with query gets medium priority
                if (usernameMatch.startsWith(query)) score += 40;
                if (platformMatch.startsWith(query)) score += 30;

                // Contains query gets lowest priority
                if (usernameMatch.includes(query)) score += 8;
                if (platformMatch.includes(query)) score += 5;

                return score;
            };

            const scoreA = getRelevanceScore(a, platformInfoA);
            const scoreB = getRelevanceScore(b, platformInfoB);

            // Sort by relevance score (descending)
            if (scoreB !== scoreA) {
                return scoreB - scoreA;
            }

            // If same relevance, maintain original order
            return passwords.indexOf(a) - passwords.indexOf(b);
        });
    }, [passwords, searchQuery, getPlatformInfo]);

    // Clear search
    const clearSearch = () => {
        setSearchQuery('');
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

    // Render password list with cards
    const passwordList = useMemo(() => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {filteredPasswords.map((entry) => {
                const platformInfo = getPlatformInfo(entry.platform, entry.username);
                const isVisible = visiblePasswords.has(entry.entry_id);
                const isEditing = editId === entry.entry_id;

                return (
                    <PasswordCard
                        key={entry.entry_id}
                        entry={entry}
                        platformInfo={platformInfo}
                        isVisible={isVisible}
                        isEditing={isEditing}
                        isLoading={isLoading}
                        onToggleVisibility={() => togglePasswordVisibility(entry.entry_id)}
                        onCopy={copyToClipboard}
                        onEdit={() => handleEditPassword(entry.entry_id)}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={handleCancelEdit}
                        onDelete={() => handleDeletePassword(entry.entry_id)}
                        getStrengthColor={getStrengthColor}
                        platforms={PLATFORMS}
                        decryptedPassword={decryptedPasswords.get(entry.entry_id)}
                        isDecrypting={decryptingPasswords.has(entry.entry_id)}
                        onRetryDecryption={retryDecryption}
                    />
                );
            })}
        </div>
    ), [filteredPasswords, visiblePasswords, editId, decryptedPasswords, decryptingPasswords]);

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

            <div className="h-full mx-auto px-10 py-8 bg-theme-background overflow-y-auto">
                {/* Header with Search Bar */}
                <div className="flex items-center justify-between mb-8">
                    {!userLoading && user && masterPassword ? (
                        <div className="flex items-center gap-4 flex-1">
                            <Lock className="w-8 h-8 text-theme-primary" />
                            <div className="relative flex-1 max-w-md">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-theme-text-transparent" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search passwords..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full pl-10 pr-10 py-2 border border-theme-secondary rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-transparent bg-theme-background text-theme-text placeholder-theme-text-transparent"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        <X className="h-5 w-5 text-theme-text-transparent hover:text-theme-text" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Lock className="w-8 h-8 text-theme-primary" />
                            <h1 className="text-3xl font-bold text-theme-text">Password Vault</h1>
                        </div>
                    )}
                    <button
                        onClick={() => {
                            setShowAddForm(!showAddForm);
                            setEditId(null);
                            setUsername('');
                            setPassword('');
                            setPlatform('google');
                        }}
                        disabled={!user?.userId || !masterPassword}
                        className="flex items-center gap-2 bg-theme-primary hover:bg-theme-primary-transparent disabled:bg-theme-secondary text-theme-text px-4 py-2 rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Password
                    </button>
                </div>

                {/* Decryption Status (for large password counts) */}
                {!userLoading && user && masterPassword && passwords.length > 50 && (
                    <div className="mb-6 p-4 bg-theme-accent rounded-lg border border-theme-secondary">
                        <div className="text-sm text-theme-text-transparent">
                            Vault Status: {passwords.length} passwords loaded •
                            {decryptedPasswords.size} decrypted •
                            {decryptingPasswords.size} decrypting •
                            {Array.from(decryptedPasswords.values()).filter(p => p === '[DECRYPTION_FAILED]').length} failed
                        </div>
                        {Array.from(decryptedPasswords.values()).filter(p => p === '[DECRYPTION_FAILED]').length > 0 && (
                            <div className="text-xs text-red-500 mt-1">
                                Some passwords failed to decrypt. Click the retry button next to failed passwords.
                            </div>
                        )}
                    </div>
                )}

                {/* Search Results Info */}
                {!userLoading && user && masterPassword && searchQuery && (
                    <div className="mb-6">
                        <p className="text-md text-theme-text-transparent">
                            Found {filteredPasswords.length} of {passwords.length} passwords
                        </p>
                    </div>
                )}

                {/* Show loading state when user data is still loading */}
                {userLoading && (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
                        <p className="mt-2 text-theme-primary">Loading user data...</p>
                    </div>
                )}

                {/* Show error if user data failed to load */}
                {!userLoading && !user && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        Failed to load user data. Please refresh the page.
                    </div>
                )}

                {/* Show master password prompt message */}
                {!userLoading && user && user.masterPassword?.isSet && !masterPassword && (
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
                        Please enter your master PIN to access your passwords.
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className={`border px-4 py-3 rounded mb-6 ${error.includes('Password limit reached')
                        ? 'bg-orange-100 border-orange-400 text-orange-700'
                        : 'bg-red-100 border-red-400 text-red-700'
                        }`}>
                        <div className="flex items-start">
                            {error.includes('Password limit reached') && (
                                <div className="mr-2 mt-0.5">
                                    <Lock className="w-5 h-5 text-orange-600" />
                                </div>
                            )}
                            <div>
                                <p className="font-medium">
                                    {error.includes('Password limit reached') ? 'Storage Limit Reached' : 'Error'}
                                </p>
                                <p className="text-md mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Password Form */}
                {showAddForm && user && masterPassword && (
                    <div className="bg-theme-accent-transparent rounded-xl shadow-lg p-6 mb-6 border border-theme-secondary">
                        <h2 className="text-xl font-semibold mb-4 text-theme-text">
                            {editId ? 'Edit Password' : 'Add New Password'}
                        </h2>

                        <div className="grid grid-cols-1 gap-4 mb-4">
                            {/* Platform Selection */}
                            <div className="relative">
                                <label className="block text-md font-medium text-theme-text mb-1">Platform</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                                        className="w-full px-4 py-2 border border-theme-secondary rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-transparent bg-theme-background text-theme-text flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{getPlatformInfo(platform).icon}</span>
                                            <span>{getPlatformInfo(platform).name}</span>
                                        </div>
                                        <ChevronDown className="w-4 h-4" />
                                    </button>

                                    {showPlatformDropdown && (
                                        <div className="absolute z-10 w-full mt-1 bg-theme-background border border-theme-secondary rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {PLATFORMS.map((p) => (
                                                <button
                                                    key={p.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setPlatform(p.value);
                                                        setShowPlatformDropdown(false);
                                                    }}
                                                    className="w-full px-4 py-2 text-left hover:bg-theme-background-transparent flex items-center gap-2"
                                                >
                                                    <span className="text-lg">{p.icon}</span>
                                                    <span className="text-theme-text">{p.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Username */}
                            <div>
                                <label className="block text-md font-medium text-theme-text mb-1">Username/Email</label>
                                <input
                                    type="text"
                                    placeholder="username or email"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-2 border border-theme-secondary rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-transparent bg-theme-background text-theme-text"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-md font-medium text-theme-text mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswordInForm ? "text" : "password"}
                                        placeholder="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2 pr-10 border border-theme-secondary rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-transparent bg-theme-background text-theme-text"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordInForm(!showPasswordInForm)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-theme-text-transparent hover:text-theme-text"
                                        title={showPasswordInForm ? 'Hide password' : 'Show password'}
                                    >
                                        {showPasswordInForm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleAddPassword}
                                disabled={isLoading || !username.trim() || !password.trim()}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-theme-secondary text-theme-text px-6 py-2 rounded-lg transition-colors"
                            >
                                {isLoading ? 'Saving...' : (editId ? 'Update Password' : 'Add Password')}
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setEditId(null);
                                    setUsername('');
                                    setPassword('');
                                    setPlatform('google');
                                }}
                                className="bg-theme-secondary hover:bg-theme-secondary-transparent text-theme-text px-6 py-2 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && user && masterPassword && (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
                        <p className="mt-2 text-theme-text-transparent">Loading passwords...</p>
                    </div>
                )}

                {/* Password Cards */}
                {!userLoading && user && masterPassword && !isLoading && (
                    <>
                        {searchQuery && filteredPasswords.length === 0 ? (
                            <div className="text-center py-12">
                                <Search className="w-16 h-16 text-theme-text-transparent mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-theme-text mb-2">No passwords found</h3>
                                <p className="text-theme-text-transparent mb-6">
                                    No passwords match your search for "{searchQuery}"
                                </p>
                                <button
                                    onClick={clearSearch}
                                    className="bg-theme-primary hover:bg-theme-primary-transparent text-theme-text px-6 py-3 rounded-lg transition-colors"
                                >
                                    Clear Search
                                </button>
                            </div>
                        ) : passwords.length === 0 && initialLoadDone ? (
                            <div className="text-center py-12">
                                <Lock className="w-16 h-16 text-theme-text-transparent mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-theme-text mb-2">No passwords yet</h3>
                                <p className="text-theme-text-transparent mb-6">Start by adding your first password to the vault.</p>
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="bg-theme-primary hover:bg-theme-primary-transparent text-theme-text px-6 py-3 rounded-lg transition-colors"
                                >
                                    Add Your First Password
                                </button>
                            </div>
                        ) : (
                            filteredPasswords.length > 0 && passwordList
                        )}
                    </>
                )}
            </div>
        </>
    );
};

export default Vault;