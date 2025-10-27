import { notificationPresets } from '../contexts/NotificationContext';

/**
 * Utility functions for handling database-related errors in the frontend
 */
export class DatabaseErrorHandler {
    /**
     * Check if an error is database connection related
     * @param error - The error message or Error object
     * @returns true if the error is connection related
     */
    static isConnectionError(error: string | Error): boolean {
        const errorMessage = typeof error === 'string' ? error : error.message;
        const connectionErrorPatterns = [
            'database not connected',
            'connection refused',
            'connection timeout',
            'network error',
            'mongodb error',
            'failed to connect'
        ];
        return connectionErrorPatterns.some(pattern =>
            errorMessage.toLowerCase().includes(pattern)
        );
    }

    /**
     * Handle database operation errors and show appropriate notifications
     * @param error - The error message or Error object
     * @param operation - The operation that failed (optional)
     * @param showNotification - Whether to show notification (default: true)
     */
    static handleDatabaseError(
        error: string | Error,
        operation?: string,
        showNotification: boolean = true
    ): void {
        const errorMessage = typeof error === 'string' ? error : error.message;

        console.error(`Database operation ${operation || 'unknown'} failed:`, errorMessage);

        if (showNotification) {
            if (this.isConnectionError(errorMessage)) {
                notificationPresets.database.operationFailed(operation);
            } else {
                // Generic error notification
                const operationText = operation ? `${operation} failed` : 'Operation failed';
                console.error(`${operationText}: ${errorMessage}`);
            }
        }
    }

    /**
     * Wrap a database operation with error handling
     * @param operation - The async operation to execute
     * @param operationName - Name of the operation for error reporting
     * @returns Promise with the result or throws handled error
     */
    static async withErrorHandling<T>(
        operation: () => Promise<T>,
        operationName: string
    ): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            this.handleDatabaseError(error as Error, operationName);
            throw error; // Re-throw so caller can handle if needed
        }
    }

    /**
     * Parse backend error messages for specific database errors
     * @param error - The error message from backend
     * @returns Parsed error information
     */
    static parseBackendError(error: string): {
        isConnectionError: boolean;
        isDatabaseError: boolean;
        userFriendlyMessage: string;
        originalError: string;
    } {
        const lowerError = error.toLowerCase();

        const isConnectionError = this.isConnectionError(error);
        const isDatabaseError = lowerError.includes('database') ||
            lowerError.includes('mongo') ||
            lowerError.includes('collection');

        let userFriendlyMessage = error;

        // Convert technical errors to user-friendly messages
        if (isConnectionError) {
            userFriendlyMessage = "Database connection issue. Please check your connection.";
        } else if (error.includes("Database not connected")) {
            userFriendlyMessage = "Database is offline. Some features are unavailable.";
        } else if (error.includes("Username is already taken")) {
            userFriendlyMessage = "This username is already taken. Please choose another.";
        } else if (error.includes("User not found")) {
            userFriendlyMessage = "User account not found. Please check your credentials.";
        } else if (error.includes("Current password is incorrect")) {
            userFriendlyMessage = "Current password is incorrect. Please try again.";
        }

        return {
            isConnectionError,
            isDatabaseError,
            userFriendlyMessage,
            originalError: error,
        };
    }

    /**
     * Show a database status notification based on connection state
     * @param isConnected - Current connection state
     * @param previousState - Previous connection state (to avoid duplicate notifications)
     */
    static showConnectionStatusNotification(isConnected: boolean, previousState?: boolean): void {
        // Only show notification if state changed
        if (previousState !== undefined && previousState === isConnected) {
            return;
        }

        if (isConnected) {
            notificationPresets.database.connected();
        } else {
            notificationPresets.database.disconnected();
        }
    }

    /**
     * Get appropriate retry strategy for database operations
     * @param error - The error that occurred
     * @returns Retry strategy information
     */
    static getRetryStrategy(error: string | Error): {
        shouldRetry: boolean;
        retryDelay: number;
        maxRetries: number;
        retryMessage: string;
    } {
        const errorMessage = typeof error === 'string' ? error : error.message;
        const isConnectionIssue = this.isConnectionError(errorMessage);

        if (isConnectionIssue) {
            return {
                shouldRetry: true,
                retryDelay: 5000, // 5 seconds
                maxRetries: 3,
                retryMessage: "Retrying operation after connection issue...",
            };
        }

        return {
            shouldRetry: false,
            retryDelay: 0,
            maxRetries: 0,
            retryMessage: "",
        };
    }
}

/**
 * Higher-order component wrapper for database operations
 * Automatically handles database errors and provides retry functionality
 */
export const withDatabaseErrorHandling = <T extends any[], R>(
    operation: (...args: T) => Promise<R>,
    operationName: string
) => {
    return async (...args: T): Promise<R> => {
        return DatabaseErrorHandler.withErrorHandling(
            () => operation(...args),
            operationName
        );
    };
};

/**
 * React hook for database operations with built-in error handling
 */
export const useDatabaseOperation = () => {
    const handleDatabaseOperation = async <T>(
        operation: () => Promise<T>,
        operationName: string,
        onSuccess?: (result: T) => void,
        onError?: (error: Error) => void
    ): Promise<T | null> => {
        try {
            const result = await DatabaseErrorHandler.withErrorHandling(operation, operationName);
            onSuccess?.(result);
            return result;
        } catch (error) {
            onError?.(error as Error);
            return null;
        }
    };

    return { handleDatabaseOperation };
};

export default DatabaseErrorHandler;