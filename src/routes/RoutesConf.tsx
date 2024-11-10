// src/routes/index.tsx
import { Outlet, Route } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import Home from '../components/Home';
import About from '../components/About';

const RoutesConf = (
    <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />   {/* This is the default route */}
        <Route path="home" element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Outlet />} />
    </Route>
);

export default RoutesConf;
