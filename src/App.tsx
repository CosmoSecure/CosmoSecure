import "./App.css";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoutesConf from "./routes/RoutesConf";
import { getCurrentWindow } from "@tauri-apps/api/window";
import React from "react";
import Auth_page from "./components/auth/Auth_page";
import { Login, Signup } from "./components";

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if ((window as any).__TAURI__) {
      getCurrentWindow().setContentProtected(true).catch(console.error);
    }

    const checkAuthentication = () => {
      const token = sessionStorage.getItem('token');
      setIsAuthenticated(!!token);
    };

    checkAuthentication();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Show a loading indicator while checking authentication
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {isAuthenticated ? (
          <RoutesConf setIsAuthenticated={setIsAuthenticated} />
        ) : (
          <Route path="*" element={<Auth_page />}>
            <Route index element={<Login setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="signup" element={<Signup />} />
            <Route path="login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          </Route>
        )}
      </Routes>
    </Router>
  );
}

export default App;