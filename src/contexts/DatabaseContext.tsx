import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNotification } from './NotificationContext';

// Minimal DB context: only expose connection status and essential methods

export interface ConnectionStatus {
    is_connected: boolean;
    last_check?: string;
    error_message?: string;
}

interface DatabaseContextType {
    connectionStatus: ConnectionStatus;
    isConnected: boolean;
    checkConnection: () => Promise<void>;
    attemptReconnection: () => Promise<boolean>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ is_connected: false });
    const [lastNotificationState, setLastNotificationState] = useState<boolean | null>(null);
    const lastCheckRef = React.useRef<number>(0);
    const MIN_CHECK_INTERVAL_MS = 15000;
    const { error, warning } = useNotification();

    const checkConnection = useCallback(async () => {
        const now = Date.now();
        if (now - lastCheckRef.current < MIN_CHECK_INTERVAL_MS) return;
        lastCheckRef.current = now;
        try {
            const status = await invoke<ConnectionStatus>('check_database_connection');
            setConnectionStatus(status);
            if (!status.is_connected && lastNotificationState !== false) {
                error('Database Disconnected', {
                    description: status.error_message || 'Lost connection to MongoDB database.',
                    duration: 5000,
                });
                setLastNotificationState(false);
            } else if (status.is_connected && lastNotificationState !== true) {
                setLastNotificationState(true);
            }
        } catch (err) {
            setConnectionStatus({ is_connected: false, error_message: 'Failed to check connection status' });
            if (lastNotificationState !== false) {
                error('Database Error', {
                    description: 'Unable to check database connection status.',
                    duration: 5000,
                });
                setLastNotificationState(false);
            }
        }
    }, [lastNotificationState, error]);

    const attemptReconnection = useCallback(async (): Promise<boolean> => {
        try {
            warning('Attempting Reconnection...', {
                description: 'Trying to reconnect to MongoDB database.',
                duration: 3000,
            });
            const reconnected = await invoke<boolean>('attempt_database_reconnection');
            await checkConnection();
            if (reconnected) setLastNotificationState(true);
            else error('Reconnection Failed', { description: 'Failed to reconnect to MongoDB database.', duration: 5000 });
            return reconnected;
        } catch {
            error('Reconnection Error', { description: 'An error occurred while trying to reconnect.', duration: 5000 });
            return false;
        }
    }, [checkConnection, error, warning]);

    useEffect(() => {
        checkConnection();
        const interval = setInterval(checkConnection, 30000);
        window.addEventListener('focus', checkConnection);
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', checkConnection);
        };
    }, [checkConnection]);

    const value: DatabaseContextType = {
        connectionStatus,
        isConnected: connectionStatus.is_connected,
        checkConnection,
        attemptReconnection,
    };

    return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
};

export const useDatabase = () => {
    const context = useContext(DatabaseContext);
    if (!context) throw new Error('useDatabase must be used within a DatabaseProvider');
    return context;
};