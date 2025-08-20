import React from 'react';
import { useNotification, notificationPresets } from '../contexts/NotificationContext';
import { useNotificationMiddleware, useQuickNotifications } from '../utils/notifications';
import { Button } from '@mui/material';

const NotificationExamples: React.FC = () => {
    const notification = useNotification();
    const middleware = useNotificationMiddleware();
    const quick = useQuickNotifications();

    // Example: Basic notifications
    const showBasicNotifications = () => {
        notification.success('Success message!');
        setTimeout(() => notification.error('Error message!'), 1000);
        setTimeout(() => notification.warning('Warning message!'), 2000);
        setTimeout(() => notification.info('Info message!'), 3000);
    };

    // Example: Notification with description and action
    const showAdvancedNotification = () => {
        notification.success('File uploaded successfully!', {
            description: 'Your document has been processed and is now available.',
            action: {
                label: 'View',
                onClick: () => console.log('View file clicked')
            },
            duration: 8000
        });
    };

    // Example: Promise notification
    const showPromiseNotification = () => {
        const mockApiCall = () =>
            new Promise<{ data: string }>((resolve, reject) => {
                setTimeout(() => {
                    Math.random() > 0.5
                        ? resolve({ data: 'Success data' })
                        : reject(new Error('API call failed'));
                }, 2000);
            });

        notification.promise(mockApiCall(), {
            loading: 'Uploading file...',
            success: (data) => `File uploaded! Data: ${data.data}`,
            error: 'Upload failed. Please try again.'
        });
    };

    // Example: Using middleware for form submission
    const handleFormSubmit = async () => {
        const mockSubmit = () =>
            new Promise<{ id: string }>((resolve) => {
                setTimeout(() => resolve({ id: '123' }), 1500);
            });

        try {
            const result = await middleware.handleFormSubmission(mockSubmit, {
                loadingMessage: 'Saving form...',
                successMessage: (result) => `Form saved with ID: ${result.id}`,
                errorMessage: 'Failed to save form'
            });
            console.log('Form result:', result);
        } catch (error) {
            console.error('Form error:', error);
        }
    };

    // Example: Authentication flow
    const handleLogin = async () => {
        const mockLogin = () =>
            new Promise<{ user: string }>((resolve, reject) => {
                setTimeout(() => {
                    Math.random() > 0.3
                        ? resolve({ user: 'john_doe' })
                        : reject(new Error('Invalid credentials'));
                }, 1000);
            });

        try {
            await middleware.auth.login(mockLogin, 'john_doe');
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    // Example: Data operations
    const handleDataOperations = async () => {
        const mockSave = () =>
            new Promise<void>((resolve) => {
                setTimeout(() => resolve(), 1000);
            });

        try {
            await middleware.data.save(mockSave, 'password entry');
        } catch (error) {
            console.error('Save failed:', error);
        }
    };

    // Example: Using presets
    const showPresetNotifications = () => {
        notificationPresets.password.copied();
        setTimeout(() => notificationPresets.password.generated(), 1000);
        setTimeout(() => notificationPresets.auth.sessionExpired(), 2000);
    };

    // Example: Quick notifications
    const showQuickNotifications = () => {
        quick.success('Quick success!');
        setTimeout(() => quick.copySuccess('Password'), 1000);
        setTimeout(() => quick.passwordCopied(), 2000);
    };

    // Example: Confirmation dialog
    const showConfirmation = () => {
        quick.confirm(
            'Delete this item?',
            () => {
                quick.success('Item deleted successfully!');
            },
            {
                description: 'This action cannot be undone.',
                confirmLabel: 'Delete',
                cancelLabel: 'Keep'
            }
        );
    };

    // Example: Custom notification
    const showCustomNotification = () => {
        notification.custom((id) => (
            <div className="bg-theme-background border border-theme-accent rounded-lg p-4 shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-theme-text font-semibold">Custom Notification</h3>
                        <p className="text-theme-text-secondary">This is a custom styled notification</p>
                    </div>
                    <button
                        onClick={() => notification.dismiss(id)}
                        className="text-theme-accent hover:text-theme-text"
                    >
                        ✕
                    </button>
                </div>
            </div>
        ), {
            duration: 5000
        });
    };

    return (
        <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold text-theme-text mb-6">Notification System Examples</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Button
                    variant="contained"
                    onClick={showBasicNotifications}
                    className="bg-theme-accent"
                >
                    Basic Notifications
                </Button>

                <Button
                    variant="contained"
                    onClick={showAdvancedNotification}
                    className="bg-theme-accent"
                >
                    Advanced Notification
                </Button>

                <Button
                    variant="contained"
                    onClick={showPromiseNotification}
                    className="bg-theme-accent"
                >
                    Promise Notification
                </Button>

                <Button
                    variant="contained"
                    onClick={handleFormSubmit}
                    className="bg-theme-accent"
                >
                    Form Submission
                </Button>

                <Button
                    variant="contained"
                    onClick={handleLogin}
                    className="bg-theme-accent"
                >
                    Login Example
                </Button>

                <Button
                    variant="contained"
                    onClick={handleDataOperations}
                    className="bg-theme-accent"
                >
                    Data Operations
                </Button>

                <Button
                    variant="contained"
                    onClick={showPresetNotifications}
                    className="bg-theme-accent"
                >
                    Preset Notifications
                </Button>

                <Button
                    variant="contained"
                    onClick={showQuickNotifications}
                    className="bg-theme-accent"
                >
                    Quick Notifications
                </Button>

                <Button
                    variant="contained"
                    onClick={showConfirmation}
                    className="bg-theme-accent"
                >
                    Confirmation Dialog
                </Button>

                <Button
                    variant="contained"
                    onClick={showCustomNotification}
                    className="bg-theme-accent"
                >
                    Custom Notification
                </Button>

                <Button
                    variant="outlined"
                    onClick={() => notification.dismissAll()}
                    className="border-theme-accent text-theme-accent"
                >
                    Dismiss All
                </Button>
            </div>

            <div className="mt-8 p-4 bg-theme-background-secondary rounded-lg">
                <h3 className="text-lg font-semibold text-theme-text mb-2">Usage Tips:</h3>
                <ul className="text-theme-text-secondary space-y-1 text-sm">
                    <li>• Use <code>useNotification()</code> for basic toast notifications</li>
                    <li>• Use <code>useNotificationMiddleware()</code> for automatic loading/success/error handling</li>
                    <li>• Use <code>useQuickNotifications()</code> for common notification patterns</li>
                    <li>• Use <code>notificationPresets</code> for consistent messaging across the app</li>
                    <li>• All notifications are themed automatically with your current theme</li>
                </ul>
            </div>
        </div>
    );
};

export default NotificationExamples;
