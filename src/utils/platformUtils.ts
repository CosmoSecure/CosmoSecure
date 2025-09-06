import { invoke } from '@tauri-apps/api/core';

/**
 * Platform detection utility for Tauri apps
 */
export class PlatformUtils {
    private static _platform: string | null = null;

    /**
     * Get the current platform
     */
    static async getPlatform(): Promise<string> {
        if (this._platform) {
            return this._platform;
        }

        try {
            this._platform = await invoke<string>('get_platform');
            return this._platform;
        } catch (error) {
            // Fallback to user agent detection
            const userAgent = navigator.userAgent;
            if (userAgent.includes('Win')) {
                this._platform = 'windows';
            } else if (userAgent.includes('Mac')) {
                this._platform = 'macos';
            } else {
                this._platform = 'linux';
            }
            return this._platform;
        }
    }

    /**
     * Check if running on Windows
     */
    static async isWindows(): Promise<boolean> {
        const platform = await this.getPlatform();
        return platform.toLowerCase().includes('windows') || platform.toLowerCase().includes('win');
    }

    /**
     * Check if running on macOS
     */
    static async isMacOS(): Promise<boolean> {
        const platform = await this.getPlatform();
        return platform.toLowerCase().includes('darwin') || platform.toLowerCase().includes('mac');
    }

    /**
     * Check if running on Linux
     */
    static async isLinux(): Promise<boolean> {
        const platform = await this.getPlatform();
        return platform.toLowerCase().includes('linux');
    }

    /**
     * Apply Windows-specific fixes
     */
    static applyWindowsFixes(): void {
        if (typeof document === 'undefined') return;

        // Add Windows class to body for CSS targeting
        document.body.classList.add('platform-windows');

        // Force scrollbar styling for Windows
        const style = document.createElement('style');
        style.textContent = `
            /* Force transparent scrollbar tracks on Windows */
            .platform-windows *::-webkit-scrollbar-track {
                background: transparent !important;
            }
            
            .platform-windows *::-webkit-scrollbar-corner {
                background: transparent !important;
            }

            /* Ensure all overflow elements have proper scrollbar styling */
            .platform-windows .overflow-y-auto::-webkit-scrollbar-track,
            .platform-windows .overflow-x-auto::-webkit-scrollbar-track,
            .platform-windows .overflow-auto::-webkit-scrollbar-track {
                background: transparent !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Initialize platform-specific fixes
     */
    static async initPlatformFixes(): Promise<void> {
        try {
            const isWin = await this.isWindows();

            if (isWin) {
                this.applyWindowsFixes();
                console.log('Applied Windows-specific UI fixes');
            }
        } catch (error) {
            console.warn('Could not detect platform for UI fixes:', error);
            // Apply Windows fixes as fallback on unknown platforms
            this.applyWindowsFixes();
        }
    }
}
