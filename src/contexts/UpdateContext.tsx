import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';

// Define update release information structure
export interface UpdateRelease {
    version: string;
    name: string;
    body: string;
    download_url: string;
    published_at: string;
    size?: number;
    is_prerelease: boolean;
    sha256_digest?: string;
}

// Define update context interface
interface UpdateContextType {
    // State
    isUpdateAvailable: boolean;
    currentVersion: string;
    latestRelease: UpdateRelease | null;
    isChecking: boolean;
    isDownloading: boolean;
    downloadProgress: number;
    error: string | null;
    hasCheckedOnStartup: boolean;
    isWindows: boolean;
    isForcedUpdate: boolean;

    // Actions
    checkForUpdates: () => Promise<void>;
    downloadAndInstallUpdate: () => Promise<void>;
    dismissUpdate: (permanent?: boolean) => void;
    resetError: () => void;
    clearDismissedUpdates: () => void;
    checkForcedUpdate: () => Promise<void>;
}

// Create the context
const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

// Provider component
export const UpdateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [currentVersion, setCurrentVersion] = useState('');
    const [latestRelease, setLatestRelease] = useState<UpdateRelease | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [hasCheckedOnStartup, setHasCheckedOnStartup] = useState(false);
    const [isWindows, setIsWindows] = useState(false);
    const [isForcedUpdate, setIsForcedUpdate] = useState(false);

    // Get current version on mount
    useEffect(() => {
        const fetchCurrentVersion = async () => {
            try {
                const version = await invoke<string>('get_version');
                setCurrentVersion(version);
            } catch (err) {
                console.error('Failed to get current version:', err);
                setCurrentVersion('0.1.0'); // Fallback
            }
        };

        const detectPlatform = () => {
            // Simple platform detection using navigator
            setIsWindows(navigator.userAgent.toLowerCase().includes('windows'));
        };

        fetchCurrentVersion();
        detectPlatform();
    }, []);

    // Check for updates once on app startup
    useEffect(() => {
        if (currentVersion && !hasCheckedOnStartup) {
            const checkUpdates = async () => {
                console.log('[DEBUG] Starting update check sequence...');
                await checkForUpdates();
                console.log('[DEBUG] checkForUpdates completed, waiting before forced update check...');
                // Wait for tracker to be saved, then check forced update
                setTimeout(async () => {
                    console.log('[DEBUG] Now checking forced update...');
                    await checkForcedUpdate();
                    console.log('[DEBUG] Forced update check completed');
                }, 500);
            };
            checkUpdates();
            setHasCheckedOnStartup(true);
        }
    }, [currentVersion, hasCheckedOnStartup]);

    // Function to check if forced update is required
    const checkForcedUpdate = async () => {
        if (!currentVersion) return;

        console.log('[DEBUG] Checking forced update for version:', currentVersion);

        try {
            const shouldForce = await invoke<boolean>('should_force_update', {
                currentVersion
            });

            console.log('[DEBUG] Should force update result:', shouldForce);
            setIsForcedUpdate(shouldForce);

            if (shouldForce) {
                console.log('🔴 FORCED UPDATE REQUIRED - 30 days have passed');
            } else {
                console.log('✓ No forced update required');
            }
        } catch (err) {
            console.error('Failed to check forced update status:', err);
        }
    };

    // Function to check for updates
    const checkForUpdates = async () => {
        if (isChecking) return;

        setIsChecking(true);
        setError(null);

        try {
            const release = await invoke<UpdateRelease | null>('check_for_updates', {
                currentVersion
            });

            if (release) {
                setLatestRelease(release);
                setIsUpdateAvailable(true);

                // Store the detection date if this is a new update
                try {
                    await invoke('store_update_detection_date', {
                        version: release.version
                    });
                    console.log('Stored update detection date for version:', release.version);
                } catch (err) {
                    console.error('Failed to store update detection date:', err);
                }
            } else {
                setIsUpdateAvailable(false);
                setLatestRelease(null);

                // Clear tracker if no update is available
                try {
                    await invoke('clear_update_tracker');
                } catch (err) {
                    console.error('Failed to clear update tracker:', err);
                }
            }
        } catch (err) {
            console.error('Failed to check for updates:', err);
            setError('Failed to check for updates. Please try again later.');
        } finally {
            setIsChecking(false);
        }
    };

    // Function to download and install update
    const downloadAndInstallUpdate = async () => {
        if (!latestRelease || isDownloading) return;

        setIsDownloading(true);
        setError(null);
        setDownloadProgress(0);

        try {
            // Windows: Just open browser, no download progress
            if (isWindows) {
                await invoke<void>('download_and_install_update', {
                    downloadUrl: latestRelease.download_url,
                    version: latestRelease.version,
                    sha256Digest: latestRelease.sha256_digest
                });

                // Reset states immediately for Windows
                setIsDownloading(false);
                setDownloadProgress(0);
                return;
            }

            // Linux: Listen for real-time download progress events from backend
            const { getCurrentWindow } = await import('@tauri-apps/api/window');
            const window = getCurrentWindow();

            const unlisten = await window.listen<number>('download_progress', (event) => {
                setDownloadProgress(event.payload);
                console.log('Download progress:', event.payload + '%');
            });

            try {
                // Start download with real progress updates from backend
                await invoke<void>('download_and_install_update', {
                    downloadUrl: latestRelease.download_url,
                    version: latestRelease.version,
                    sha256Digest: latestRelease.sha256_digest
                });

                // Set to 100% on completion
                setDownloadProgress(100);
            } finally {
                // Clean up event listener
                unlisten();
            }

            // Small delay to show completion before app restarts
            setTimeout(() => {
                // App should restart automatically from Rust side
            }, 1000);

        } catch (err) {
            console.error('Failed to download update:', err);
            setError('Failed to download update. Please try again or download manually.');
            setIsDownloading(false);
            setDownloadProgress(0);
        }
    };    // Function to dismiss update notification
    const dismissUpdate = (permanent: boolean = false) => {
        setIsUpdateAvailable(false);

        // If permanent dismissal, store in localStorage to persist across sessions
        if (permanent && latestRelease) {
            localStorage.setItem('permanentlyDismissedUpdateVersion', latestRelease.version);
        }
    };

    // Function to reset error state
    const resetError = () => {
        setError(null);
    };

    // Function to clear all dismissed updates
    const clearDismissedUpdates = () => {
        localStorage.removeItem('permanentlyDismissedUpdateVersion');
        // Re-check for updates after clearing dismissals
        if (currentVersion) {
            checkForUpdates();
        }
    };

    // Check if update was permanently dismissed
    useEffect(() => {
        if (latestRelease && latestRelease.version) {
            const permanentlyDismissedVersion = localStorage.getItem('permanentlyDismissedUpdateVersion');
            if (permanentlyDismissedVersion === latestRelease.version) {
                setIsUpdateAvailable(false);
            }
        }
    }, [latestRelease]);

    const value: UpdateContextType = {
        isUpdateAvailable,
        currentVersion,
        latestRelease,
        isChecking,
        isDownloading,
        downloadProgress,
        error,
        hasCheckedOnStartup,
        isWindows,
        isForcedUpdate,
        checkForUpdates,
        downloadAndInstallUpdate,
        dismissUpdate,
        resetError,
        clearDismissedUpdates,
        checkForcedUpdate,
    };

    return (
        <UpdateContext.Provider value={value}>
            {children}
        </UpdateContext.Provider>
    );
};

// Custom hook to use update context
export const useUpdate = () => {
    const context = useContext(UpdateContext);
    if (!context) {
        throw new Error('useUpdate must be used within an UpdateProvider');
    }
    return context;
};

// Utility functions
export const compareVersions = (current: string, latest: string): boolean => {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    const maxLength = Math.max(currentParts.length, latestParts.length);

    for (let i = 0; i < maxLength; i++) {
        const currentPart = currentParts[i] || 0;
        const latestPart = latestParts[i] || 0;

        if (latestPart > currentPart) return true;
        if (latestPart < currentPart) return false;
    }

    return false;
};

export const formatReleaseDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
