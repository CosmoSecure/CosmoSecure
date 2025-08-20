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
        return toast.success(message, mergeOptions(options));
    };

    // Error notification
    const error = (message: string, options?: NotificationOptions) => {
        return toast.error(message, mergeOptions(options));
    };

    // Warning notification
    const warning = (message: string, options?: NotificationOptions) => {
        return toast.warning(message, mergeOptions(options));
    };

    // Info notification
    const info = (message: string, options?: NotificationOptions) => {
        return toast.info(message, mergeOptions(options));
    };

    // Loading notification
    const loading = (message: string, options?: NotificationOptions) => {
        return toast.loading(message, mergeOptions(options));
    };

    // Default message notification
    const message = (message: string, options?: NotificationOptions) => {
        return toast(message, mergeOptions(options));
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
        const toastId = toast.promise(promise, options);
        return toastId as string | number;
    };

    // Custom notification
    const custom = (jsx: (id: string | number) => React.ReactElement, options?: NotificationOptions) => {
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
            toast.success(`Welcome back${username ? `, ${username}` : ''}!`, {
                description: 'You have been successfully logged in.',
                duration: 3000,
            }),
        loginError: (error?: string) =>
            toast.error('Login Failed', {
                description: error || 'Please check your credentials and try again.',
                duration: 5000,
            }),
        signupSuccess: () =>
            toast.success('Account Created Successfully!', {
                description: 'You can now log in with your credentials.',
                duration: 4000,
            }),
        signupError: (error?: string) =>
            toast.error('Signup Failed', {
                description: error || 'Please try again with different credentials.',
                duration: 5000,
            }),
        logoutSuccess: () =>
            toast.success('Logged Out Successfully', {
                description: 'See you next time!',
                duration: 2000,
            }),
        sessionExpired: () =>
            toast.warning('Session Expired', {
                description: 'Please log in again to continue.',
                duration: 5000,
            }),
    },

    // Data operations
    data: {
        saveSuccess: (itemType?: string) =>
            toast.success(`${itemType || 'Data'} Saved Successfully!`, {
                duration: 3000,
            }),
        saveError: (itemType?: string, error?: string) =>
            toast.error(`Failed to Save ${itemType || 'Data'}`, {
                description: error || 'Please try again.',
                duration: 4000,
            }),
        deleteSuccess: (itemType?: string) =>
            toast.success(`${itemType || 'Item'} Deleted Successfully!`, {
                duration: 3000,
            }),
        deleteError: (itemType?: string, error?: string) =>
            toast.error(`Failed to Delete ${itemType || 'Item'}`, {
                description: error || 'Please try again.',
                duration: 4000,
            }),
        updateSuccess: (itemType?: string) =>
            toast.success(`${itemType || 'Data'} Updated Successfully!`, {
                duration: 3000,
            }),
        updateError: (itemType?: string, error?: string) =>
            toast.error(`Failed to Update ${itemType || 'Data'}`, {
                description: error || 'Please try again.',
                duration: 4000,
            }),
    },

    // Password manager specific
    password: {
        copied: () =>
            toast.success('Password Copied!', {
                description: 'Password has been copied to clipboard.',
                duration: 2000,
            }),
        generated: () =>
            toast.success('Password Generated!', {
                description: 'New secure password has been created.',
                duration: 3000,
            }),
        strengthWeak: () =>
            toast.warning('Weak Password Detected', {
                description: 'Consider using a stronger password for better security.',
                duration: 4000,
            }),
        strengthGood: () =>
            toast.success('Good Password Strength', {
                description: 'Your password meets security requirements.',
                duration: 3000,
            }),
        breachDetected: (count: number) =>
            toast.error('Security Breach Detected!', {
                description: `This password has been found in ${count} data breaches. Please change it immediately.`,
                duration: 8000,
            }),
    },

    // System operations
    system: {
        syncSuccess: () =>
            toast.success('Data Synchronized', {
                description: 'All your data is up to date.',
                duration: 3000,
            }),
        syncError: () =>
            toast.error('Synchronization Failed', {
                description: 'Unable to sync data. Please check your connection.',
                duration: 5000,
            }),
        backupSuccess: () =>
            toast.success('Backup Created Successfully!', {
                description: 'Your data has been safely backed up.',
                duration: 4000,
            }),
        backupError: () =>
            toast.error('Backup Failed', {
                description: 'Unable to create backup. Please try again.',
                duration: 5000,
            }),
        importSuccess: (count: number) =>
            toast.success(`Import Completed!`, {
                description: `Successfully imported ${count} items.`,
                duration: 4000,
            }),
        importError: (error?: string) =>
            toast.error('Import Failed', {
                description: error || 'Unable to import data. Please check the file format.',
                duration: 5000,
            }),
    },

    // Network operations
    network: {
        offline: () =>
            toast.warning('You are offline', {
                description: 'Some features may not be available.',
                duration: 5000,
            }),
        online: () =>
            toast.success('Back online!', {
                description: 'All features are now available.',
                duration: 2000,
            }),
        slowConnection: () =>
            toast.info('Slow connection detected', {
                description: 'Operations may take longer than usual.',
                duration: 4000,
            }),
    },
};

// Export toast directly for backward compatibility
export { toast };
