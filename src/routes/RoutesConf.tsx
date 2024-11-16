// src/routes/index.tsx
import { Outlet, Route } from 'react-router-dom';
import { AppLayout, Dashboard, Home, About } from '../components';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import HomeIcon from '@mui/icons-material/Home'; // Adjust the import path as necessary
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';

const RoutesConf = (
    <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />   {/* This is the default route */}
        <Route path="home" element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="setting" element={<Outlet />} />
    </Route>
);

export default RoutesConf;

export const routes = [
    { path: '/', label: 'Dashboard', icon: <DashboardRoundedIcon fontSize="inherit" /> },
    { path: '/home', label: 'Home', icon: <HomeIcon fontSize="inherit" /> },
    { path: '/about', label: 'About', icon: <InfoRoundedIcon fontSize="inherit" /> },
];

export const bottomRoutes = [
    { path: '/setting', label: 'Setting', icon: <SettingsOutlinedIcon fontSize="inherit" /> },
];