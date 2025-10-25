import React, { createContext, useContext, ReactNode } from 'react';
import { toast, ExternalToast } from 'sonner';

// Define notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'default';

// Define notification options that match sonner's ExternalToast interface
export interface NotificationOptions extends Omit<ExternalToast, 'position'> {
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

// Define the context interface
interface NotificationContextType {
    // Basic notification methods
    success: (message: string, options?: NotificationOptions) => string | number;
    error: (message: string, options?: NotificationOptions) => string | number;
    warning: (message: string, options?: NotificationOptions) => string | number;
    info: (message: string, options?: NotificationOptions) => string | number;
    loading: (message: string, options?: NotificationOptions) => string | number;
    message: (message: string, options?: NotificationOptions) => string | number;

    // Advanced methods
    promise: <T>(
        promise: Promise<T>,
        options: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((error: any) => string);
        }
    ) => string | number;

    custom: (jsx: (id: string | number) => React.ReactElement, options?: NotificationOptions) => string | number;

    // Control methods
    dismiss: (id?: string | number) => void;
    dismissAll: () => void;
}

// Create the context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Simple dedupe cache to avoid showing identical notifications multiple times in a short interval
const recentNotifications = new Map<string, number>();
const DEDUPE_WINDOW_MS = 60000; // 60 seconds - suppress identical notifications for 60s

function shouldShowNotification(key: string, now = Date.now()): boolean {
    const last = recentNotifications.get(key);
    if (!last) return true;
    return now - last > DEDUPE_WINDOW_MS;
}

function recordNotification(key: string, now = Date.now()) {
    recentNotifications.set(key, now);
}

// Periodic cleanup to avoid unbounded map growth (remove entries older than 5 * DEDUPE_WINDOW_MS)
setInterval(() => {
    const cutoff = Date.now() - DEDUPE_WINDOW_MS * 5;
    for (const [k, ts] of recentNotifications.entries()) {
        if (ts < cutoff) recentNotifications.delete(k);
    }
}, DEDUPE_WINDOW_MS * 5);

function showToast(type: NotificationType, message: string, options?: NotificationOptions): string | number {
    const key = `${type}:${message}`;
    if (!shouldShowNotification(key)) {
        // Return a stable numeric id when suppressed so callers' types remain satisfied
        return -1;
    }
    recordNotification(key);

    switch (type) {
        case 'success':
            return toast.success(message, options as any);
        case 'error':
            return toast.error(message, options as any);
        case 'warning':
            return toast.warning(message, options as any);
        case 'info':
            return toast.info(message, options as any);
        case 'loading':
            return toast.loading(message, options as any);
        default:
            return toast(message, options as any);
    }
}

// Provider component
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Helper function to merge options with defaults
    const mergeOptions = (options?: NotificationOptions) => {
        return {
            duration: 4000,
            ...options,
        };
    };

    // Success notification
    const success = (message: string, options?: NotificationOptions) => {
        return showToast('success', message, mergeOptions(options));
    };

    // Error notification
    const error = (message: string, options?: NotificationOptions) => {
        return showToast('error', message, mergeOptions(options));
    };

    // Warning notification
    const warning = (message: string, options?: NotificationOptions) => {
        return showToast('warning', message, mergeOptions(options));
    };

    // Info notification
    const info = (message: string, options?: NotificationOptions) => {
        return showToast('info', message, mergeOptions(options));
    };

    // Loading notification
    const loading = (message: string, options?: NotificationOptions) => {
        return showToast('loading', message, mergeOptions(options));
    };

    // Default message notification
    const message = (message: string, options?: NotificationOptions) => {
        return showToast('default', message, mergeOptions(options));
    };

    // Promise notification
    const promise = <T,>(
        promise: Promise<T>,
        options: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((error: any) => string);
        }
    ) => {
        // promise helper from sonner can't be deduped easily; call directly
        const toastId = toast.promise(promise, options);
        return toastId as string | number;
    };

    // Custom notification
    const custom = (jsx: (id: string | number) => React.ReactElement, options?: NotificationOptions) => {
        // custom toasts are unique by content — skip dedupe
        return toast.custom(jsx, mergeOptions(options));
    };

    // Dismiss specific notification
    const dismiss = (id?: string | number) => {
        if (id) {
            toast.dismiss(id);
        } else {
            toast.dismiss();
        }
    };

    // Dismiss all notifications
    const dismissAll = () => {
        toast.dismiss();
    };

    const value: NotificationContextType = {
        success,
        error,
        warning,
        info,
        loading,
        message,
        promise,
        custom,
        dismiss,
        dismissAll,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

// Custom hook to use notifications
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

// Pre-configured notification functions for common use cases
export const notificationPresets = {
    // Authentication related
    auth: {
        loginSuccess: (username?: string) =>
            showToast('success', `Welcome back${username ? `, ${username}` : ''}!`, {
                description: 'You have been successfully logged in.',
                duration: 3000,
            }),
        loginError: (error?: string) =>
            showToast('error', 'Login Failed', {
                description: error || 'Please check your credentials and try again.',
                duration: 5000,
            }),
        signupSuccess: () =>
            showToast('success', 'Account Created Successfully!', {
                description: 'You can now log in with your credentials.',
                duration: 4000,
            }),
        signupError: (error?: string) =>
            showToast('error', 'Signup Failed', {
                description: error || 'Please try again with different credentials.',
                duration: 5000,
            }),
        logoutSuccess: () =>
            showToast('success', 'Logged Out Successfully', {
                description: 'See you next time!',
                duration: 2000,
            }),
        sessionExpired: () =>
            showToast('warning', 'Session Expired', {
                description: 'Please log in again to continue.',
                duration: 5000,
            }),
    },

    // Data operations
    data: {
        saveSuccess: (itemType?: string) =>
            showToast('success', `${itemType || 'Data'} Saved Successfully!`, {
                duration: 3000,
            }),
        saveError: (itemType?: string, error?: string) =>
            showToast('error', `Failed to Save ${itemType || 'Data'}`, {
                description: error || 'Please try again.',
                duration: 4000,
            }),
        deleteSuccess: (itemType?: string) =>
            showToast('success', `${itemType || 'Item'} Deleted Successfully!`, {
                duration: 3000,
            }),
        deleteError: (itemType?: string, error?: string) =>
            showToast('error', `Failed to Delete ${itemType || 'Item'}`, {
                description: error || 'Please try again.',
                duration: 5000,
            }),
        updateSuccess: (itemType?: string) =>
            showToast('success', `${itemType || 'Data'} Updated Successfully!`, {
                duration: 3000,
            }),
        updateError: (itemType?: string, error?: string) =>
            showToast('error', `Failed to Update ${itemType || 'Data'}`, {
                description: error || 'Please try again.',
                duration: 3000,
            }),
    },

    // Password manager specific
    password: {
        copied: () =>
            showToast('success', 'Password Copied!', {
                description: 'Password has been copied to clipboard.',
                duration: 2000,
            }),
        generated: () =>
            showToast('success', 'Password Generated!', {
                description: 'New secure password has been created.',
                duration: 3000,
            }),
        strengthWeak: () =>
            showToast('warning', 'Weak Password Detected', {
                description: 'Consider using a stronger password for better security.',
                duration: 4000,
            }),
        strengthGood: () =>
            showToast('success', 'Good Password Strength', {
                description: 'Your password meets security requirements.',
                duration: 3000,
            }),
        breachDetected: (count: number) =>
            showToast('error', 'Security Breach Detected!', {
                description: `This password has been found in ${count} data breaches. Please change it immediately.`,
                duration: 8000,
            }),
    },

    // System operations
    system: {
        syncSuccess: () =>
            showToast('success', 'Data Synchronized', {
                description: 'All your data is up to date.',
                duration: 3000,
            }),
        syncError: () =>
            showToast('error', 'Synchronization Failed', {
                description: 'Unable to sync data. Please check your connection.',
                duration: 5000,
            }),
        backupSuccess: () =>
            showToast('success', 'Backup Created Successfully!', {
                description: 'Your data has been safely backed up.',
                duration: 4000,
            }),
        backupError: () =>
            showToast('error', 'Backup Failed', {
                description: 'Unable to create backup. Please try again.',
                duration: 5000,
            }),
        importSuccess: (count: number) =>
            showToast('success', `Import Completed!`, {
                description: `Successfully imported ${count} items.`,
                duration: 4000,
            }),
        importError: (error?: string) =>
            showToast('error', 'Import Failed', {
                description: error || 'Unable to import data. Please check the file format.',
                duration: 5000,
            }),
    },

    // Network operations
    network: {
        offline: () =>
            showToast('warning', 'You are offline', {
                description: 'Some features may not be available.',
                duration: 5000,
            }),
        online: () =>
            showToast('success', 'Back online!', {
                description: 'All features are now available.',
                duration: 2000,
            }),
        slowConnection: () =>
            showToast('info', 'Slow connection detected', {
                description: 'Operations may take longer than usual.',
                duration: 4000,
            }),
    },

    // Database operations
    database: {
        connected: () =>
            showToast('success', 'Database Connected', {
                description: 'Successfully connected to MongoDB database.',
                duration: 3000,
            }),
        disconnected: (error?: string) =>
            showToast('error', 'Database Disconnected', {
                description: error || 'Lost connection to MongoDB database.',
                duration: 5000,
            }),
        reconnecting: () =>
            showToast('loading', 'Attempting to reconnect...', {
                description: 'Trying to reconnect to MongoDB database.',
                duration: 3000,
            }),
        reconnectSuccess: () =>
            showToast('success', 'Reconnection Successful', {
                description: 'Successfully reconnected to MongoDB database.',
                duration: 4000,
            }),
        reconnectFailed: () =>
            showToast('error', 'Reconnection Failed', {
                description: 'Failed to reconnect to MongoDB database. Please check your connection.',
                duration: 6000,
            }),
        operationFailed: (operation?: string) =>
            showToast('error', `${operation || 'Operation'} Failed`, {
                description: 'Database is not connected. Please check your connection.',
                duration: 5000,
            }),
        initialConnectionFailed: () =>
            showToast('warning', 'Running in Offline Mode', {
                description: 'Could not connect to database. Some features will be unavailable.',
                duration: 8000,
            }),
        healthCheckFailed: () =>
            showToast('warning', 'Database Health Check Failed', {
                description: 'Connection may be unstable. Monitoring connection status.',
                duration: 4000,
            }),
    },
};

// Export toast directly for backward compatibility
export { toast };
