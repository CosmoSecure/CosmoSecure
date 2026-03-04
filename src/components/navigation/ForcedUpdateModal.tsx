import React from 'react';
import { AlertCircle, Download, ExternalLink } from 'lucide-react';
import { UpdateRelease } from '../../contexts/UpdateContext';

interface ForcedUpdateModalProps {
    release: UpdateRelease;
    isWindows: boolean;
    onDownload: () => void;
    onVisitRelease: () => void;
    isDownloading?: boolean;
    downloadProgress?: number;
}

const ForcedUpdateModal: React.FC<ForcedUpdateModalProps> = ({
    release,
    isWindows,
    onDownload,
    onVisitRelease,
    isDownloading = false,
    downloadProgress = 0,
}) => {
    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
            {/* Blurred background overlay */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-md"
                style={{ backdropFilter: 'blur(10px)', borderRadius: '16px' }}
            />

            {/* Modal content */}
            <div className="relative z-10 bg-theme-background border-2 border-red-500 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-theme-accent rounded-full backdrop-blur-sm">
                            <AlertCircle className="w-6 h-6 text-theme-text animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-theme-text">
                                Update Required
                            </h2>
                            <p className="text-red-100 text-sm">
                                Critical security update available
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-6 space-y-4">
                    <div className="space-y-2">
                        <p className="text-theme-text font-semibold">
                            Your application version is outdated
                        </p>
                        <p className="text-theme-text text-sm">
                            For security and stability reasons, you must update to continue using CosmoSecure.
                        </p>
                    </div>

                    {/* Version info */}
                    <div className="bg-theme-accent rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-theme-text text-sm">New Version:</span>
                            <span className="text-theme-text font-mono font-bold">
                                {release.version}
                            </span>
                        </div>
                        {release.published_at && (
                            <div className="flex justify-between items-center">
                                <span className="text-theme-text text-sm">Released:</span>
                                <span className="text-theme-text text-sm">
                                    {new Date(release.published_at).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                        {release.size && (
                            <div className="flex justify-between items-center">
                                <span className="text-theme-text text-sm">Size:</span>
                                <span className="text-theme-text text-sm">
                                    {formatFileSize(release.size)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Warning message */}
                    <div className="flex gap-2 items-start p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <p className="text-theme-text text-sm">
                            You cannot use the application until you update. This is required for security purposes.
                        </p>
                    </div>

                    {/* Download Progress */}
                    {isDownloading && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-theme-text">Downloading...</span>
                                <span className="text-theme-text font-mono font-bold">
                                    {Math.round(downloadProgress)}%
                                </span>
                            </div>
                            <div className="w-full bg-theme-accent rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-green-600 to-green-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${downloadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer with action buttons */}
                <div className="px-6 py-4 bg-theme-accent border-t border-theme-accent">
                    {isWindows ? (
                        <button
                            onClick={onVisitRelease}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 
                                bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 
                                text-theme-text font-semibold rounded-lg transition-all duration-200 
                                shadow-lg hover:shadow-xl active:scale-95"
                        >
                            <ExternalLink className="w-5 h-5" />
                            Visit Release Page
                        </button>
                    ) : (
                        <button
                            onClick={onDownload}
                            disabled={isDownloading}
                            className={`w-full flex items-center justify-center gap-2 px-6 py-3 
                                bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 
                                text-theme-text font-semibold rounded-lg transition-all duration-200 
                                shadow-lg hover:shadow-xl active:scale-95
                                ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Download className={`w-5 h-5 ${isDownloading ? 'animate-pulse' : ''}`} />
                            {isDownloading ? 'Downloading...' : 'Download and Install Update'}
                        </button>
                    )}

                    <p className="text-center text-theme-text text-xs mt-3">
                        {isWindows
                            ? 'Download and install the update manually from GitHub'
                            : 'The app will restart after installation'
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default ForcedUpdateModal;
