import "./App.css";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoutesConf from "./routes/RoutesConf";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import Auth_page from "./components/auth/Auth_page";
import { Intro, Login, Signup } from "./components";
import { invoke } from "@tauri-apps/api/core";
import { decryptToken, decryptUser } from "./components/auth/token_secure";
import { applyTheme, themes, ThemeKeys, CosmicLoader } from "./themes/"; // Import applyTheme and themes
import { Toaster } from 'sonner'; // Import Toaster from sonner
import { NavigationProvider } from './contexts/';

const TEST_MODE = true;  // Set to false in production

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if ((window as any).__TAURI__) {
      getCurrentWindow().setContentProtected(true).catch(console.error);
    }

    const checkAuthentication = async () => {
      try {
        if (TEST_MODE) {
          // Simulate loading delay for testing
          await new Promise(resolve => setTimeout(resolve, 4000));
        }

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

    // Disable right-click context menu
    // const handleContextMenu = (e: MouseEvent) => {
    //   e.preventDefault();
    // };

    // document.addEventListener('contextmenu', handleContextMenu);

    // return () => {
    //   document.removeEventListener('contextmenu', handleContextMenu);
    // };
  }, []);

  if (isAuthenticated === null) {
    return <div className="flex justify-center items-center h-screen bg-transparent">
      <CosmicLoader />;
    </div>
  }

  return (
    <NavigationProvider>
      <Router>
        <Routes>
          {isAuthenticated ? (
            <>
              <Route path="/*" element={<RoutesConf setIsAuthenticated={setIsAuthenticated} />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Auth_page />}>
                <Route index element={<Intro />} />
                <Route path="login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
                <Route path="signup" element={<Signup />} />
              </Route>
            </>
          )}
        </Routes>
        <Toaster richColors position="top-center" theme="dark"
          toastOptions={{
            style: {
              fontSize: '1rem',
              padding: '1rem',
              marginTop: '1rem',
              color: '#f7fafc',
              borderRadius: '0.5rem',
              boxShadow: '0 0 0.5rem rgba(0, 0, 0, 0.1)',
              zIndex: 9999
            }
          }}
        />
      </Router>
    </NavigationProvider>
  );
}

export default App;