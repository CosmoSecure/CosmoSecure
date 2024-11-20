// src/routes/index.tsx
import { Outlet, Route } from 'react-router-dom';
import { AppLayout, Dashboard, Home, About, Signup } from '../components';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import HomeIcon from '@mui/icons-material/Home'; // Adjust the import path as necessary
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';

// import LoginIcon from '@mui/icons-material/Login';
import SensorOccupiedIcon from '@mui/icons-material/SensorOccupied';

const RoutesConf = (
    <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />   {/* This is the default route */}
        <Route path="home" element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="setting" element={<Outlet />} />
        {/* <Route path="login" element={<Login />} /> */}
        <Route path="signup" element={<Signup />} />
    </Route>
);

export default RoutesConf;

export const routes = [
    { path: '/', label: 'Dashboard', icon: <DashboardRoundedIcon fontSize="inherit" /> },
    { path: '/home', label: 'Home', icon: <HomeIcon fontSize="inherit" /> },
    { path: '/about', label: 'About', icon: <InfoRoundedIcon fontSize="inherit" /> },
];

export const bottomRoutes = [
    // { path: '/login', label: 'Login', icon: <LoginIcon fontSize="inherit" /> },
    { path: '/signup', label: 'Signup', icon: <SensorOccupiedIcon fontSize="inherit" /> },
    { path: '/setting', label: 'Setting', icon: <SettingsOutlinedIcon fontSize="inherit" /> },
];