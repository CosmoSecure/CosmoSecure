import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { decryptUser, token_secure } from '../components/auth/token_secure';

// Define interfaces for user data
interface UserData {
    id: string;
    name: string;
    email: string;
    username: string;
    joinDate: string;
    lastLogin: string;
    userId: string;
    maxPasswordCount: number;
    isSecureVault: boolean;
    hashedPassword?: string;
    masterPassword?: {
        isSet: boolean;
        hash?: string;
    };
}

interface UserContextType {
    user: UserData | null;
    isLoading: boolean;
    error: string | null;
    refreshUser: () => Promise<void>;
    refreshUserFromBackend: () => Promise<void>;
    clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = (): UserContextType => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Format date helper
    const formatDate = (dateField: any): string => {
        try {
            if (dateField && dateField.$date && dateField.$date.$numberLong) {
                const date = new Date(parseInt(dateField.$date.$numberLong));
                return date.toLocaleDateString('en-GB');
            }
            return 'N/A';
        } catch {
            return 'N/A';
        }
    };

    // Format last login helper
    const formatLastLogin = (lastLoginField: any): string => {
        try {
            if (lastLoginField && lastLoginField.$date && lastLoginField.$date.$numberLong) {
                const lastLogin = new Date(parseInt(lastLoginField.$date.$numberLong));
                return `${String(lastLogin.getDate()).padStart(2, '0')}-${String(
                    lastLogin.getMonth() + 1
                ).padStart(2, '0')}-${lastLogin.getFullYear()}`;
            }
            return 'Never';
        } catch {
            return 'Never';
        }
    };

    // Load user data from sessionStorage
    const loadUser = async (): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);

            const decryptedUser = decryptUser();

            console.log("Decrypted User: ", decryptedUser); //! Debugging log

            if (!decryptedUser) {
                console.log("No decrypted user data found"); //! Debug
                setUser(null);
                setError('Failed to decrypt user data');
                return;
            }

            console.log("Raw last login field (l):", decryptedUser.l); //! Debug last login
            console.log("Formatted last login:", formatLastLogin(decryptedUser.l)); //! Debug formatted last login

            // Map raw user data to clean interface
            const userData: UserData = {
                id: decryptedUser.ui || '',
                name: decryptedUser.n || '',
                email: decryptedUser.email || '',
                username: decryptedUser.username || '',
                joinDate: formatDate(decryptedUser.c),
                lastLogin: formatLastLogin(decryptedUser.l),
                userId: decryptedUser.ui || '',
                maxPasswordCount: decryptedUser.pc?.[1] || 0,
                isSecureVault: Boolean(decryptedUser.hp?.[0]?.ph),
                masterPassword: {
                    isSet: Boolean(decryptedUser.hp?.[0]?.mp?.ph),
                    hash: decryptedUser.hp?.[0]?.mp?.ph || undefined
                }
            };

            setUser(userData);
        } catch (err) {
            console.error('Error loading user data:', err);
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Refresh user data
    const refreshUser = async (): Promise<void> => {
        await loadUser();
    };

    // Refresh user data from backend (gets fresh data including updated last_login)
    const refreshUserFromBackend = async (): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);

            const currentUser = decryptUser();
            if (!currentUser || !currentUser.ui) {
                throw new Error('No current user data available');
            }

            console.log("Fetching fresh user data from backend...");
            const response = await invoke<{ token: string; data: any }>('update_user_session', {
                userId: currentUser.ui,
                tokenData: sessionStorage.getItem('token'),
            });

            if (response) {
                console.log("Fresh user data received from backend:", response);
                // Update sessionStorage with fresh data
                token_secure(response);

                // Save to backend storage
                await invoke('save_token_command', {
                    token: sessionStorage.getItem('token'),
                    user: sessionStorage.getItem('user')
                });

                // Reload user data from updated sessionStorage
                await loadUser();
            }
        } catch (err) {
            console.error('Error refreshing user data from backend:', err);
            setError(err instanceof Error ? err.message : 'Failed to refresh user data');
        } finally {
            setIsLoading(false);
        }
    };

    // Clear user data
    const clearUser = (): void => {
        setUser(null);
        setError(null);
        setIsLoading(false);
    };

    // Load user data on mount and also listen for storage changes
    useEffect(() => {
        loadUser();

        // Listen for storage changes (when user logs in/out from another tab or relogin)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'user' || e.key === 'token') {
                console.log('Storage changed, refreshing user data');
                loadUser();
            }
        };

        // Listen for custom events from login/logout processes
        const handleUserDataChange = () => {
            console.log('User data change event received, refreshing user data');
            loadUser();
        };

        // Listen for logout events and immediately clear user data
        const handleLogoutEvent = () => {
            console.log('Logout event received, clearing user data');
            clearUser();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('userDataChanged', handleUserDataChange);
        window.addEventListener('userLogout', handleLogoutEvent);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('userDataChanged', handleUserDataChange);
            window.removeEventListener('userLogout', handleLogoutEvent);
        };
    }, []);

    const value: UserContextType = {
        user,
        isLoading,
        error,
        refreshUser,
        refreshUserFromBackend,
        clearUser
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

// Utility hooks for common user data access patterns
export const useUserData = () => {
    const { user } = useUser();
    return user;
};

export const useUserId = () => {
    const { user } = useUser();
    return user?.userId || '';
};

export const useUserEmail = () => {
    const { user } = useUser();
    return user?.email || '';
};

export const useUserName = () => {
    const { user } = useUser();
    return user?.name || '';
};

export const useUsername = () => {
    const { user } = useUser();
    return user?.username || '';
};

export const useMasterPasswordStatus = () => {
    const { user } = useUser();
    return {
        isSet: user?.masterPassword?.isSet || false,
        hash: user?.masterPassword?.hash
    };
};
