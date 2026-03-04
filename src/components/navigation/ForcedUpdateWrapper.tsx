import React, { useEffect, useState } from 'react';
import { useUpdate } from '../../contexts/UpdateContext';
import ForcedUpdateModal from './ForcedUpdateModal';
import { invoke } from '@tauri-apps/api/core';
import { GITHUB_URLS } from '../../constants/urls';

interface ForcedUpdateWrapperProps {
    children: React.ReactNode;
}

const ForcedUpdateWrapper: React.FC<ForcedUpdateWrapperProps> = ({ children }) => {
    const {
        isForcedUpdate,
        isUpdateAvailable,
        latestRelease,
        isWindows,
        downloadAndInstallUpdate,
        isDownloading,
        downloadProgress,
    } = useUpdate();

    const [showForcedModal, setShowForcedModal] = useState(false);

    useEffect(() => {
        // Show modal if forced update is required and update is available
        if (isForcedUpdate && isUpdateAvailable && latestRelease) {
            setShowForcedModal(true);
        } else {
            setShowForcedModal(false);
        }
    }, [isForcedUpdate, isUpdateAvailable, latestRelease]);

    const handleDownload = async () => {
        try {
            await downloadAndInstallUpdate();
            // After download completes, clear the tracker
            await invoke('clear_update_tracker');
            // Modal will stay visible until app restarts
        } catch (err) {
            console.error('Failed to download update:', err);
        }
    };

    const handleVisitRelease = async () => {
        if (latestRelease) {
            // For Windows, open the GitHub release page
            const repoUrl = GITHUB_URLS.RELEASES;

            try {
                await invoke('open_url', { url: repoUrl });
            } catch (err) {
                console.error('Failed to open URL:', err);
                // Fallback to window.open
                window.open(repoUrl, '_blank');
            }
        }
    };

    return (
        <>
            {showForcedModal && latestRelease ? (
                <>
                    <ForcedUpdateModal
                        release={latestRelease}
                        isWindows={isWindows}
                        onDownload={handleDownload}
                        onVisitRelease={handleVisitRelease}
                        isDownloading={isDownloading}
                        downloadProgress={downloadProgress}
                    />
                    {/* Render children behind the modal but make them non-interactive */}
                    <div className="pointer-events-none opacity-50 blur-sm">
                        {children}
                    </div>
                </>
            ) : (
                children
            )}
        </>
    );
};

export default ForcedUpdateWrapper;
