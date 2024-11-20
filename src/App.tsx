import "./App.css";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoutesConf from "./routes/RoutesConf";
import { getCurrentWindow } from "@tauri-apps/api/window";
import React from "react";
import Login from "./components/auth/Login"; // Adjust the import path as necessary

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
          RoutesConf
        ) : (
          <Route path="*" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
