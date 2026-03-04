import React from 'react';
import { useUpdate, formatReleaseDate, formatFileSize } from '../../contexts/UpdateContext';
import { Download, X, AlertCircle, CheckCircle, Clock, ArrowUpCircle } from 'lucide-react';

interface UpdateNotificationProps {
    isExpanded: boolean;
    onDismiss?: () => void;
}

// Helper function to extract asset name from download URL
const getAssetNameFromUrl = (downloadUrl: string): string => {
    try {
        const url = new URL(downloadUrl);
        const pathSegments = url.pathname.split('/');
        return pathSegments[pathSegments.length - 1] || 'Unknown asset';
    } catch {
        // Fallback to simple split if URL parsing fails
        const segments = downloadUrl.split('/');
        return segments[segments.length - 1] || 'Unknown asset';
    }
};

const UpdateNotification: React.FC<UpdateNotificationProps> = ({
    isExpanded,
    onDismiss
}) => {
    const {
        isUpdateAvailable,
        latestRelease,
        isDownloading,
        downloadProgress,
        error,
        downloadAndInstallUpdate,
        dismissUpdate,
        resetError,
        isWindows
    } = useUpdate();

    // Don't render if no update is available
    if (!isUpdateAvailable || !latestRelease) {
        return null;
    }

    const handleInstall = async () => {
        resetError();
        await downloadAndInstallUpdate();
    };

    const handleDismiss = () => {
        dismissUpdate(false); // Temporary dismissal - will show again on app restart
        onDismiss?.();
    };

    // Collapsed state - show only update button with tooltip
    if (!isExpanded) {
        return (
            <div className="relative group mb-2">
                <button
                    onClick={handleInstall}
                    disabled={isDownloading}
                    className={`flex items-center justify-center text-theme-text h-[40px] w-[40px] 
                        rounded-md transition-all duration-300 shadow-md
                        ${isDownloading
                            ? 'bg-yellow-500 cursor-not-allowed animate-pulse'
                            : 'bg-green-500 hover:bg-green-600 hover:scale-110 active:scale-95'
                        }`}
                >
                    {isDownloading ? (
                        <Clock className="w-5 h-5 animate-spin" />
                    ) : (
                        <ArrowUpCircle className="w-5 h-5" />
                    )}
                </button>

                {/* Tooltip */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2
                    bg-theme-background border border-theme-accent rounded-md
                    text-theme-text text-sm whitespace-nowrap opacity-0 scale-95
                    group-hover:opacity-100 group-hover:scale-100
                    pointer-events-none transform origin-left z-[9999]
                    transition-all duration-300 shadow-lg">
                    <div className="flex items-center gap-2">
                        <ArrowUpCircle className="w-4 h-4 text-green-500" />
                        <div>
                            <div className="font-medium">Update Available</div>
                            <div className="text-xs opacity-75">{latestRelease.version}</div>
                            <div className="text-xs font-mono font-semibold">{getAssetNameFromUrl(latestRelease.download_url)}</div>
                            {latestRelease.size && (
                                <div className="text-xs opacity-75">{formatFileSize(latestRelease.size)}</div>
                            )}
                            {isWindows && (
                                <div className="text-xs opacity-75 text-blue-400">Click to open GitHub</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Expanded state - show full notification box
    return (
        <div className="relative group mb-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 
            border border-green-500/30 rounded-lg p-4 shadow-lg backdrop-blur-sm">

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <ArrowUpCircle className="w-5 h-5 text-green-500" />
                    <h3 className="text-theme-text font-bold text-lg">Update Available</h3>
                </div>
                <button
                    onClick={handleDismiss}
                    className="text-theme-text hover:text-theme-accent transition-colors duration-200"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Version Info */}
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-theme-text font-medium">Version {latestRelease.version}</span>
                    {latestRelease.is_prerelease && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                            Pre-release
                        </span>
                    )}
                </div>
                <div className="text-theme-text-transparent text-xs">
                    Released {formatReleaseDate(latestRelease.published_at)}
                    {latestRelease.size && (
                        <span className="ml-2">• {formatFileSize(latestRelease.size)}</span>
                    )}
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md 
                    flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="text-red-400 text-sm">{error}</span>
                    <button
                        onClick={resetError}
                        className="ml-auto text-red-400 hover:text-red-300"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Progress Bar - Only show for non-Windows platforms */}
            {isDownloading && !isWindows && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Download className="w-4 h-4 text-blue-400 animate-bounce" />
                        <span className="text-theme-text text-sm">Downloading update...</span>
                        <span className="text-theme-text-transparent text-sm">{downloadProgress.toFixed(2)}%</span>
                    </div>
                    <div className="w-full bg-theme-background/30 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full 
                                transition-all duration-300 ease-out"
                            style={{ width: `${downloadProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleInstall}
                    disabled={isDownloading}
                    className={`flex items-center justify-center gap-2 py-1 rounded-md font-medium
                        transition-all duration-200 flex-1
                        ${isDownloading
                            ? 'bg-yellow-500/20 text-yellow-400 cursor-not-allowed'
                            : 'bg-green-500 hover:bg-green-600 text-theme-text active:scale-95'
                        }`}
                >
                    {isDownloading ? (
                        isWindows ? (
                            <>
                                <CheckCircle className="w-4 h-4 mb-1 text-sm font-mono font-semibold" />
                                Opened in Browser
                            </>
                        ) : (
                            <>
                                <Clock className="w-4 h-4 mb-1 animate-spin" />
                                Installing...
                            </>
                        )
                    ) : (
                        <>
                            <Download className="w-4 h-4 mb-1 text-sm font-mono font-semibold" />
                            {isWindows ? 'Download from GitHub' : 'Update'}
                        </>
                    )}
                </button>
            </div>

            {/* Success indicator */}
            {!isDownloading && downloadProgress === 100 && !isWindows && (
                <div className="mt-3 flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Update installed! Application will restart...</span>
                </div>
            )}

            {/* Hover trigger for detailed info */}
            <div className="absolute top-12 right-3 group/info">
                <div className="w-6 h-w-5 rounded-full bg-theme-accent bg-opacity-20 flex items-center justify-center cursor-help hover:bg-opacity-40 transition-colors">
                    <span className="text-sm text-theme-text font-bold pt-1">i</span>
                </div>

                {/* Detailed info tooltip */}
                <div className="absolute top-8 px-3 py-2
                        bg-theme-background border border-theme-accent rounded-md
                        text-theme-text text-sm whitespace-nowrap opacity-0 scale-95
                        group-hover/info:opacity-100 group-hover/info:scale-100
                        pointer-events-none transform origin-top-right z-[9999]
                        transition-all duration-300 shadow-lg">
                    <div className="flex items-center gap-2">
                        <ArrowUpCircle className="w-4 h-4 text-green-500" />
                        <div>
                            <div className="text-sm font-mono font-semibold">{getAssetNameFromUrl(latestRelease.download_url)}</div>
                            <div className="text-xs opacity-75">Version: {latestRelease.version}</div>
                            {latestRelease.size && (
                                <div className="text-xs opacity-75">Size: {formatFileSize(latestRelease.size)}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateNotification;
