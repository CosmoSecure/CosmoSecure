import "./App.css";
import "./windows-fixes.css"; // Windows-specific fixes for scrollbars and UI
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoutesConf from "./routes/RoutesConf";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import Auth_page from "./components/auth/Auth_page";
import { Intro, Login } from "./components";
import { invoke } from "@tauri-apps/api/core";
import { decryptToken, decryptUser } from "./components/auth/token_secure";
import { applyTheme, themes, ThemeKeys, CosmicLoader } from "./themes/"; // Import applyTheme and themes
import { Toaster } from 'sonner'; // Import Toaster from sonner
import { NavigationProvider, NotificationProvider, UserProvider, UpdateProvider, DatabaseProvider } from './contexts/';
import { PlatformUtils } from './utils/platformUtils'; // Import platform utils

const TEST_MODE = false;  // Set to false in production

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if ((window as any).__TAURI__) {
      getCurrentWindow().setContentProtected(true).catch(console.error);
    }

    // Initialize platform-specific fixes
    PlatformUtils.initPlatformFixes();

    const checkAuthentication = async () => {
      try {
        if (TEST_MODE) {
          // Simulate loading delay for testing
          await new Promise(resolve => setTimeout(resolve, 4000));
        }

        // Fast authentication check with timeout to prevent hanging
        const authPromise = invoke<[string, string]>('load_token_command');
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Authentication check timeout')), 3000);
        });
        
        const [encryptedToken, encryptedUser] = await Promise.race([authPromise, timeoutPromise]);
        
        if (encryptedToken && encryptedUser) {
          sessionStorage.setItem('token', encryptedToken);
          sessionStorage.setItem('user', encryptedUser);
          const token = decryptToken();
          const user = decryptUser();
          if (token && user) {
            setIsAuthenticated(true);
          } else {
            console.log('Token/user decryption failed, redirecting to login');
            setIsAuthenticated(false);
          }
        } else {
          console.log('No valid token/user found, redirecting to login');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Failed to load token:", error);
        // Clear any potentially corrupted data
        localStorage.clear();
        sessionStorage.clear();
        setIsAuthenticated(false);
      }
    };

    checkAuthentication();

    // Listen for logout events
    const handleLogoutEvent = () => {
      console.log('Logout event received, setting authentication to false');
      setIsAuthenticated(false);
    };

    window.addEventListener('userLogout', handleLogoutEvent);

    // Apply the saved theme or default to 'light'
    const savedTheme = (localStorage.getItem('theme') as ThemeKeys) || 'light';
    applyTheme(themes[savedTheme]);

    // Cleanup
    return () => {
      window.removeEventListener('userLogout', handleLogoutEvent);
    };
  }, []);

  if (isAuthenticated === null) {
    return <div className="flex justify-center items-center h-screen bg-transparent">
      <CosmicLoader />;
    </div>
  }

  return (
    <UserProvider>
      <NotificationProvider>
        <DatabaseProvider>
          <NavigationProvider>
            <UpdateProvider>
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
            </UpdateProvider>
          </NavigationProvider>
        </DatabaseProvider>
      </NotificationProvider>
    </UserProvider>
  );
}

export default App;