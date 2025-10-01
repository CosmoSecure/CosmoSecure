import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';

export type ThemeKeys = 'light' | 'dark' | 'aqua' | 'forest' | 'vamp';

export const themes: Record<ThemeKeys, { [key: string]: string }> = {
    light: {
        '--background-color': '#eff2f5', // Use Azure #F0FFFF
        '--text-color': '#262626',
        '--primary-color': '#9da4af',
        '--secondary-color': '#d5d8dd',
        '--accent-color': '#a3afc2',
    },
    dark: {
        '--background-color': '#0d0d0d',
        '--text-color': '#f2f2f2',
        '--primary-color': '#808080',
        '--secondary-color': '#2c2c2c',
        '--accent-color': '#55585e',
    },
    aqua: {
        '--background-color': '#e0fbfb',
        '--text-color': '#003333',
        '--primary-color': '#00b3b3',
        '--secondary-color': '#80ffff',
        '--accent-color': '#2dd2d2',
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
export const applyTheme = (theme: { [key: string]: string }) => {
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
                <Button
                    key={themeKey}
                    onClick={() => selectTheme(themeKey as ThemeKeys)}
                    variant={currentTheme === themeKey ? 'contained' : 'outlined'}
                    sx={{
                        backgroundColor: `var(--background-color)`,
                        color: `var(--text-color)`,
                        padding: '12px 24px', // Increase padding
                        fontSize: '16px', // Increase font size
                        '&:hover': {
                            backgroundColor: `var(--accent-color)`,
                            color: `var(--background-color)`,
                        },
                        '&:active': {
                            scale: 0.95,
                        }
                    }}
                >
                    {themeKey.charAt(0).toUpperCase() + themeKey.slice(1)} Mode
                </Button>
            ))}
        </div>
    );
};

export default ThemeToggle;
