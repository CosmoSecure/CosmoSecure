import { useNotification, notificationPresets } from '../contexts/NotificationContext';

// Notification middleware for API calls
export class NotificationMiddleware {
    private notification: ReturnType<typeof useNotification>;

    constructor(notification: ReturnType<typeof useNotification>) {
        this.notification = notification;
    }

    // Async operation wrapper with automatic notifications
    async withNotifications<T>(
        operation: () => Promise<T>,
        options: {
            loading?: string;
            success?: string | ((result: T) => string | null | undefined);
            error?: string | ((error: any) => string | null | undefined);
            showLoading?: boolean;
        }
    ): Promise<T> {
        const {
            loading = 'Processing...',
            success = 'Operation completed successfully!',
            error = 'Operation failed',
            showLoading = true
        } = options;

        let loadingToastId: string | number | undefined;

        try {
            if (showLoading) {
                loadingToastId = this.notification.loading(loading);
            }

            const result = await operation();

            if (loadingToastId) {
                this.notification.dismiss(loadingToastId);
            }

            const successMessage = typeof success === 'function' ? success(result) : success;
            if (successMessage) {
                this.notification.success(successMessage);
            }

            return result;
        } catch (err: any) {
            if (loadingToastId) {
                this.notification.dismiss(loadingToastId);
            }

            const errorMessage = typeof error === 'function' ? error(err) : error;
            if (errorMessage) {
                this.notification.error(errorMessage, {
                    description: err?.message || 'An unexpected error occurred'
                });
            }

            throw err;
        }
    }

    // Promise wrapper for automatic notifications
    wrapPromise<T>(
        promise: Promise<T>,
        options: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((error: any) => string);
        }
    ) {
        return this.notification.promise(promise, options);
    }

    // Form submission wrapper
    async handleFormSubmission<T>(
        submitFn: () => Promise<T>,
        options?: {
            loadingMessage?: string;
            successMessage?: string | ((result: T) => string);
            errorMessage?: string | ((error: any) => string);
        }
    ): Promise<T> {
        return this.withNotifications(submitFn, {
            loading: options?.loadingMessage || 'Submitting...',
            success: options?.successMessage || 'Form submitted successfully!',
            error: options?.errorMessage || 'Failed to submit form',
        });
    }

    // Authentication operations
    auth = {
        login: async (loginFn: () => Promise<any>, username?: string) => {
            return this.withNotifications(loginFn, {
                loading: 'Signing in...',
                success: () => {
                    // Use preset notification and don't show additional notification
                    notificationPresets.auth.loginSuccess(username);
                    return undefined; // Don't show additional notification
                },
                error: (err) => {
                    notificationPresets.auth.loginError(err?.message);
                    return undefined; // Don't show additional notification
                },
                showLoading: true
            });
        },

        signup: async (signupFn: () => Promise<any>) => {
            return this.withNotifications(signupFn, {
                loading: 'Creating account...',
                success: () => {
                    notificationPresets.auth.signupSuccess();
                    return undefined; // Don't show additional notification
                },
                error: (err) => {
                    notificationPresets.auth.signupError(err?.message);
                    return undefined; // Don't show additional notification
                },
                showLoading: true
            });
        },

        logout: async (logoutFn: () => Promise<any>) => {
            return this.withNotifications(logoutFn, {
                loading: 'Signing out...',
                success: () => {
                    notificationPresets.auth.logoutSuccess();
                    return undefined; // Don't show additional notification
                },
                error: 'Failed to sign out',
                showLoading: true
            });
        }
    };

    // Data operations
    data = {
        save: async <T>(saveFn: () => Promise<T>, itemType?: string) => {
            return this.withNotifications(saveFn, {
                loading: `Saving ${itemType || 'data'}...`,
                success: () => {
                    notificationPresets.data.saveSuccess(itemType);
                    return undefined; // Don't show additional notification
                },
                error: (err) => {
                    notificationPresets.data.saveError(itemType, err?.message);
                    return undefined; // Don't show additional notification
                }
            });
        },

        delete: async <T>(deleteFn: () => Promise<T>, itemType?: string) => {
            return this.withNotifications(deleteFn, {
                loading: `Deleting ${itemType || 'item'}...`,
                success: () => {
                    notificationPresets.data.deleteSuccess(itemType);
                    return undefined; // Don't show additional notification
                },
                error: (err) => {
                    notificationPresets.data.deleteError(itemType, err?.message);
                    return undefined; // Don't show additional notification
                }
            });
        },

        update: async <T>(updateFn: () => Promise<T>, itemType?: string) => {
            return this.withNotifications(updateFn, {
                loading: `Updating ${itemType || 'data'}...`,
                success: () => {
                    notificationPresets.data.updateSuccess(itemType);
                    return undefined; // Don't show additional notification
                },
                error: (err) => {
                    notificationPresets.data.updateError(itemType, err?.message);
                    return undefined; // Don't show additional notification
                }
            });
        }
    };

    // System operations
    system = {
        sync: async (syncFn: () => Promise<any>) => {
            return this.withNotifications(syncFn, {
                loading: 'Synchronizing data...',
                success: () => {
                    notificationPresets.system.syncSuccess();
                    return undefined; // Don't show additional notification
                },
                error: () => {
                    notificationPresets.system.syncError();
                    return undefined; // Don't show additional notification
                }
            });
        },

        backup: async (backupFn: () => Promise<any>) => {
            return this.withNotifications(backupFn, {
                loading: 'Creating backup...',
                success: () => {
                    notificationPresets.system.backupSuccess();
                    return undefined; // Don't show additional notification
                },
                error: () => {
                    notificationPresets.system.backupError();
                    return undefined; // Don't show additional notification
                }
            });
        },

        import: async (importFn: () => Promise<{ count: number }>) => {
            return this.withNotifications(importFn, {
                loading: 'Importing data...',
                success: (result) => {
                    notificationPresets.system.importSuccess(result.count);
                    return undefined; // Don't show additional notification
                },
                error: (err) => {
                    notificationPresets.system.importError(err?.message);
                    return undefined; // Don't show additional notification
                }
            });
        }
    };
}

// Hook to create notification middleware
export const useNotificationMiddleware = () => {
    const notification = useNotification();
    return new NotificationMiddleware(notification);
};

// Quick notification functions for common scenarios
export const useQuickNotifications = () => {
    const notification = useNotification();

    return {
        // Quick success/error notifications
        success: (message: string, description?: string) =>
            notification.success(message, { description }),

        error: (message: string, description?: string) =>
            notification.error(message, { description }),

        info: (message: string, description?: string) =>
            notification.info(message, { description }),

        warning: (message: string, description?: string) =>
            notification.warning(message, { description }),

        // Copy to clipboard notification
        copySuccess: (item: string = 'Text') =>
            notification.success(`${item} copied to clipboard!`, { duration: 2000 }),

        // Network status notifications
        offline: () => notificationPresets.network.offline(),
        online: () => notificationPresets.network.online(),

        // Password specific notifications
        passwordCopied: () => notificationPresets.password.copied(),
        passwordGenerated: () => notificationPresets.password.generated(),
        weakPassword: () => notificationPresets.password.strengthWeak(),
        strongPassword: () => notificationPresets.password.strengthGood(),
        breachDetected: (count: number) => notificationPresets.password.breachDetected(count),

        // Confirmation notifications with actions
        confirm: (
            message: string,
            onConfirm: () => void,
            options?: {
                description?: string;
                confirmLabel?: string;
                cancelLabel?: string;
            }
        ) => {
            const { description, confirmLabel = 'Confirm', cancelLabel = 'Cancel' } = options || {};

            return notification.warning(message, {
                description,
                duration: 10000, // Longer duration for user decision
                action: {
                    label: confirmLabel,
                    onClick: onConfirm
                },
                cancel: {
                    label: cancelLabel,
                    onClick: () => notification.dismiss()
                }
            });
        }
    };
};

// Global notification instance (use sparingly, prefer hooks)
let globalNotification: ReturnType<typeof useNotification> | null = null;

export const setGlobalNotification = (notification: ReturnType<typeof useNotification>) => {
    globalNotification = notification;
};

export const getGlobalNotification = () => {
    if (!globalNotification) {
        console.warn('Global notification not initialized. Use hooks instead.');
    }
    return globalNotification;
};

// Error boundary notification helper
export const notifyError = (error: Error, context?: string) => {
    const notification = getGlobalNotification();
    if (notification) {
        notification.error(
            `${context ? `${context}: ` : ''}${error.name}`,
            {
                description: error.message,
                duration: 8000
            }
        );
    } else {
        console.error(context ? `${context}:` : 'Error:', error);
    }
};
