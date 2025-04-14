import React from 'react';
import { useNavigation } from '../contexts/';
import { DefaultNav, HoverNav, ButtonNav } from './navigation/';

const Navigate: React.FC<{ toggleProfileVisibility: () => void }> = (props) => {
    const { navStyle } = useNavigation();

    switch (navStyle) {
        case 'compact':
            return <HoverNav {...props} />;
        case 'expanded':
            return <ButtonNav {...props} />;
        default:
            return <DefaultNav {...props} />;
    }
};

export default Navigate;