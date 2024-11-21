// import SensorOccupiedIcon from '@mui/icons-material/SensorOccupied';
import { Outlet, Route, Routes } from 'react-router-dom';
import { AppLayout, Dashboard, Home, About } from '../components';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import HomeIcon from '@mui/icons-material/Home';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';

interface RoutesConfProps {
    setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean | null>>;
}
const RoutesConf: React.FC<RoutesConfProps> = ({ }) => {
    return (
        <Routes>
            <Route path="/" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="home" element={<Home />} />
                <Route path="about" element={<About />} />
                <Route path="setting" element={<Outlet />} />
            </Route>
        </Routes>
    );
};

export default RoutesConf;

export const routes = [
    { path: '/', label: 'Dashboard', icon: <DashboardRoundedIcon fontSize="inherit" /> },
    { path: '/home', label: 'Home', icon: <HomeIcon fontSize="inherit" /> },
    { path: '/about', label: 'About', icon: <InfoRoundedIcon fontSize="inherit" /> },
];

export const bottomRoutes = [
    { path: '/setting', label: 'Setting', icon: <SettingsOutlinedIcon fontSize="inherit" /> },
];
