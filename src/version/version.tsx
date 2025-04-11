import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

const VersionDisplay: React.FC = () => {
    const [version, setVersion] = useState('');

    useEffect(() => {
        const fetchVersion = async () => {
            try {
                const appVersion = await invoke<string>('get_version');
                setVersion(appVersion);
            } catch (error) {
                console.error('Error fetching version:', error);
                setVersion('0.1.0'); // Fallback version
            }
        };

        fetchVersion();
    }, []);

    return (
        <div
            className="fixed bottom-0 right-3 text-theme-text opacity-50 text-sm"
            style={{ zIndex: 1000 }}
        >
            © 2024 CosmoSecure • v{version}
        </div>
    );
};

export default VersionDisplay;