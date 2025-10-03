import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useUser } from '../contexts/UserContext';
import { useSearchParams } from 'react-router-dom';
import ZKPMasterPasswordPopup from "./auth/ZKPMasterPasswordPopup";
import { Eye, EyeOff, Copy, Edit2, Trash2, Plus, Lock, ChevronDown, Search, X, RotateCcw, User, Save, Shield, AlertTriangle, Clock } from 'lucide-react';
import {
    Warning as WarningIcon,
    Close as CloseIcon
} from "@mui/icons-material";
import { PLATFORMS, FontAwesomeIcon } from '../constants/platforms';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';

interface PasswordEntry {
    entry_id: string;
    username: string;
    password: string;
    strength?: number;
    platform?: string;
    lastUpdate?: number; // Timestamp for tracking password age
}



// Hash master password with SHA-256 (same as in ZKP setup)
const hashMasterPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Master Password Prompt Component
const MasterPasswordPrompt = ({ onPasswordProvided }: { onPasswordProvided: () => void }) => {
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

        setError('');
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace') {
            // If current input has value, let default behavior clear it
            if (pin[index]) {
                // Don't prevent default, let it clear naturally
                return;
            }
            // If current input is empty and not first input, go to previous input
            else if (index > 0) {
                e.preventDefault();
                const prevInput = document.getElementById(`master-pin-${index - 1}`) as HTMLInputElement;
                if (prevInput) {
                    const newPin = [...pin];
                    newPin[index - 1] = '';
                    setPin(newPin);
                    setError('');
                    prevInput.focus();
                    prevInput.select(); // Select the content so it gets replaced
                }
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();

            const currentPinStr = pin.join('');
            if (currentPinStr.length === 4) {
                handleSubmit();
            } else {
                // Find next empty input
                let nextIndex = -1;
                for (let i = index + 1; i < 4; i++) {
                    if (!pin[i]) {
                        nextIndex = i;
                        break;
                    }
                }

                // If no empty input after current, find first empty from start
                if (nextIndex === -1) {
                    for (let i = 0; i < 4; i++) {
                        if (!pin[i]) {
                            nextIndex = i;
                            break;
                        }
                    }
                }

                if (nextIndex !== -1) {
                    const nextInput = document.getElementById(`master-pin-${nextIndex}`);
                    nextInput?.focus();
                }
            }
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
            // Hash the PIN with SHA-256 (same method used during setup)
            const masterPasswordHash = await hashMasterPassword(masterPin);

            // Get the stored master password SHA from user data
            const storedMasterPasswordSha = user.masterPassword?.hash;

            if (!storedMasterPasswordSha) {
                setError('Master password hash not available. Please try again.');
                return;
            }

            // Verify by comparing the SHA values
            if (masterPasswordHash === storedMasterPasswordSha) {
                onPasswordProvided();
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
                            onKeyDown={(e) => handleKeyDown(index, e)}
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
    getStrengthText,
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
    getStrengthText: (strength?: number) => string;
    platforms: any[];
    decryptedPassword?: string;
    isDecrypting?: boolean;
    onRetryDecryption?: (entryId: string) => void;
}) => {
    const [editUsername, setEditUsername] = useState(entry.username);
    const [editPassword, setEditPassword] = useState(entry.password);
    const [editPlatform, setEditPlatform] = useState(entry.platform || 'other');
    const [editCustomPlatformName, setEditCustomPlatformName] = useState('');
    const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
    const [editPlatformSearchQuery, setEditPlatformSearchQuery] = useState('');
    const [showEditPassword, setShowEditPassword] = useState(false);

    // Reset form when switching to edit mode
    useEffect(() => {
        if (isEditing) {
            setEditUsername(entry.username);
            // Prioritize decrypted password, but don't use encrypted password as fallback
            if (decryptedPassword && decryptedPassword !== '[DECRYPTION_FAILED]') {
                setEditPassword(decryptedPassword);
            } else {
                // If no decrypted password available, start with empty field or show loading
                // The decryption should have been triggered in handleEditPassword
                setEditPassword('');
            }
            setEditPlatform(entry.platform || 'other');
            // If platform is not in predefined list, treat as custom
            if (entry.platform && !platforms.find(p => p.value === entry.platform)) {
                setEditPlatform('other');
                setEditCustomPlatformName(entry.platform);
            } else {
                setEditCustomPlatformName('');
            }
        }
    }, [isEditing, entry, decryptedPassword]);

    const handleSave = () => {
        const finalPlatform = editPlatform === 'other' && editCustomPlatformName.trim()
            ? editCustomPlatformName.trim()
            : editPlatform;
        onSaveEdit(entry.entry_id, editUsername, editPassword, finalPlatform);
    };

    const getPlatformInfo = (platformValue?: string) => {
        return platforms.find(p => p.value === platformValue) || platforms.find(p => p.value === 'other')!;
    };

    if (isEditing) {
        const editPlatformInfo = getPlatformInfo(editPlatform);

        return (
            <div className="bg-theme-secondary rounded-lg shadow-xl hover:shadow-2xl p-4 border-2 border-theme-primary transition-shadow duration-300">
                <div className="mb-3">
                    <h3 className="text-base font-semibold text-theme-text mb-1">Edit Password</h3>
                </div>

                {/* Platform Selection */}
                <div className="mb-3">
                    <label className="block text-xs text-theme-text-transparent mb-1">Platform</label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setShowPlatformDropdown(!showPlatformDropdown);
                                setEditPlatformSearchQuery('');
                                // Auto-focus the search input
                                setTimeout(() => {
                                    const searchInput = document.getElementById('edit-platform-search-input');
                                    searchInput?.focus();
                                }, 100);
                            }}
                            className="w-full px-2.5 py-1.5 border border-theme-secondary rounded focus:ring-1 focus:ring-theme-primary focus:border-transparent bg-theme-background text-theme-text flex items-center justify-between text-sm shadow-md hover:shadow-lg focus:shadow-lg transition-shadow duration-200"
                        >
                            <div className="flex items-center gap-1.5">
                                <div className={`w-4 h-4 rounded ${editPlatformInfo.color} flex items-center justify-center text-white`}>
                                    <FontAwesomeIcon icon={editPlatformInfo.icon} className="w-3.5 h-3.5" />
                                </div>
                                <span>{editPlatformInfo.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditPlatform('');
                                        setEditPlatformSearchQuery('');
                                        setEditCustomPlatformName('');
                                    }}
                                    className="p-0.5 hover:bg-theme-secondary-transparent rounded-full transition-colors"
                                    title="Clear selection"
                                >
                                    <X className="w-2.5 h-2.5" />
                                </button>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showPlatformDropdown ? 'rotate-180' : ''}`} />
                            </div>
                        </button>

                        {showPlatformDropdown && (
                            <>
                                <div
                                    className="fixed inset-0 z-5"
                                    onClick={() => {
                                        setShowPlatformDropdown(false);
                                        setEditPlatformSearchQuery('');
                                    }}
                                />
                                <div className="absolute z-10 w-full mt-1 bg-theme-background border border-theme-secondary rounded-lg shadow-xl max-h-48 backdrop-blur-sm">
                                    {/* Search Input */}
                                    <div className="sticky top-0 bg-theme-background border-b border-theme-secondary p-1.5 rounded-t-lg">
                                        <div className="relative">
                                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-theme-text opacity-50" />
                                            <input
                                                id="edit-platform-search-input"
                                                type="text"
                                                placeholder="Search platforms..."
                                                value={editPlatformSearchQuery}
                                                onChange={(e) => setEditPlatformSearchQuery(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Escape') {
                                                        setShowPlatformDropdown(false);
                                                        setEditPlatformSearchQuery('');
                                                    } else if (e.key === 'Enter') {
                                                        const filteredPlatforms = platforms.filter(p =>
                                                            p.name.toLowerCase().includes(editPlatformSearchQuery.toLowerCase()) ||
                                                            p.value.toLowerCase().includes(editPlatformSearchQuery.toLowerCase())
                                                        );
                                                        if (filteredPlatforms.length > 0) {
                                                            setEditPlatform(filteredPlatforms[0].value);
                                                            setShowPlatformDropdown(false);
                                                            setEditPlatformSearchQuery('');
                                                            if (filteredPlatforms[0].value !== 'other') {
                                                                setEditCustomPlatformName('');
                                                            }
                                                        }
                                                    }
                                                }}
                                                className="w-full pl-7 pr-3 py-1.5 bg-theme-secondary-transparent border border-theme-text-transparent/20 rounded text-theme-text placeholder-theme-text/50 focus:border-theme-primary focus:ring-1 focus:ring-theme-primary/20 transition-all duration-200 text-sm"
                                                autoComplete="off"
                                            />
                                            {editPlatformSearchQuery && (
                                                <button
                                                    type="button"
                                                    onClick={() => setEditPlatformSearchQuery('')}
                                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-0.5 hover:bg-theme-secondary-transparent rounded-full transition-colors"
                                                >
                                                    <X className="w-2.5 h-2.5 text-theme-text opacity-50" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Platform Options */}
                                    <div className="max-h-32 overflow-y-auto">
                                        {(() => {
                                            const filteredPlatforms = platforms.filter(p =>
                                                p.name.toLowerCase().includes(editPlatformSearchQuery.toLowerCase()) ||
                                                p.value.toLowerCase().includes(editPlatformSearchQuery.toLowerCase())
                                            );

                                            if (filteredPlatforms.length === 0) {
                                                return (
                                                    <div className="px-2.5 py-3 text-center text-theme-text opacity-50 text-xs">
                                                        No platforms found for "{editPlatformSearchQuery}"
                                                    </div>
                                                );
                                            }

                                            return filteredPlatforms.map((p) => (
                                                <button
                                                    key={p.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setEditPlatform(p.value);
                                                        setShowPlatformDropdown(false);
                                                        setEditPlatformSearchQuery('');
                                                        if (p.value !== 'other') {
                                                            setEditCustomPlatformName('');
                                                        }
                                                    }}
                                                    className="w-full px-2.5 py-1.5 text-left hover:bg-theme-primary hover:bg-opacity-10 flex items-center gap-1.5 text-sm transition-all duration-200 last:rounded-b-lg"
                                                >
                                                    <div className={`w-4 h-4 rounded ${p.color} flex items-center justify-center text-white`}>
                                                        <FontAwesomeIcon icon={p.icon} className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-theme-text">{p.name}</span>
                                                </button>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Username */}
                <div className="mb-3">
                    <label className="block text-xs text-theme-text-transparent mb-1">Username</label>
                    <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-theme-secondary rounded focus:ring-1 focus:ring-theme-primary focus:border-transparent bg-theme-background text-theme-text text-sm shadow-md hover:shadow-lg focus:shadow-lg transition-shadow duration-200"
                    />
                </div>

                {/* Password */}
                <div className="mb-3">
                    <label className="block text-xs text-theme-text-transparent mb-1">Password</label>
                    <div className="relative">
                        <input
                            type={showEditPassword ? "text" : "password"}
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            placeholder={!decryptedPassword || decryptedPassword === '[DECRYPTION_FAILED]' ? "Decrypting password..." : ""}
                            disabled={!decryptedPassword || decryptedPassword === '[DECRYPTION_FAILED]'}
                            className={`w-full px-2.5 py-1.5 pr-8 border border-theme-secondary rounded focus:ring-1 focus:ring-theme-primary focus:border-transparent bg-theme-background text-theme-text text-sm shadow-md hover:shadow-lg focus:shadow-lg transition-shadow duration-200 ${(!decryptedPassword || decryptedPassword === '[DECRYPTION_FAILED]') ? 'opacity-60' : ''}`}
                        />
                        <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                            {!decryptedPassword ? (
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-theme-primary border-t-transparent" title="Decrypting password..."></div>
                            ) : decryptedPassword === '[DECRYPTION_FAILED]' ? (
                                <span className="text-red-500" title="Decryption failed">⚠️</span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowEditPassword(!showEditPassword)}
                                    className="text-theme-text-transparent hover:text-theme-text"
                                    title={showEditPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Custom Platform Name Input for Edit Form */}
                {editPlatform === 'other' && (
                    <div className="mb-3">
                        <label className="block text-xs text-theme-text-transparent mb-1">Custom Platform Name</label>
                        <input
                            type="text"
                            value={editCustomPlatformName}
                            onChange={(e) => setEditCustomPlatformName(e.target.value)}
                            placeholder="Enter platform name (e.g., MyBank, School Portal)"
                            className="w-full px-2.5 py-1.5 border border-theme-secondary rounded focus:ring-1 focus:ring-theme-primary focus:border-transparent bg-theme-background text-theme-text text-sm shadow-md hover:shadow-lg focus:shadow-lg transition-shadow duration-200"
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-1.5">
                    <button
                        onClick={handleSave}
                        disabled={isLoading || !editUsername.trim() || !editPassword.trim() || !editPlatform || !decryptedPassword || decryptedPassword === '[DECRYPTION_FAILED]' || (editPlatform === 'other' && !editCustomPlatformName.trim())}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-theme-secondary text-theme-text py-1.5 px-2.5 rounded text-sm transition-colors shadow-md hover:shadow-lg"
                    >
                        {isLoading ? 'Saving...' : (!decryptedPassword ? 'Decrypting...' : 'Save')}
                    </button>
                    <button
                        onClick={onCancelEdit}
                        className="flex-1 bg-theme-accent hover:bg-theme-accent-transparent text-theme-text py-1.5 px-2.5 rounded text-sm transition-colors shadow-md hover:shadow-lg"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    // View mode - Optimized with better UX (Reduced size)
    return (
        <div className="bg-theme-accent rounded-lg shadow-lg hover:shadow-xl p-4 border border-theme-accent-transparent transition-shadow duration-300 group">
            {/* Card Header with Platform Icon - Enhanced */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-md ${platformInfo.color} flex items-center justify-center text-white text-sm shadow-md hover:shadow-lg transition-shadow duration-300`}>
                        <FontAwesomeIcon icon={platformInfo.icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-theme-text truncate text-base">
                            {platforms.find(p => p.value === entry.platform)?.name || entry.platform || 'Account'}
                        </h3>
                    </div>
                </div>
                <span className={`text-sm font-medium px-1.5 py-0.5 rounded ${getStrengthColor(entry.strength)} bg-opacity-20`}>
                    {getStrengthText(entry.strength)}
                </span>
            </div>

            {/* Card Content - Optimized Layout (Reduced size) */}
            <div className="space-y-0.5">
                <div className="border border-theme-accent-transparent bg-theme-secondary-transparent shadow-lg hover:shadow-xl p-2 rounded-t-md hover:bg-opacity-80 transition-all duration-200">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <p className="text-sm text-theme-text flex-1 truncate font-mono" title={entry.username}>{entry.username}</p>
                        </div>
                        <button
                            onClick={() => onCopy(entry.username, 'Username')}
                            className="text-theme-text-transparent hover:text-theme-text p-1.5 rounded hover:bg-theme-primary hover:bg-opacity-20 transition-all duration-200"
                            title="Copy username"
                        >
                            <Copy className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                <div className="border border-theme-accent-transparent bg-theme-secondary-transparent shadow-lg hover:shadow-xl p-2 rounded-b-md hover:bg-opacity-80 transition-all duration-200">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="text-sm text-theme-text flex-1 font-mono overflow-hidden">
                                {isVisible ? (
                                    isDecrypting ? (
                                        <span className="flex items-center gap-2">
                                            <div className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-theme-primary border-t-transparent"></div>
                                            <span className="text-theme-text-transparent">Decrypting...</span>
                                        </span>
                                    ) : decryptedPassword === '[DECRYPTION_FAILED]' ? (
                                        <span className="text-red-500 text-xs flex items-center gap-1">
                                            <span>⚠️</span>
                                            Failed to decrypt
                                        </span>
                                    ) : (
                                        <span className="break-all" title={decryptedPassword}>
                                            {decryptedPassword || '••••••••'}
                                        </span>
                                    )
                                ) : (
                                    <span className="text-theme-text-transparent">••••••••</span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={onToggleVisibility}
                                className="text-theme-text-transparent hover:text-theme-text p-1.5 rounded hover:bg-theme-primary hover:bg-opacity-20 transition-all duration-200"
                                title={isVisible ? 'Hide password' : 'Show password'}
                                disabled={isDecrypting}
                            >
                                {isDecrypting ? (
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-theme-text-transparent border-t-transparent"></div>
                                ) : isVisible ? (
                                    <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                    <Eye className="w-3.5 h-3.5" />
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    if (decryptedPassword && decryptedPassword !== '[DECRYPTION_FAILED]') {
                                        onCopy(decryptedPassword, 'Password');
                                    }
                                }}
                                className="text-theme-text-transparent hover:text-theme-text p-1.5 rounded hover:bg-green-500 hover:bg-opacity-20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Copy password"
                                disabled={!isVisible || isDecrypting || decryptedPassword === '[DECRYPTION_FAILED]'}
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                            {decryptedPassword === '[DECRYPTION_FAILED]' && onRetryDecryption && (
                                <button
                                    onClick={() => onRetryDecryption(entry.entry_id)}
                                    className="text-theme-primary hover:text-theme-primary-transparent p-1.5 rounded hover:bg-theme-primary hover:bg-opacity-20 transition-all duration-200"
                                    title="Retry decryption"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Card Actions - Enhanced (Reduced size) */}
            <div className="flex justify-between gap-2 mt-4 pt-2 border-t border-theme-secondary">
                <button
                    onClick={onEdit}
                    className="flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 font-semibold text-theme-text px-6 pb-1.5 pt-2 rounded-md text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                >
                    Edit
                </button>
                <button
                    onClick={onDelete}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 font-semibold text-white px-6 pb-1.5 pt-2 rounded-md text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
    );
});

const Vault = () => {
    const { user, isLoading: userLoading, refreshUser } = useUser();
    const [searchParams, setSearchParams] = useSearchParams();
    const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [platform, setPlatform] = useState('');
    const [editId, setEditId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showZKPPopup, setShowZKPPopup] = useState(false);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [masterPasswordHash, setMasterPasswordHash] = useState<string | null>(null);
    const [showMasterPasswordPrompt, setShowMasterPasswordPrompt] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
    const [showAddForm, setShowAddForm] = useState(false);
    const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [platformSearchQuery, setPlatformSearchQuery] = useState('');
    const [showPasswordInForm, setShowPasswordInForm] = useState(false);
    const [customPlatformName, setCustomPlatformName] = useState('');
    const [decryptedPasswords, setDecryptedPasswords] = useState<Map<string, string>>(new Map());
    const [decryptingPasswords, setDecryptingPasswords] = useState<Set<string>>(new Set());
    const [clickingButtons, setClickingButtons] = useState<Set<string>>(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    // Filter states
    const [activeFilter, setActiveFilter] = useState<'all' | 'weak' | 'old'>('all');

    // Refs to access current state values in callbacks without causing re-renders
    const decryptedPasswordsRef = useRef(decryptedPasswords);
    const decryptingPasswordsRef = useRef(decryptingPasswords);
    const clickingButtonsRef = useRef(clickingButtons);

    // Keep refs updated efficiently
    useEffect(() => {
        decryptedPasswordsRef.current = decryptedPasswords;
    }, [decryptedPasswords]);

    useEffect(() => {
        decryptingPasswordsRef.current = decryptingPasswords;
    }, [decryptingPasswords]);

    useEffect(() => {
        clickingButtonsRef.current = clickingButtons;
    }, [clickingButtons]);

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
                icon: faEllipsis,
                color: 'bg-gray-600'
            };
        }

        // Last resort - use generic platform
        return {
            value: 'generic',
            name: 'Account',
            icon: faEllipsis,
            color: 'bg-gray-600'
        };
    }, []);

    const getStrengthColor = useCallback((strength?: number) => {
        if (!strength || strength <= 1) return 'text-red-500';
        if (strength === 2) return 'text-orange-500';
        if (strength === 3) return 'text-yellow-500';
        return 'text-green-500';
    }, []);

    // Convert strength number to descriptive word
    const getStrengthText = useCallback((strength?: number) => {
        if (!strength || strength <= 1) return 'Weak';
        if (strength === 2) return 'Fair';
        if (strength === 3) return 'Good';
        if (strength === 4) return 'Strong';
        return 'Weak'; // fallback
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

    // Helper functions for password categorization
    const isWeakPassword = useCallback((entry: PasswordEntry) => {
        return !entry.strength || entry.strength <= 1;
    }, []);

    const isOldPassword = useCallback((entry: PasswordEntry) => {
        if (!entry.lastUpdate) return false;

        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);

        const lastUpdateDate = new Date(entry.lastUpdate);
        return !isNaN(lastUpdateDate.getTime()) && lastUpdateDate < sixMonthsAgo;
    }, []);

    // Get password counts by category
    const passwordCounts = useMemo(() => {
        const weak = passwords.filter(isWeakPassword).length;
        const old = passwords.filter(isOldPassword).length;
        return {
            all: passwords.length,
            weak,
            old
        };
    }, [passwords, isWeakPassword, isOldPassword]);

    // Decrypt individual password on demand
    const decryptPassword = useCallback(async (entryId: string, retryCount = 0) => {
        if (!user?.userId || !masterPasswordHash) {
            console.error("Cannot decrypt: missing user ID or master password hash");
            return;
        }

        // Check if already decrypted using ref
        if (decryptedPasswordsRef.current.has(entryId)) {
            return;
        }

        // Check if currently decrypting (but allow retries) using ref
        if (decryptingPasswordsRef.current.has(entryId) && retryCount === 0) {
            return;
        }

        try {
            setDecryptingPasswords(prev => new Set([...prev, entryId]));

            console.log(`Attempting to decrypt password for entry ${entryId} (attempt ${retryCount + 1})`);

            const decryptedPassword = await invoke<string>('decrypt_single_password', {
                ui: user.userId,
                entryId: entryId,
                masterPassword: masterPasswordHash
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
                hasMasterPasswordHash: !!masterPasswordHash
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
    }, [user?.userId, masterPasswordHash]);

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

    // Toggle password visibility and decrypt on demand - optimized version
    const togglePasswordVisibility = useCallback(async (entryId: string) => {
        console.log(`Toggle visibility for entry: ${entryId}, current visible count: ${visiblePasswords.size}`);

        // Prevent rapid clicking with debounce using ref for better performance
        if (clickingButtonsRef.current.has(entryId)) {
            console.log(`Ignoring rapid click for entry: ${entryId}`);
            return;
        }

        // Set debounce flag
        setClickingButtons(prev => new Set([...prev, entryId]));

        // Remove debounce flag after 300ms (reduced from 500ms for better UX)
        setTimeout(() => {
            setClickingButtons(prev => {
                const newSet = new Set(prev);
                newSet.delete(entryId);
                return newSet;
            });
        }, 300);

        // Prevent clicking during decryption using ref
        if (decryptingPasswordsRef.current.has(entryId)) {
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

                // Check if password needs decryption using ref
                if (!decryptedPasswordsRef.current.has(entryId)) {
                    console.log(`Need to decrypt entry: ${entryId}`);
                    // Call decryptPassword directly
                    if (user?.userId && masterPasswordHash) {
                        decryptPassword(entryId, 0).catch(err => {
                            console.error(`Failed to decrypt ${entryId}:`, err);
                        });
                    }
                }
                newVisible.add(entryId);
            }

            return newVisible;
        });
    }, [user?.userId, masterPasswordHash, decryptPassword]);

    useEffect(() => {
        if (!user) {
            setShowZKPPopup(false);
            setMasterPasswordHash(null);
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
            if (!masterPasswordHash) {
                setShowMasterPasswordPrompt(true);
            }
        }
    }, [user, user?.masterPassword?.isSet, masterPasswordHash]);

    // Fetch passwords from the backend (without decryption for performance)
    const fetchPasswords = useCallback(async () => {
        // Don't fetch if user data is not available, still loading, or no master password hash
        if (!user?.userId || userLoading || !masterPasswordHash) {
            console.log("Cannot fetch passwords yet", {
                hasUserId: !!user?.userId,
                userLoading,
                hasMasterPasswordHash: !!masterPasswordHash
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
            const mappedEntries: PasswordEntry[] = entries.map(entry => {
                // Parse lastUpdate timestamp from MongoDB format
                let lastUpdate: number | undefined;
                if (entry.lup) {
                    if (entry.lup.$date && entry.lup.$date.$numberLong) {
                        lastUpdate = parseInt(entry.lup.$date.$numberLong);
                    } else if (typeof entry.lup === 'string' || typeof entry.lup === 'number') {
                        lastUpdate = typeof entry.lup === 'string' ? parseInt(entry.lup) : entry.lup;
                    }
                }

                return {
                    entry_id: entry.aid,
                    username: entry.aun,
                    password: entry.ap, // This is still encrypted
                    strength: entry.aps,
                    platform: entry.plt, // Map platform field
                    lastUpdate, // Include timestamp for age calculation
                };
            });

            console.log("Mapped encrypted entries:", mappedEntries);
            setPasswords(mappedEntries);
            setInitialLoadDone(true);
        } catch (error) {
            setError("Error fetching passwords. Please try again.");
            console.error("Error fetching passwords:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.userId, userLoading, masterPasswordHash]);

    // Handle URL parameters for filter initialization
    useEffect(() => {
        const urlFilter = searchParams.get('filter');
        if (urlFilter && ['weak', 'old', 'all'].includes(urlFilter)) {
            setActiveFilter(urlFilter as 'all' | 'weak' | 'old');
            // Clear the URL parameter after setting the filter
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('filter');
            setSearchParams(newParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        // Reset state when user changes
        if (!user?.userId) {
            setPasswords([]);
            setError(null);
            setInitialLoadDone(false);
            setMasterPasswordHash(null);
            setDecryptedPasswords(new Map());
            setDecryptingPasswords(new Set());
            setVisiblePasswords(new Set());
            return;
        }

        // Only fetch passwords if user data is available, not currently loading, and we have master password hash
        if (user?.userId && !userLoading && masterPasswordHash && !initialLoadDone) {
            console.log("User data and master password hash available, fetching passwords");
            fetchPasswords();
        }
    }, [user?.userId, userLoading, masterPasswordHash, fetchPasswords, initialLoadDone]);

    const handleAddPassword = useCallback(async () => {
        if (!user?.userId || !masterPasswordHash) {
            setError("User data or master password hash not available. Please try again.");
            return;
        }

        const platformInfo = getPlatformInfo(platform);
        if (!username.trim() || !password.trim()) {
            setError("Please fill in all fields");
            return;
        }

        // Validate custom platform name when 'other' is selected
        if (platform === 'other' && !customPlatformName.trim()) {
            setError("Please enter a custom platform name");
            return;
        }

        // Determine final platform name
        const finalPlatform = platform === 'other' && customPlatformName.trim()
            ? customPlatformName.trim()
            : platform;

        // Check for duplicate entries when adding new password (not updating)
        if (!editId) {
            const isDuplicate = passwords.some(entry =>
                entry.platform === finalPlatform &&
                entry.username.toLowerCase().trim() === username.toLowerCase().trim()
            );

            const platformDisplayName = platform === 'other' && customPlatformName.trim()
                ? customPlatformName.trim()
                : platformInfo.name;

            if (isDuplicate) {
                setError(`Duplicate entry detected: An account for ${platformDisplayName} with username "${username.trim()}" already exists`);
                return;
            }
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
                    platform: finalPlatform, // Pass the final platform value
                    masterPassword: masterPasswordHash, // Pass hashed master password for encryption
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
                    platform: finalPlatform, // Pass the final platform value
                    masterPassword: masterPasswordHash, // Pass hashed master password for encryption
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
            setCustomPlatformName('');
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
    }, [username, password, platform, editId, user?.userId, masterPasswordHash, fetchPasswords, getPlatformInfo]);

    const handleEditPassword = async (entryId: string) => {
        const entry = passwords.find(entry => entry.entry_id === entryId);
        if (!entry) return;

        // Check if password is already decrypted
        if (decryptedPasswordsRef.current.has(entryId) &&
            decryptedPasswordsRef.current.get(entryId) !== '[DECRYPTION_FAILED]') {
            // Password already decrypted and valid, enter edit mode immediately
            console.log(`Password already decrypted for entry: ${entryId}, entering edit mode`);
            setEditId(entryId);
            return;
        }

        // Need to decrypt password before editing
        if (!user?.userId || !masterPasswordHash) {
            setError("Cannot edit password: missing user data or master password hash.");
            return;
        }

        console.log(`Decrypting password for editing entry: ${entryId}`);

        try {
            // Start the decryption process
            await decryptPassword(entryId, 0);

            // Wait a moment for decryption to complete, then check result
            setTimeout(() => {
                const decryptedPass = decryptedPasswordsRef.current.get(entryId);
                if (decryptedPass && decryptedPass !== '[DECRYPTION_FAILED]') {
                    console.log(`Password decrypted successfully for entry: ${entryId}, entering edit mode`);
                    setEditId(entryId);
                } else {
                    console.error(`Failed to decrypt password for entry: ${entryId}`);
                    setError("Failed to decrypt password for editing. Please try again.");
                }
            }, 200); // Small delay to allow decryption to complete

        } catch (error) {
            console.error(`Error during password decryption for editing ${entryId}:`, error);
            setError("Failed to decrypt password for editing. Please try again.");
        }
    };

    const handleSaveEdit = async (entryId: string, newUsername: string, newPassword: string, newPlatform: string) => {
        if (!user?.userId || !masterPasswordHash) {
            setError("User data or master password hash not available. Please try again.");
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
                masterPassword: masterPasswordHash,
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
    // Optimized filtering with memoized search, debouncing, and category filtering
    const filteredPasswords = useMemo(() => {
        // First apply category filter
        let categoryFilteredPasswords = passwords;

        switch (activeFilter) {
            case 'weak':
                categoryFilteredPasswords = passwords.filter(isWeakPassword);
                break;
            case 'old':
                categoryFilteredPasswords = passwords.filter(isOldPassword);
                break;
            case 'all':
            default:
                categoryFilteredPasswords = passwords;
                break;
        }

        // Then apply search filter if search query exists
        if (!searchQuery.trim()) {
            return categoryFilteredPasswords;
        }

        const query = searchQuery.toLowerCase();

        // Early return for very short queries to improve performance
        if (query.length < 2) {
            return categoryFilteredPasswords.filter(entry => {
                const usernameText = entry.username?.toLowerCase() ?? '';
                const platformInfo = getPlatformInfo(entry.platform, entry.username);
                const platformName = platformInfo.name.toLowerCase();
                return usernameText.startsWith(query) || platformName.startsWith(query);
            });
        }

        const matchingPasswords = categoryFilteredPasswords.filter(entry => {
            const platformInfo = getPlatformInfo(entry.platform, entry.username);
            const usernameText = entry.username?.toLowerCase() ?? '';
            const platformName = platformInfo.name.toLowerCase();

            return usernameText.includes(query) || platformName.includes(query);
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
                if (usernameMatch === query) score += 100;
                if (platformMatch === query) score += 90;

                // Starts with query gets high priority
                if (usernameMatch.startsWith(query)) score += 50;
                if (platformMatch.startsWith(query)) score += 40;

                // Contains query gets lower priority
                if (usernameMatch.includes(query)) score += 10;
                if (platformMatch.includes(query)) score += 5;

                return score;
            };

            const scoreA = getRelevanceScore(a, platformInfoA);
            const scoreB = getRelevanceScore(b, platformInfoB);

            // Sort by relevance score (descending)
            if (scoreB !== scoreA) {
                return scoreB - scoreA;
            }

            // If same relevance, sort alphabetically by username
            return a.username.localeCompare(b.username);
        });
    }, [passwords, searchQuery, activeFilter, getPlatformInfo, isWeakPassword, isOldPassword]);

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
            setShowDeleteConfirm(null); // Close the modal
            fetchPasswords(); // Update storage in background
        } catch (error) {
            setError("Error deleting password. Please try again.");
            console.error("Error deleting password:", error);
            setShowDeleteConfirm(null); // Close the modal even on error
        } finally {
            setIsLoading(false);
        }
    }, [user?.userId, fetchPasswords]);

    // Handle delete confirmation
    const handleDeleteClick = (entryId: string) => {
        setShowDeleteConfirm(entryId);
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(null);
    };

    const handleMasterPasswordProvided = useCallback(async () => {
        try {
            // Use the master password hash that's already available in user data
            const masterPasswordHash = user?.masterPassword?.hash;

            if (!masterPasswordHash) {
                setError('Master password hash not available in user data. Please try again.');
                return;
            }

            // Store the master password hash for backend calls
            setMasterPasswordHash(masterPasswordHash);
            setShowMasterPasswordPrompt(false);
            setError(null);

            console.log('Master password verified and ready for encryption operations');
        } catch (error) {
            console.error('Failed to use master password hash:', error);
            setError('Failed to verify master password. Please try again.');
        }
    }, [user?.masterPassword?.hash]);

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
                        onDelete={() => handleDeleteClick(entry.entry_id)}
                        getStrengthColor={getStrengthColor}
                        getStrengthText={getStrengthText}
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
                {/* Header with Enhanced Search Bar */}
                <div className="flex items-center justify-between mb-8">
                    {!userLoading && user && masterPasswordHash ? (
                        <div className="flex items-center gap-6 flex-1">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-theme-primary to-theme-primary-transparent rounded-xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow duration-300">
                                    <Lock className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-theme-text">Password Vault</h1>
                                    <p className="text-sm text-theme-text-transparent">{passwords.length} passwords stored</p>
                                </div>
                            </div>
                            <div className="relative flex-1 max-w-lg">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-theme-text-transparent" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by service, username, or platform..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full pl-12 pr-12 py-3 border-2 border-theme-secondary rounded-xl focus:ring-2 focus:ring-theme-primary focus:border-theme-primary bg-theme-background text-theme-text placeholder-theme-text-transparent hover:border-theme-primary hover:bg-theme-primary-transparent focus:bg-theme-primary-transparent transition-all duration-200 shadow-lg hover:shadow-xl focus:shadow-xl"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                        title="Clear search"
                                    >
                                        <X className="h-5 w-5 text-theme-text-transparent hover:text-theme-text transition-colors duration-200" />
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
                            setCustomPlatformName('');
                        }}
                        disabled={!user?.userId || !masterPasswordHash}
                        className="flex items-center gap-2 bg-theme-primary hover:bg-theme-primary-transparent disabled:bg-theme-secondary text-theme-text px-4 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg"
                    >
                        <Plus className="w-4 h-4" />
                        Add Password
                    </button>
                </div>

                {/* Decryption Status (for large password counts) */}
                {!userLoading && user && masterPasswordHash && passwords.length > 50 && (
                    <div className="mb-6 p-4 bg-theme-accent rounded-lg border border-theme-secondary shadow-lg hover:shadow-xl transition-shadow duration-300">
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

                {/* Filter Tabs */}
                {!userLoading && user && masterPasswordHash && passwords.length > 0 && (
                    <div className="mb-6">
                        <div className="flex flex-wrap gap-2 p-1 bg-theme-secondary rounded-xl border border-theme-secondary shadow-lg">
                            {[
                                { key: 'all', label: 'All Passwords', count: passwordCounts.all, IconComponent: Shield },
                                { key: 'weak', label: 'Weak Passwords', count: passwordCounts.weak, IconComponent: AlertTriangle },
                                { key: 'old', label: 'Old Passwords', count: passwordCounts.old, IconComponent: Clock }
                            ].map(({ key, label, count, IconComponent }) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveFilter(key as 'all' | 'weak' | 'old')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${activeFilter === key
                                            ? 'bg-theme-primary text-white shadow-md transform scale-[1.02]'
                                            : 'text-theme-text hover:bg-theme-primary-transparent hover:text-theme-text'
                                        } ${key === 'weak' && count > 0 ? 'ring-2 ring-red-400 ring-opacity-30' : ''
                                        } ${key === 'old' && count > 0 ? 'ring-2 ring-orange-400 ring-opacity-30' : ''
                                        }`}
                                >
                                    <IconComponent className="w-4 h-4" />
                                    <span>{label}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeFilter === key
                                            ? 'bg-white bg-opacity-20 text-white'
                                            : key === 'weak' && count > 0
                                                ? 'bg-red-100 text-red-800'
                                                : key === 'old' && count > 0
                                                    ? 'bg-orange-100 text-orange-800'
                                                    : 'bg-theme-accent text-theme-text'
                                        }`}>
                                        {count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Filter Status */}
                        {activeFilter !== 'all' && (
                            <div className={`mt-3 p-3 rounded-lg border ${activeFilter === 'weak'
                                    ? 'bg-red-50 border-red-200 text-red-700'
                                    : 'bg-orange-50 border-orange-200 text-orange-700'
                                }`}>
                                <div className="flex items-center gap-2 text-sm">
                                    {activeFilter === 'weak' ? (
                                        <AlertTriangle className="w-4 h-4" />
                                    ) : (
                                        <Clock className="w-4 h-4" />
                                    )}
                                    <span>
                                        {activeFilter === 'weak'
                                            ? `Showing ${passwordCounts.weak} weak password${passwordCounts.weak !== 1 ? 's' : ''} that need attention`
                                            : `Showing ${passwordCounts.old} password${passwordCounts.old !== 1 ? 's' : ''} older than 6 months`
                                        }
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Search Results Info */}
                {!userLoading && user && masterPasswordHash && searchQuery && (
                    <div className="mb-6">
                        <p className="text-md text-theme-text-transparent">
                            Found {filteredPasswords.length} of {passwords.length} passwords
                            {activeFilter !== 'all' && ` (filtered by ${activeFilter})`}
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
                {!userLoading && user && user.masterPassword?.isSet && !masterPasswordHash && (
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
                        Please enter your master PIN to access your passwords.
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className={`border px-4 py-3 rounded mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300 ${error.includes('Password limit reached')
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

                {/* Add Password Form - Enhanced UI (Reduced size) */}
                {showAddForm && user && masterPasswordHash && (
                    <div className="bg-gradient-to-br from-theme-accent to-theme-accent-transparent rounded-lg shadow-xl hover:shadow-2xl p-4 mb-4 border border-theme-primary border-opacity-20 backdrop-blur-sm transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-theme-text flex items-center gap-2">
                                <div className="w-6 h-6 bg-theme-primary rounded-md flex items-center justify-center">
                                    {editId ? <Edit2 className="w-3.5 h-3.5 text-white" /> : <Plus className="w-3.5 h-3.5 text-white" />}
                                </div>
                                {editId ? 'Edit Password' : 'Add New Password'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setEditId(null);
                                    setUsername('');
                                    setPassword('');
                                    setPlatform('google');
                                    setCustomPlatformName('');
                                }}
                                className="text-theme-text-transparent hover:text-theme-text p-1.5 rounded hover:bg-theme-secondary transition-all duration-200"
                                title="Close form"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Platform Selection - Enhanced (Reduced size) */}
                            <div className="relative">
                                <label className="text-sm font-semibold text-theme-text mb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-theme-primary rounded-full"></span>
                                    Platform
                                </label>
                                <div className="relative">
                                    {/* Platform Selection Button/Input */}
                                    {platform ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPlatformDropdown(!showPlatformDropdown);
                                                setPlatformSearchQuery('');
                                            }}
                                            className="w-full px-3 py-2 border border-theme-secondary rounded-lg focus:ring-1 focus:ring-theme-primary focus:border-theme-primary bg-theme-background text-theme-text flex items-center justify-between hover:border-theme-primary transition-all duration-200 shadow-md hover:shadow-lg"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded-md ${getPlatformInfo(platform).color} flex items-center justify-center text-white text-sm shadow-sm`}>
                                                    <FontAwesomeIcon icon={getPlatformInfo(platform).icon} className="w-4 h-4" />
                                                </div>
                                                <span className="font-medium text-sm">{getPlatformInfo(platform).name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPlatform('');
                                                        setPlatformSearchQuery('');
                                                        setCustomPlatformName('');
                                                    }}
                                                    className="p-1 hover:bg-theme-secondary-transparent rounded-full transition-colors"
                                                    title="Clear selection"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showPlatformDropdown ? 'rotate-180' : ''}`} />
                                            </div>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPlatformDropdown(true);
                                                // Auto-focus the search input
                                                setTimeout(() => {
                                                    const searchInput = document.getElementById('platform-search-input');
                                                    searchInput?.focus();
                                                }, 100);
                                            }}
                                            className="w-full px-3 py-2 border border-theme-secondary rounded-lg focus:ring-1 focus:ring-theme-primary focus:border-theme-primary bg-theme-background text-theme-text flex items-center justify-between hover:border-theme-primary transition-all duration-200 shadow-md hover:shadow-lg"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Search className="w-4 h-4 text-theme-text opacity-50" />
                                                <span className="text-theme-text opacity-75 text-sm">Search and select platform...</span>
                                            </div>
                                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showPlatformDropdown ? 'rotate-180' : ''}`} />
                                        </button>
                                    )}

                                    {/* Dropdown with Search */}
                                    {showPlatformDropdown && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => {
                                                    setShowPlatformDropdown(false);
                                                    setPlatformSearchQuery('');
                                                }}
                                            />
                                            <div className="absolute z-20 w-full mt-1 bg-theme-background border border-theme-secondary rounded-lg shadow-xl max-h-64 backdrop-blur-sm">
                                                {/* Search Input */}
                                                <div className="sticky top-0 bg-theme-background border-b border-theme-secondary p-2 rounded-t-lg">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-text opacity-50" />
                                                        <input
                                                            id="platform-search-input"
                                                            type="text"
                                                            placeholder="Search platforms..."
                                                            value={platformSearchQuery}
                                                            onChange={(e) => setPlatformSearchQuery(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Escape') {
                                                                    setShowPlatformDropdown(false);
                                                                    setPlatformSearchQuery('');
                                                                } else if (e.key === 'Enter') {
                                                                    const filteredPlatforms = PLATFORMS.filter(p =>
                                                                        p.name.toLowerCase().includes(platformSearchQuery.toLowerCase()) ||
                                                                        p.value.toLowerCase().includes(platformSearchQuery.toLowerCase())
                                                                    );
                                                                    if (filteredPlatforms.length > 0) {
                                                                        setPlatform(filteredPlatforms[0].value);
                                                                        setShowPlatformDropdown(false);
                                                                        setPlatformSearchQuery('');
                                                                        if (filteredPlatforms[0].value !== 'other') {
                                                                            setCustomPlatformName('');
                                                                        }
                                                                    }
                                                                }
                                                            }}
                                                            className="w-full pl-10 pr-4 py-2 bg-theme-secondary-transparent border border-theme-text-transparent/20 rounded-lg text-theme-text placeholder-theme-text/50 focus:border-theme-primary focus:ring-1 focus:ring-theme-primary/20 transition-all duration-200"
                                                            autoComplete="off"
                                                        />
                                                        {platformSearchQuery && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setPlatformSearchQuery('')}
                                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-theme-secondary-transparent rounded-full transition-colors"
                                                            >
                                                                <X className="w-3 h-3 text-theme-text opacity-50" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Platform Options */}
                                                <div className="max-h-40 overflow-y-auto">
                                                    {(() => {
                                                        const filteredPlatforms = PLATFORMS.filter(p =>
                                                            p.name.toLowerCase().includes(platformSearchQuery.toLowerCase()) ||
                                                            p.value.toLowerCase().includes(platformSearchQuery.toLowerCase())
                                                        );

                                                        if (filteredPlatforms.length === 0) {
                                                            return (
                                                                <div className="px-3 py-4 text-center text-theme-text opacity-50 text-sm">
                                                                    No platforms found for "{platformSearchQuery}"
                                                                </div>
                                                            );
                                                        }

                                                        return filteredPlatforms.map((p) => (
                                                            <button
                                                                key={p.value}
                                                                type="button"
                                                                onClick={() => {
                                                                    setPlatform(p.value);
                                                                    setShowPlatformDropdown(false);
                                                                    setPlatformSearchQuery('');
                                                                    if (p.value !== 'other') {
                                                                        setCustomPlatformName('');
                                                                    }
                                                                }}
                                                                className="w-full px-3 py-2 text-left hover:bg-theme-primary hover:bg-opacity-10 flex items-center gap-2 transition-all duration-200 last:rounded-b-lg"
                                                            >
                                                                <div className={`w-6 h-6 rounded-md ${p.color} flex items-center justify-center text-white text-sm shadow-md`}>
                                                                    <FontAwesomeIcon icon={p.icon} className="w-4 h-4" />
                                                                </div>
                                                                <span className="text-theme-text font-medium text-sm">{p.name}</span>
                                                            </button>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Custom Platform Name Input for Main Form */}
                            {platform === 'other' && (
                                <div>
                                    <label className="text-sm font-semibold text-theme-text mb-2 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                        Custom Platform Name
                                    </label>
                                    <input
                                        type="text"
                                        value={customPlatformName}
                                        onChange={(e) => setCustomPlatformName(e.target.value)}
                                        placeholder="Enter platform name (e.g., MyBank, School Portal)"
                                        className="w-full px-3 py-2 border border-theme-secondary rounded-lg focus:ring-1 focus:ring-theme-primary focus:border-theme-primary bg-theme-background text-theme-text hover:border-theme-primary transition-all duration-200 shadow-md hover:shadow-lg focus:shadow-lg"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Username - Enhanced (Reduced size) */}
                                <div>
                                    <label className="text-sm font-semibold text-theme-text mb-2 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                        Username/Email
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Enter username or email"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full px-3 py-2 border border-theme-secondary rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-theme-background text-theme-text hover:border-blue-400 transition-all duration-200 shadow-md hover:shadow-lg focus:shadow-lg text-sm"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                                            <User className="w-4 h-4 text-theme-text-transparent" />
                                        </div>
                                    </div>
                                </div>

                                {/* Password - Enhanced (Reduced size) */}
                                <div>
                                    <label className="text-sm font-semibold text-theme-text mb-2 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswordInForm ? "text" : "password"}
                                            placeholder="Enter password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-3 py-2 pr-10 border border-theme-secondary rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-theme-background text-theme-text hover:border-green-400 transition-all duration-200 shadow-md hover:shadow-lg focus:shadow-lg text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswordInForm(!showPasswordInForm)}
                                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-theme-text-transparent hover:text-theme-text transition-colors duration-200"
                                            title={showPasswordInForm ? 'Hide password' : 'Show password'}
                                        >
                                            {showPasswordInForm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions - Enhanced (Reduced size) */}
                            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-theme-secondary">
                                <button
                                    onClick={handleAddPassword}
                                    disabled={isLoading || !username.trim() || !password.trim() || !platform || (platform === 'other' && !customPlatformName.trim())}
                                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-theme-secondary disabled:to-theme-secondary text-white px-4 py-2 rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-sm"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            {editId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                            {editId ? 'Update Password' : 'Add Password'}
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setEditId(null);
                                        setUsername('');
                                        setPassword('');
                                        setPlatform('');
                                        setPlatformSearchQuery('');
                                        setCustomPlatformName('');
                                    }}
                                    className="bg-theme-secondary hover:bg-theme-secondary-transparent text-theme-text px-4 py-2 rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-1.5 text-sm"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && user && masterPasswordHash && (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
                        <p className="mt-2 text-theme-text-transparent">Loading passwords...</p>
                    </div>
                )}

                {/* Password Cards */}
                {!userLoading && user && masterPasswordHash && !isLoading && (
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

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-theme-background rounded-2xl shadow-2xl hover:shadow-3xl max-w-md w-full p-6 border border-theme-secondary transition-shadow duration-300">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                    <Trash2 className="text-orange-500" size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-theme-text">Move to Trash</h2>
                            </div>
                            <button
                                onClick={handleCancelDelete}
                                className="w-8 h-8 rounded-full bg-theme-secondary hover:bg-theme-accent transition-colors duration-200 flex items-center justify-center"
                            >
                                <CloseIcon className="text-theme-text" style={{ fontSize: '1rem' }} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="mb-6 space-y-3">
                            <p className="text-theme-text opacity-90">
                                Are you sure you want to move this password entry to trash?
                            </p>
                            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                <div className="flex items-center gap-2 text-orange-500">
                                    <WarningIcon style={{ fontSize: '1rem' }} />
                                    <span className="font-medium text-sm">Note</span>
                                </div>
                                <p className="text-orange-500 text-sm mt-1">
                                    The password will be moved to trash and can be restored within 30 days before permanent deletion.
                                </p>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelDelete}
                                className="flex-1 bg-theme-secondary hover:bg-theme-accent text-theme-text font-medium py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeletePassword(showDeleteConfirm)}
                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                            >
                                <Trash2 size={16} />
                                Move to Trash
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Vault;