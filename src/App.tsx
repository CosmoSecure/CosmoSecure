import "./App.css";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoutesConf from "./routes/RoutesConf";
import { getCurrentWindow } from "@tauri-apps/api/window";
import React from "react";
import Auth_page from "./components/auth/Auth_page";
import { Intro, Login, Signup } from "./components";
import { invoke } from "@tauri-apps/api/core";
import { decryptToken, decryptUser } from "./components/auth/token_secure";
import { ThemeToggle } from "./themes"; // Import ThemeToggle

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if ((window as any).__TAURI__) {
      getCurrentWindow().setContentProtected(true).catch(console.error);
    }

    const checkAuthentication = async () => {
      try {
        const [encryptedToken, encryptedUser] = await invoke<[string, string]>('load_token_command');
        if (encryptedToken && encryptedUser) {
          sessionStorage.setItem('token', encryptedToken);
          sessionStorage.setItem('user', encryptedUser);
          const token = decryptToken();
          const user = decryptUser();
          if (token && user) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Failed to load token:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuthentication();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="p-4">
        <ThemeToggle /> {/* Add ThemeToggle button */}
      </div>
      <Routes>
        {isAuthenticated ? (
          <Route path="/*" element={<RoutesConf setIsAuthenticated={setIsAuthenticated} />} />
        ) : (
          <Route path="/" element={<Auth_page />}>
            <Route index element={<Intro />} />
            <Route path="login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="signup" element={<Signup />} />
          </Route>
        )}
      </Routes>
    </Router>
  );
}

export default App;