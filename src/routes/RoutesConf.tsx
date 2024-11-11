// src/routes/index.tsx
import { Outlet, Route } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import Home from '../components/Home';
import Dashboard from '../components/Dashboard';
import About from '../components/About';

const RoutesConf = (
    <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />   {/* This is the default route */}
        <Route path="home" element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Outlet />} />
    </Route>
);

export default RoutesConf;
export const routes = [
    { path: '/', label: 'Dashboard' },
    { path: '/home', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
];