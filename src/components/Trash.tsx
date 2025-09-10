import React, { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useUser } from "../contexts/UserContext";
import {
    Delete as DeleteIcon,
    Restore as RestoreIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Lock as LockIcon,
    Schedule as ScheduleIcon,
    DeleteForever as DeleteForeverIcon,
    Close as CloseIcon,
    Search as SearchIcon
} from "@mui/icons-material";

interface DeletedPasswordEntry {
    deleted_at: string;
}

interface PasswordEntry {
    entry_id: string;
    account_name: string;
    username: string;
    deletion_info: DeletedPasswordEntry | null; //! Deletion metadata
}

const Trash: React.FC = () => {
    const { user, isLoading: userLoading } = useUser();
    const [deletedPasswords, setDeletedPasswords] = useState<PasswordEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    //* Fetch deleted passwords function
    const fetchDeletedPasswords = async () => {
        // Don't fetch if user data is not available or still loading
        if (!user?.userId || userLoading) {
            console.log("User data not available yet, skipping trash fetch", {
                hasUserId: !!user?.userId,
                userLoading
            });
            return;
        }

        try {
            console.log("Fetching deleted passwords for user:", user.userId);
            setLoading(true);
            setError(null);

            //! Clean old trash before fetching
            await invoke("clean_old_trash");

            const response = await invoke<any[]>("trash", { ui: user.userId });
            console.log("Fetched deleted passwords:", response); //! Debugging log

            const mappedPasswords: PasswordEntry[] = response.map((entry) => {
                let deletedAt: string | null = null;

                if (entry.d?.d_at?.$date?.$numberLong) {
                    const timestamp = parseInt(entry.d.d_at.$date.$numberLong, 10);
                    if (!isNaN(timestamp) && timestamp > 0 && timestamp < Number.MAX_SAFE_INTEGER) {
                        deletedAt = new Date(timestamp).toISOString();
                    }
                }

                return {
                    entry_id: entry.aid,
                    account_name: entry.plt,
                    username: entry.aun,
                    deletion_info: deletedAt ? { deleted_at: deletedAt } : null,
                };
            });

            setDeletedPasswords(mappedPasswords);
            setInitialLoadDone(true);
        } catch (err) {
            setError("Failed to fetch deleted passwords.");
            console.error("Error fetching deleted passwords:", err);
        } finally {
            setLoading(false);
        }
    };

    //* Restore password function
    const restorePassword = async (entryId: string) => {
        if (!user?.userId) {
            throw new Error("Failed to get user data or user ID is missing.");
        }
        try {
            await invoke("restore_password", { userId: user.userId, entryId: entryId });
            setDeletedPasswords((prev) =>
                prev.filter((password) => password.entry_id !== entryId)
            );
            // You could add a success toast notification here
            console.log("Password restored successfully");
        } catch (err) {
            // Better error handling - could be replaced with toast notification
            console.error("Error restoring password:", err);
            alert("Failed to restore the password. Please try again.");
        }
    };

    // Permanently delete password function
    const deletePasswordEntry = async (entryId: string) => {
        try {
            await invoke("delete_password_entry", { entryId: entryId });
            setDeletedPasswords((prev) =>
                prev.filter((password) => password.entry_id !== entryId)
            );
            setShowDeleteConfirm(null); // Close the modal
            // You could add a success toast notification here
            console.log("Password permanently deleted");
        } catch (err) {
            console.error("Error deleting password:", err);
            alert("Failed to permanently delete the password. Please try again.");
            setShowDeleteConfirm(null); // Close the modal even on error
        }
    };

    // Handle delete confirmation
    const handleDeleteClick = (entryId: string) => {
        setShowDeleteConfirm(entryId);
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(null);
    };

    // Filter passwords based on search query
    const filteredDeletedPasswords = useMemo(() => {
        if (!searchQuery.trim()) {
            return deletedPasswords;
        }

        const query = searchQuery.toLowerCase();

        // Early return for very short queries to improve performance
        if (query.length < 2) {
            return deletedPasswords.filter(entry => {
                const accountName = entry.account_name?.toLowerCase() ?? '';
                const username = entry.username?.toLowerCase() ?? '';
                return accountName.startsWith(query) || username.startsWith(query);
            });
        }

        const matchingPasswords = deletedPasswords.filter(entry => {
            const accountName = entry.account_name?.toLowerCase() ?? '';
            const username = entry.username?.toLowerCase() ?? '';

            return accountName.includes(query) || username.includes(query);
        });

        // Sort by relevance - exact matches first, then partial matches
        return matchingPasswords.sort((a, b) => {
            const getRelevanceScore = (entry: PasswordEntry) => {
                const accountName = entry.account_name?.toLowerCase() ?? '';
                const username = entry.username?.toLowerCase() ?? '';
                let score = 0;

                // Exact matches get highest score
                if (accountName === query || username === query) score += 10;
                // Start matches get medium score
                else if (accountName.startsWith(query) || username.startsWith(query)) score += 5;
                // Contains matches get lowest score
                else if (accountName.includes(query) || username.includes(query)) score += 1;

                return score;
            };

            const scoreA = getRelevanceScore(a);
            const scoreB = getRelevanceScore(b);

            // Sort by relevance score (descending)
            if (scoreB !== scoreA) {
                return scoreB - scoreA;
            }

            // If same relevance, sort alphabetically by account name
            return (a.account_name || '').localeCompare(b.account_name || '');
        });
    }, [deletedPasswords, searchQuery]);

    // Clear search
    const clearSearch = () => {
        setSearchQuery('');
    };

    useEffect(() => {
        // Reset state when user changes
        if (!user?.userId) {
            setDeletedPasswords([]);
            setError(null);
            setInitialLoadDone(false);
            return;
        }

        // Only fetch deleted passwords if user data is available and not currently loading
        if (user?.userId && !userLoading && !initialLoadDone) {
            console.log("User data available, fetching deleted passwords");
            fetchDeletedPasswords();
        }
    }, [user?.userId, userLoading, initialLoadDone]);

    // Show loading state when user data is still loading
    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto"></div>
                    <p className="text-theme-text">Loading user data...</p>
                </div>
            </div>
        );
    }

    // Show error if user data failed to load
    if (!userLoading && !user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <WarningIcon className="text-red-500 mx-auto" style={{ fontSize: '4rem' }} />
                    <p className="text-theme-text">Failed to load user data. Please refresh the page.</p>
                </div>
            </div>
        );
    }

    // Show password loading only when user data is available
    if (loading && user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto"></div>
                    <p className="text-theme-text">Loading deleted passwords...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <ErrorIcon className="text-red-500 mx-auto" style={{ fontSize: '4rem' }} />
                    <p className="text-red-500">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 h-full w-full bg-theme-background overflow-scroll">
            {/* Header with Search */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <DeleteIcon className="text-red-500" style={{ fontSize: '2rem' }} />
                        <div>
                            <h1 className="text-3xl font-bold text-theme-text">Trash</h1>
                            <p className="text-theme-text opacity-70 text-sm">
                                Manage your deleted password entries. Items are automatically removed after 30 days.
                            </p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    {deletedPasswords.length > 0 && (
                        <div className="relative max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="text-theme-text opacity-50" style={{ fontSize: '1.25rem' }} />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search deleted passwords..."
                                className="w-full pl-10 pr-10 py-2 border border-theme-secondary rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-transparent bg-theme-secondary text-theme-text placeholder-theme-text placeholder-opacity-60"
                            />
                            {searchQuery && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-theme-text opacity-50 hover:opacity-100"
                                >
                                    <CloseIcon style={{ fontSize: '1.25rem' }} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Search Results Info */}
                {searchQuery && (
                    <div className="flex items-center justify-between text-sm text-theme-text opacity-70">
                        <span>
                            {filteredDeletedPasswords.length} of {deletedPasswords.length} entries match "{searchQuery}"
                        </span>
                        {searchQuery && (
                            <button
                                onClick={clearSearch}
                                className="text-theme-primary hover:text-theme-primary-hover font-medium"
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            {deletedPasswords.length === 0 && initialLoadDone ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-6">
                    <DeleteIcon className="text-theme-text opacity-30 mx-auto" style={{ fontSize: '8rem' }} />
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-semibold text-theme-text">Trash is Empty</h3>
                        <p className="text-theme-text opacity-70 max-w-md">
                            No deleted passwords found. When you delete password entries, they'll appear here for 30 days before being permanently removed.
                        </p>
                    </div>
                </div>
            ) : deletedPasswords.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary"></div>
                </div>
            ) : filteredDeletedPasswords.length === 0 && searchQuery ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-6">
                    <SearchIcon className="text-theme-text opacity-30 mx-auto" style={{ fontSize: '6rem' }} />
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-semibold text-theme-text">No Results Found</h3>
                        <p className="text-theme-text opacity-70 max-w-md">
                            No deleted passwords match your search "{searchQuery}". Try different keywords or clear the search to see all entries.
                        </p>
                        <button
                            onClick={clearSearch}
                            className="mt-4 px-4 py-2 bg-theme-primary hover:bg-theme-primary-hover text-white rounded-lg font-medium transition-colors duration-200"
                        >
                            Clear Search
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDeletedPasswords.map((password, index) => (
                        <div
                            key={password.entry_id || index}
                            className="bg-theme-accent rounded-lg shadow-md p-6 border border-theme-secondary hover:shadow-lg transition-all duration-300 group"
                        >
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-4 gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                        <LockIcon className="text-red-500" style={{ fontSize: '1.25rem' }} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-theme-text text-lg truncate">
                                            {password.account_name || 'Account'}
                                        </h3>
                                        <p className="text-theme-text opacity-70 text-sm truncate" title={password.username}>
                                            {password.username}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-red-500 text-sm font-medium bg-red-500/10 px-2 py-1 rounded flex-shrink-0">
                                    Deleted
                                </div>
                            </div>

                            {/* Deletion Info */}
                            <div className="mb-4 p-3 bg-theme-secondary rounded-lg border border-theme-secondary/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-theme-text opacity-80">Deleted</span>
                                    </div>
                                    <div className="text-right">
                                        {password.deletion_info?.deleted_at ? (
                                            <>
                                                <div className="text-sm font-medium text-theme-text">
                                                    {new Date(password.deletion_info.deleted_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                                <div className="text-xs text-theme-text opacity-60">
                                                    {new Date(password.deletion_info.deleted_at).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-sm text-theme-text opacity-50 italic">
                                                Unknown
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {password.deletion_info?.deleted_at && (
                                    <div className="mt-2 pt-2 border-t border-theme-secondary/30">
                                        <div className="text-xs text-theme-text opacity-50 flex items-center gap-1">
                                            <ScheduleIcon style={{ fontSize: '0.875rem' }} />
                                            <span>
                                                {(() => {
                                                    const deletedDate = new Date(password.deletion_info.deleted_at);
                                                    const now = new Date();
                                                    const diffTime = now.getTime() - deletedDate.getTime();
                                                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                                    const remainingDays = Math.max(0, 30 - diffDays);

                                                    if (diffDays === 0) return "Deleted today";
                                                    if (diffDays === 1) return "Deleted yesterday";
                                                    if (diffDays < 7) return `Deleted ${diffDays} days ago`;
                                                    if (remainingDays > 0) return `${remainingDays} days until permanent deletion`;
                                                    return "Scheduled for permanent deletion";
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => restorePassword(password.entry_id)}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <RestoreIcon style={{ fontSize: '1rem' }} />
                                    Restore
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(password.entry_id)}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <DeleteForeverIcon style={{ fontSize: '1rem' }} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-theme-background rounded-2xl shadow-2xl max-w-md w-full p-6 border border-theme-secondary">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <DeleteForeverIcon className="text-red-500" style={{ fontSize: '1.25rem' }} />
                                </div>
                                <h2 className="text-xl font-bold text-theme-text">Permanently Delete Password</h2>
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
                                Are you sure you want to permanently delete this password entry?
                            </p>
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <div className="flex items-center gap-2 text-red-500">
                                    <WarningIcon style={{ fontSize: '1rem' }} />
                                    <span className="font-medium text-sm">Warning</span>
                                </div>
                                <p className="text-red-500 text-sm mt-1">
                                    This action cannot be undone. The password will be permanently removed from your vault.
                                </p>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelDelete}
                                className="flex-1 bg-theme-secondary hover:bg-theme-accent text-theme-text font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deletePasswordEntry(showDeleteConfirm)}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                <DeleteForeverIcon style={{ fontSize: '1rem' }} />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Trash;