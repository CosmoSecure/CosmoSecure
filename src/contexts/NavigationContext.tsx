import React, { createContext, useContext, useState, useEffect } from 'react';
import type { NavigationStyle } from '../types/navigation';

interface NavigationContextType {
    navStyle: NavigationStyle;
    setNavStyle: (style: NavigationStyle) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [navStyle, setNavStyle] = useState<NavigationStyle>(() => {
        const saved = localStorage.getItem('navStyle');
        return (saved as NavigationStyle) || 'default';
    });

    useEffect(() => {
        localStorage.setItem('navStyle', navStyle);
    }, [navStyle]);

    return (
        <NavigationContext.Provider value={{ navStyle, setNavStyle }}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};