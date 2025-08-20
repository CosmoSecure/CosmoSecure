# CosmoSecure Notification System

This document explains the comprehensive notification middleware system implemented for CosmoSecure.

## 🌟 Overview

The notification system provides a centralized way to display toast notifications throughout the application. It's built on top of the `sonner` library and provides multiple layers of abstraction for different use cases.

## 📁 Architecture

### Files Structure
```
src/
├── contexts/
│   ├── NotificationContext.tsx    # Core notification context provider
│   └── index.tsx                  # Exports all contexts
├── utils/
│   └── notifications.ts           # Middleware and utility functions
├── components/
│   └── NotificationExamples.tsx   # Example implementations
└── App.tsx                        # Root setup with providers
```

## 🚀 Quick Start

### 1. Basic Usage

```tsx
import { useNotification } from '../contexts/NotificationContext';

const MyComponent = () => {
    const notification = useNotification();

    const handleSuccess = () => {
        notification.success('Operation completed!');
    };

    const handleError = () => {
        notification.error('Something went wrong!', {
            description: 'Please try again later.'
        });
    };

    return (
        <div>
            <button onClick={handleSuccess}>Show Success</button>
            <button onClick={handleError}>Show Error</button>
        </div>
    );
};
```

### 2. Using Middleware for Async Operations

```tsx
import { useNotificationMiddleware } from '../utils/notifications';

const MyComponent = () => {
    const middleware = useNotificationMiddleware();

    const handleSubmit = async () => {
        const submitData = async () => {
            const response = await fetch('/api/submit', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            return response.json();
        };

        try {
            await middleware.withNotifications(submitData, {
                loading: 'Submitting data...',
                success: 'Data submitted successfully!',
                error: 'Failed to submit data'
            });
        } catch (error) {
            // Error is already handled by middleware
        }
    };

    return <button onClick={handleSubmit}>Submit</button>;
};
```

### 3. Quick Notifications

```tsx
import { useQuickNotifications } from '../utils/notifications';

const MyComponent = () => {
    const quick = useQuickNotifications();

    const copyPassword = () => {
        navigator.clipboard.writeText('password123');
        quick.passwordCopied();
    };

    const showConfirmation = () => {
        quick.confirm(
            'Delete this item?',
            () => quick.success('Item deleted!'),
            { description: 'This action cannot be undone.' }
        );
    };

    return (
        <div>
            <button onClick={copyPassword}>Copy Password</button>
            <button onClick={showConfirmation}>Delete Item</button>
        </div>
    );
};
```

## 🛠 API Reference

### Core Notification Methods

#### `useNotification()`
The main hook for basic notification functionality.

```tsx
const notification = useNotification();

// Basic notifications
notification.success(message, options?)
notification.error(message, options?)
notification.warning(message, options?)
notification.info(message, options?)
notification.loading(message, options?)
notification.message(message, options?)

// Promise notifications
notification.promise(promise, {
    loading: 'Loading...',
    success: 'Success!',
    error: 'Error occurred'
});

// Custom notifications
notification.custom((id) => <CustomComponent />, options?)

// Control
notification.dismiss(id?)
notification.dismissAll()
```

### Notification Options

```tsx
interface NotificationOptions {
    description?: string;
    duration?: number;
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    action?: {
        label: string;
        onClick: (event: MouseEvent) => void;
    };
    cancel?: {
        label: string;
        onClick?: (event: MouseEvent) => void;
    };
    id?: string | number;
    important?: boolean;
    onDismiss?: (toast: ToastT) => void;
    onAutoClose?: (toast: ToastT) => void;
}
```

### Middleware Methods

#### `useNotificationMiddleware()`
Provides automated notification handling for async operations.

```tsx
const middleware = useNotificationMiddleware();

// Generic async wrapper
middleware.withNotifications(asyncFn, {
    loading?: string;
    success?: string | ((result) => string);
    error?: string | ((error) => string);
    showLoading?: boolean;
});

// Authentication operations
middleware.auth.login(loginFn, username?)
middleware.auth.signup(signupFn)
middleware.auth.logout(logoutFn)

// Data operations
middleware.data.save(saveFn, itemType?)
middleware.data.delete(deleteFn, itemType?)
middleware.data.update(updateFn, itemType?)

// System operations
middleware.system.sync(syncFn)
middleware.system.backup(backupFn)
middleware.system.import(importFn)

// Form handling
middleware.handleFormSubmission(submitFn, options?)
```

### Quick Notifications

#### `useQuickNotifications()`
Pre-configured notifications for common scenarios.

```tsx
const quick = useQuickNotifications();

// Basic notifications
quick.success(message, description?)
quick.error(message, description?)
quick.info(message, description?)
quick.warning(message, description?)

// Copy notifications
quick.copySuccess(item?)

// Network status
quick.offline()
quick.online()

// Password specific
quick.passwordCopied()
quick.passwordGenerated()
quick.weakPassword()
quick.strongPassword()
quick.breachDetected(count)

// Confirmation dialogs
quick.confirm(message, onConfirm, options?)
```

### Notification Presets

#### `notificationPresets`
Pre-defined notifications for consistency across the app.

```tsx
import { notificationPresets } from '../contexts/NotificationContext';

// Authentication
notificationPresets.auth.loginSuccess(username?)
notificationPresets.auth.loginError(error?)
notificationPresets.auth.signupSuccess()
notificationPresets.auth.signupError(error?)
notificationPresets.auth.logoutSuccess()
notificationPresets.auth.sessionExpired()

// Data operations
notificationPresets.data.saveSuccess(itemType?)
notificationPresets.data.saveError(itemType?, error?)
notificationPresets.data.deleteSuccess(itemType?)
notificationPresets.data.deleteError(itemType?, error?)
notificationPresets.data.updateSuccess(itemType?)
notificationPresets.data.updateError(itemType?, error?)

// Password operations
notificationPresets.password.copied()
notificationPresets.password.generated()
notificationPresets.password.strengthWeak()
notificationPresets.password.strengthGood()
notificationPresets.password.breachDetected(count)

// System operations
notificationPresets.system.syncSuccess()
notificationPresets.system.syncError()
notificationPresets.system.backupSuccess()
notificationPresets.system.backupError()
notificationPresets.system.importSuccess(count)
notificationPresets.system.importError(error?)

// Network status
notificationPresets.network.offline()
notificationPresets.network.online()
notificationPresets.network.slowConnection()
```

## 🎨 Styling

The notification system respects your current theme. The Toaster component in `App.tsx` is configured with:

```tsx
<Toaster 
    richColors 
    position="top-center" 
    theme="dark"
    toastOptions={{
        style: {
            fontSize: '1rem',
            padding: '1rem',
            marginTop: '1rem',
            color: '#f7fafc',
            borderRadius: '0.5rem',
            boxShadow: '0 0 0.5rem rgba(0, 0, 0, 0.1)',
            zIndex: 9999
        }
    }}
/>
```

## 📝 Examples

### Form Submission with Validation

```tsx
const PasswordForm = () => {
    const middleware = useNotificationMiddleware();
    const quick = useQuickNotifications();

    const handleSubmit = async (data) => {
        // Validation
        if (!data.password) {
            quick.warning('Missing Password', 'Please enter a password.');
            return;
        }

        // Submission with automatic notifications
        try {
            await middleware.data.save(
                () => submitPassword(data),
                'password entry'
            );
        } catch (error) {
            // Error already handled by middleware
        }
    };
};
```

### Login Flow

```tsx
const LoginComponent = () => {
    const middleware = useNotificationMiddleware();

    const handleLogin = async (credentials) => {
        try {
            const user = await middleware.auth.login(
                () => authenticateUser(credentials),
                credentials.username
            );
            // Success notification shown automatically
            redirectToHome();
        } catch (error) {
            // Error notification shown automatically
        }
    };
};
```

### Copy to Clipboard

```tsx
const PasswordDisplay = ({ password }) => {
    const quick = useQuickNotifications();

    const copyPassword = async () => {
        try {
            await navigator.clipboard.writeText(password);
            quick.passwordCopied();
        } catch (error) {
            quick.error('Copy Failed', 'Unable to copy to clipboard.');
        }
    };

    return (
        <button onClick={copyPassword}>
            Copy Password
        </button>
    );
};
```

### Confirmation Dialog

```tsx
const DeleteButton = ({ onDelete }) => {
    const quick = useQuickNotifications();

    const handleDelete = () => {
        quick.confirm(
            'Delete this password entry?',
            async () => {
                try {
                    await onDelete();
                    quick.success('Entry deleted successfully!');
                } catch (error) {
                    quick.error('Delete failed', error.message);
                }
            },
            {
                description: 'This action cannot be undone.',
                confirmLabel: 'Delete',
                cancelLabel: 'Cancel'
            }
        );
    };

    return <button onClick={handleDelete}>Delete</button>;
};
```

## 🔧 Advanced Usage

### Custom Error Boundary Integration

```tsx
import { notifyError } from '../utils/notifications';

class ErrorBoundary extends React.Component {
    componentDidCatch(error, errorInfo) {
        notifyError(error, 'Application Error');
    }
}
```

### Global Notification Setup

```tsx
// In App.tsx or root component
import { setGlobalNotification } from '../utils/notifications';

const App = () => {
    const notification = useNotification();

    useEffect(() => {
        setGlobalNotification(notification);
    }, [notification]);

    // ... rest of app
};
```

## 🎯 Best Practices

### 1. Use Appropriate Methods
- **Basic notifications**: Use `useNotification()` for simple messages
- **Async operations**: Use `useNotificationMiddleware()` for loading/success/error flows
- **Common patterns**: Use `useQuickNotifications()` for standard scenarios
- **Consistency**: Use `notificationPresets` for repeated messages

### 2. Message Guidelines
- Keep messages concise but informative
- Use descriptions for additional context
- Provide actionable feedback when possible
- Use consistent terminology throughout the app

### 3. Error Handling
- Always handle errors gracefully
- Provide meaningful error messages
- Include recovery suggestions when possible
- Log errors to console for debugging

### 4. Performance
- Don't show too many notifications simultaneously
- Use appropriate durations (2-4 seconds for success, longer for errors)
- Dismiss loading notifications properly
- Use `dismissAll()` sparingly

### 5. User Experience
- Group related notifications
- Use confirmation dialogs for destructive actions
- Provide feedback for all user actions
- Respect user preferences for notification frequency

## 🐛 Troubleshooting

### Common Issues

1. **"useNotification must be used within a NotificationProvider"**
   - Ensure your component is wrapped with `NotificationProvider`
   - Check that the provider is correctly imported and used

2. **Notifications not appearing**
   - Verify the `Toaster` component is rendered in your app
   - Check z-index conflicts with other elements
   - Ensure the notification isn't being dismissed immediately

3. **TypeScript errors**
   - Import types from the correct paths
   - Ensure `sonner` is properly installed and typed

4. **Styling issues**
   - Check theme variables are defined
   - Verify CSS classes are available
   - Confirm Toaster configuration

### Debugging

Enable debug mode by temporarily adding console logs:

```tsx
const notification = useNotification();

const showNotification = () => {
    console.log('Showing notification');
    const id = notification.success('Test message');
    console.log('Notification ID:', id);
};
```

## 🔮 Future Enhancements

Potential improvements for the notification system:

1. **Persistence**: Store important notifications across sessions
2. **Categories**: Group notifications by type or priority
3. **Batch operations**: Handle multiple related notifications
4. **Sound effects**: Audio feedback for certain notification types
5. **Animation customization**: More transition options
6. **Mobile optimization**: Better touch handling and positioning
7. **Accessibility**: Enhanced screen reader support
8. **Analytics**: Track notification interaction patterns

---

For more examples and usage patterns, see `src/components/NotificationExamples.tsx`.
