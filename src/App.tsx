import "./App.css";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoutesConf from "./routes/RoutesConf";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import Auth_page from "./components/auth/Auth_page";
import { Intro, Login, Signup } from "./components";
import { invoke } from "@tauri-apps/api/core";
import { decryptToken, decryptUser } from "./components/auth/token_secure";
import { applyTheme, themes, ThemeKeys } from "./themes/ThemeToggle"; // Import applyTheme and themes

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
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

    // Apply the saved theme or default to 'light'
    const savedTheme = (localStorage.getItem('theme') as ThemeKeys) || 'light';
    applyTheme(themes[savedTheme]);
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
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