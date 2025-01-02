import React, { useEffect, useState } from 'react';

type ThemeKeys = 'light' | 'dark' | 'aqua' | 'forest' | 'vamp';

const themes: Record<ThemeKeys, { [key: string]: string }> = {
    light: {
        '--background-color': '#edf2fb',
        '--text-color': '#292929',
        '--primary-color': '#a5a5a5',
        '--secondary-color': '#cccccc',
        '--accent-color': '#7f7f7f',
    }
    ,
    dark: {
        '--background-color': '#212529',
        '--text-color': '#f8f9fa',
        '--primary-color': '#adb5bd',
        '--secondary-color': '#6c757d',
        '--accent-color': '#495057',
    },
    aqua: {
        '--background-color': '#e0f7fa',
        // '--background-color': '#212529',
        '--text-color': '#006064',
        // '--text-color': '#c2fffe',
        '--primary-color': '#00acc1',
        '--secondary-color': '#00838f',
        '--accent-color': '#4db6ac',
    },
    forest: {
        '--background-color': '#1f2d28',
        '--text-color': '#d0c4a1',
        '--primary-color': '#4a6e56',
        '--accent-color': '#5d7a67',
        '--secondary-color': '#384d44',
    },
    vamp: {
        '--background-color': '#121212',
        '--text-color': '#f1f1f1',
        '--primary-color': '#9b1b30',
        '--accent-color': '#4e0b15',
        '--secondary-color': '#9b3d3d',
    },
};

// Utility to convert hex color to RGBA with desired opacity
const hexToRgba = (hex: string, opacity: number): string => {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Dynamically apply theme with transparency properties
const applyTheme = (theme: { [key: string]: string }) => {
    Object.keys(theme).forEach((key) => {
        const value = theme[key];
        if (value.startsWith('#')) {
            document.documentElement.style.setProperty(key, value);
            // Add transparent variant for this color
            const transparentKey = `${key}-transparent`;
            const transparentValue = hexToRgba(value, 0.90); // Default 85% opacity
            document.documentElement.style.setProperty(transparentKey, transparentValue);
        } else {
            document.documentElement.style.setProperty(key, value);
        }
    });
};

const ThemeToggle: React.FC = () => {
    const [currentTheme, setCurrentTheme] = useState<ThemeKeys>('light');

    useEffect(() => {
        const savedTheme = (localStorage.getItem('theme') as ThemeKeys) || 'light';
        setCurrentTheme(savedTheme);
        applyTheme(themes[savedTheme]);
    }, []);

    const selectTheme = (theme: ThemeKeys) => {
        setCurrentTheme(theme);
        applyTheme(themes[theme]);
        localStorage.setItem('theme', theme);
    };

    return (
        <div className="flex space-x-4">
            {Object.keys(themes).map((themeKey) => (
                <div
                    key={themeKey}
                    onClick={() => selectTheme(themeKey as ThemeKeys)}
                    className={`p-4 rounded cursor-pointer ${currentTheme === themeKey ? 'border-4 border-theme-primary' : ''
                        }`}
                    style={{
                        backgroundColor: `var(--background-color)`,
                        color: `var(--text-color)`,
                    }}
                >
                    {themeKey.charAt(0).toUpperCase() + themeKey.slice(1)} Mode
                </div>
            ))}
        </div>
    );
};

export default ThemeToggle;
