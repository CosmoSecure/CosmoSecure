import './scroll.css';
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { ThemeToggle } from "../themes";
import { decryptUser } from './auth/token_secure';
import { VisibilityOffTwoToneIcon, VisibilityTwoToneIcon } from './auth/passCSS';
import { reloadApp_Update } from "./reloadApp_Update";
import { toast } from 'sonner';
import { useNavigation } from '../contexts/';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";

function debounce(func: (...args: any[]) => void, wait: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

const Settings = () => {
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    // const [usernameChangeCount, setUsernameChangeCount] = useState(0);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [newPasswordVisible, setNewPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [passwordsMatch, setPasswordsMatch] = useState(true);
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });
    const [deleteUsername, setDeleteUsername] = useState('');
    const [deletePassword, setDeletePassword] = useState('');
    const { navStyle, setNavStyle } = useNavigation();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [confirmationText, setConfirmationText] = useState("");

    const toggleDropdown = (dropdownName: string) => {
        setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
    };

    const stopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const checkUsernameAvailability = async (username: string) => {
        if (!username) {
            setUsernameAvailable(null);
            return;
        }
        try {
            const available = await invoke<boolean>("check_username_availability", { username });
            setUsernameAvailable(available);
        } catch (error) {
            console.error("Error checking username availability:", error);
        }
    };

    const debouncedCheckUsernameAvailability = debounce(checkUsernameAvailability, 300);

    useEffect(() => {
        debouncedCheckUsernameAvailability(newUsername);
    }, [newUsername]);

    useEffect(() => {
        setPasswordsMatch(newPassword === confirmPassword);
    }, [newPassword, confirmPassword]);

    useEffect(() => {
        const checkPasswordStrength = async (password: string) => {
            try {
                const result = await invoke<{ score: number, feedback: string }>('check_password_strength', { password });
                setPasswordStrength(result);
            } catch (error) {
                console.error('Failed to check password strength:', error);
            }
        };

        if (newPassword) {
            checkPasswordStrength(newPassword);
        } else {
            setPasswordStrength({ score: 0, feedback: '' });
        }
    }, [newPassword]);

    const handleUpdateNameUsername = async (e: React.FormEvent) => {
        e.preventDefault();
        if (usernameAvailable === false) {
            alert("Username is already taken. Please choose a unique username.");
            return;
        }
        try {
            const user = decryptUser();
            console.log("Decrypted user data:", user); // Print decrypted user data
            if (user) {
                const args = { userId: user.ui, newName: newName || null, newUsername: newUsername || null };
                console.log("Arguments passed to invoke:", args); // Print arguments passed to invoke
                await invoke("update_name_username", args);
                alert("Name and/or Username updated successfully!");
                await reloadApp_Update(user.ui);

                // Show notification to relogin
                toast('Changes applied. Please relogin to apply changes.', {
                    action: {
                        label: 'Relogin',
                        onClick: async () => {
                            await invoke('delete_config');
                        },
                    },
                });
            } else {
                console.error("Failed to decrypt user data");
            }
        } catch (error) {
            console.error("Error updating name and/or username:", error);
        }
    };


    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwordsMatch) {
            toast.error("New password and confirm password do not match.", {
                style: {
                    background: '#f8d7da',
                    color: '#721c24',
                    border: '1px solid #f5c6cb',
                    borderRadius: '8px',
                    padding: '16px',
                    fontSize: '16px',
                },
                icon: '❌',
            });
            return;
        }
        try {
            const user = decryptUser();
            if (user) {
                const args = { userId: user.ui, currentPassword: currentPassword, newPassword: newPassword };
                const response = await invoke<string>("update_user_password", args);
                if (response === "New password cannot be the same as the current password.") {
                    toast.error("New password cannot be the same as the current password.", {
                        style: {
                            background: '#f8d7da',
                            color: '#721c24',
                            border: '1px solid #f5c6cb',
                            borderRadius: '8px',
                            padding: '16px',
                            fontSize: '16px',
                        },
                        icon: '❌',
                    });
                    return;
                }
                // toast.success("Password updated successfully!", {
                //     style: {
                //         background: '#d4edda',
                //         color: '#155724',
                //         border: '1px solid #c3e6cb',
                //         borderRadius: '8px',
                //         padding: '16px',
                //         fontSize: '16px',
                //     },
                //     icon: '✅',
                // });
                toast('Password updated successfully! Changes applied. Please relogin to apply changes.', {
                    action: {
                        label: 'Relogin',
                        onClick: async () => {
                            await invoke('delete_config');
                        },
                    },
                    style: {
                        background: '#d4edda',
                        color: '#155724',
                        border: '1px solid #c3e6cb',
                        borderRadius: '8px',
                        padding: '16px',
                        fontSize: '16px',
                    },
                    // icon: '🔄',
                    icon: '✅',
                });
            } else {
                console.error("Failed to decrypt user data");
            }
        } catch (error) {
            console.error("Error updating password:", error);
            toast.error(`Error updating password: ${error}`, {
                style: {
                    background: '#f8d7da',
                    color: '#721c24',
                    border: '1px solid #f5c6cb',
                    borderRadius: '8px',
                    padding: '16px',
                    fontSize: '16px',
                },
                icon: '❌',
            });
        }
    };

    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();

        if (confirmationText.toLowerCase() !== "delete") {
            toast.error("You must type 'delete' to confirm account deletion.");
            return;
        }

        try {
            const args = { username: deleteUsername, password: deletePassword };
            const response = await invoke<string>("user_delete", args);

            if (response === "Invalid credentials.") {
                toast.error("Invalid username or password.", {
                    style: {
                        background: '#f8d7da',
                        color: '#721c24',
                        border: '1px solid #f5c6cb',
                        borderRadius: '8px',
                        padding: '16px',
                        fontSize: '16px',
                    },
                    icon: '❌',
                });
                return;
            }
            toast.success("Account deleted successfully!", {
                style: {
                    background: '#d4edda',
                    color: '#155724',
                    border: '1px solid #c3e6cb',
                    borderRadius: '8px',
                    padding: '16px',
                    fontSize: '16px',
                },
                icon: '✅',
            });
            (async () => {
                await invoke('delete_config');
            })();
        } catch (error) {
            console.error("Error deleting account:", error);
            toast.error(`Error deleting account: ${error}`, {
                style: {
                    background: '#f8d7da',
                    color: '#721c24',
                    border: '1px solid #f5c6cb',
                    borderRadius: '8px',
                    padding: '16px',
                    fontSize: '16px',
                },
                icon: '❌',
            });
        } finally {
            setIsDeleteModalOpen(false);
            setConfirmationText("");
        }
    };

    const openDeleteModal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deleteUsername || !deletePassword) {
            toast.error("Please fill in both username and password.");
            return;
        }
        setIsDeleteModalOpen(true);
    };

    const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);
    const toggleNewPasswordVisibility = () => setNewPasswordVisible(!newPasswordVisible);
    const toggleConfirmPasswordVisibility = () => setConfirmPasswordVisible(!confirmPasswordVisible);

    // Function to handle opening external links
    const handleExternalLink = async (url: string) => {
        try {
            await invoke('open_url', { url });
            console.log(`Opened ${url} in the default browser.`);
        } catch (err) {
            console.error('Failed to open URL:', err);
        }
    };

    // Password Strength Color
    const getPasswordStrengthColor = (score: number) => {
        switch (score) {
            case 0:
                return 'red';
            case 1:
                return 'orange';
            case 2:
                return 'yellow';
            case 3:
                return 'lightgreen';
            case 4:
                return 'green';
            default:
                return 'gray';
        }
    };

    const NavigationPreview = ({ type }: { type: 'default' | 'compact' | 'expanded' }) => {
        const commonIconClass = "text-theme-text text-lg";

        switch (type) {
            case 'default':
                return (
                    <div className="flex flex-col gap-2 items-center">
                        <div className="relative w-24 h-30 bg-theme-background-transparent rounded-md p-1 flex items-start gap-2">
                            <div className="w-10 flex flex-col gap-2">
                                <div className="w-full h-8 bg-theme-accent-transparent rounded flex items-center justify-center">
                                    <span className={commonIconClass}>🏠</span>
                                </div>
                                <div className="w-full h-8 bg-theme-accent-transparent rounded flex items-center justify-center">
                                    <span className={commonIconClass}>📊</span>
                                </div>
                                <div className="w-full h-8 bg-theme-accent-transparent rounded flex items-center justify-center">
                                    <span className={commonIconClass}>⚙️</span>
                                </div>
                            </div>
                            <div className="w-12 h-8 bg-theme-accent-transparent rounded flex items-center justify-center text-xs">
                                Home
                            </div>
                        </div>
                        <span className="text-sm font-medium">Standard Mode</span>
                    </div>
                );

            case 'compact':
                return (
                    <div className="flex flex-col gap-2 items-center">
                        <div className="w-12 h-30 bg-theme-background-transparent rounded-md p-1 flex flex-col gap-2">
                            <div className="w-full h-8 bg-theme-accent-transparent rounded flex items-center justify-center">
                                <span className={commonIconClass}>🏠</span>
                            </div>
                            <div className="w-full h-8 bg-theme-accent-transparent rounded flex items-center justify-center">
                                <span className={commonIconClass}>📊</span>
                            </div>
                            <div className="w-full h-8 bg-theme-accent-transparent rounded flex items-center justify-center">
                                <span className={commonIconClass}>⚙️</span>
                            </div>
                        </div>
                        <span className="text-sm font-medium">Compact Mode</span>
                    </div>
                );

            case 'expanded':
                return (
                    <div className="flex flex-col gap-2 items-center">
                        <div className="w-32 h-30 bg-theme-background-transparent rounded-md p-1 flex flex-col gap-2">
                            <div className="w-full h-8 bg-theme-accent-transparent rounded flex items-center justify-between px-2">
                                <span className={commonIconClass}>🏠</span>
                                <span className="text-xs">Home</span>
                            </div>
                            <div className="absolute ml-28 mt-5 w-6 h-6 bg-theme-accent rounded-full flex items-center justify-center cursor-pointer z-10 shadow-md hover:scale-110 transition-transform">
                                <MenuOpenIcon className="text-white text-sm font-bold" />
                            </div>
                            <div className="w-full h-8 bg-theme-accent-transparent rounded flex items-center justify-between px-2">
                                <span className={commonIconClass}>📊</span>
                                <span className="text-xs">Stats</span>
                            </div>
                            <div className="w-full h-8 bg-theme-accent-transparent rounded flex items-center justify-between px-2">
                                <span className={commonIconClass}>⚙️</span>
                                <span className="text-xs">Settings</span>
                            </div>
                        </div>
                        <span className="text-sm font-medium">Expanded Mode</span>
                    </div >
                );
        }
    };

    // Update the navigation section
    const navigationSection = (
        <div
            className="hover:text-theme-text cursor-pointer p-6 bg-theme-secondary rounded-lg h-auto shadow-md transition duration-300 ease-in-out hover:shadow-lg hover:scale-[101%]"
            onClick={() => toggleDropdown("navigation")}
        >
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Navigation Style</h1>
                {activeDropdown === "navigation" ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </div>
            <div
                className={`transition-[max-height] duration-300 ease-in-out overflow-hidden 
                    ${activeDropdown === "navigation" ? "max-h-[300px]" : "max-h-0"}`}
                onClick={stopPropagation}
            >
                {activeDropdown === "navigation" && (
                    <div className="mt-4 grid grid-cols-3 gap-8">
                        {(['default', 'compact', 'expanded'] as const).map((style) => (
                            <button
                                key={style}
                                onClick={() => setNavStyle(style)}
                                className={`p-4 rounded-lg border-2 transition-all duration-200 
                                    flex flex-col items-center gap-4
                                    ${navStyle === style
                                        ? 'border-theme-accent bg-theme-accent-transparent'
                                        : 'border-transparent hover:border-theme-accent-transparent'}`}
                            >
                                <NavigationPreview type={style} />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-theme-background h-full p-8 flex flex-col justify-center items-center text-theme-accent">
            {/* Settings Container */}
            <div className="bg-theme-primary p-6 rounded-lg overflow-auto shadow-theme-primary-transparent h-[95%] w-[95%] flex flex-col gap-6 transition duration-300 ease-in-out transform animated-scrollbar">
                {/* Name & Username Update/Change Section */}
                <div
                    className="hover:text-theme-text cursor-pointer h-auto bg-theme-secondary-transparent rounded-lg p-6 shadow-md transition duration-300 ease-in-out hover:shadow-lg hover:scale-[101%]"
                    onClick={() => toggleDropdown("nameUsernameChange")}
                >
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold">Name & Username Update/Change</h1>
                        {activeDropdown === "nameUsernameChange" ? (
                            <ExpandLessIcon />
                        ) : (
                            <ExpandMoreIcon />
                        )}
                    </div>
                    <div
                        className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${activeDropdown === "nameUsernameChange" ? "max-h-[300px]" : "max-h-0"
                            }`}
                        onClick={stopPropagation}
                    >
                        {activeDropdown === "nameUsernameChange" && (
                            <form className="flex flex-col gap-4 mt-4" onSubmit={handleUpdateNameUsername}>
                                <div className="flex items-center gap-4">
                                    <TextField
                                        style={{ width: '30%' }}
                                        label="New Name"
                                        variant="standard"
                                        InputProps={{
                                            style: { color: 'var(--theme-text)' },
                                        }}
                                        InputLabelProps={{
                                            style: { color: 'var(--theme-text)' },
                                        }}
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        className="py-2 px-4 bg-theme-accent text-white rounded-md hover:bg-theme-accent-dark transition duration-300 ease-in-out transform hover:scale-[101%] shadow-md hover:shadow-lg"
                                    >
                                        Save
                                    </Button>
                                </div>
                                <div className="flex items-center gap-4">
                                    <TextField
                                        style={{ width: '30%' }}
                                        label="New Username"
                                        variant="standard"
                                        InputProps={{
                                            style: { color: 'var(--theme-text)' },
                                        }}
                                        InputLabelProps={{
                                            style: { color: 'var(--theme-text)' },
                                        }}
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        className="py-2 px-4 bg-theme-accent text-white rounded-md hover:bg-theme-accent-dark transition duration-300 ease-in-out transform hover:scale-[101%] shadow-md hover:shadow-lg"
                                    >
                                        Save
                                    </Button>
                                </div>
                                {usernameAvailable === null ? null : usernameAvailable ? (
                                    <p className="text-green-500">Username is available</p>
                                ) : (
                                    <p className="text-red-500">Username is already taken</p>
                                )}
                                <p className="text-sm font-bold text-theme-text mt-2">
                                    Note: You can only change your username 3 times.
                                </p>
                            </form>
                        )}
                    </div>
                </div>
                {/* Password Change Section */}
                <div
                    className="hover:text-theme-text cursor-pointer h-auto bg-theme-secondary-transparent rounded-lg p-6 shadow-md transition duration-300 ease-in-out hover:shadow-lg hover:scale-[101%]"
                    onClick={() => toggleDropdown("passwordChange")}
                >
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold">Password Change</h1>
                        {activeDropdown === "passwordChange" ? (
                            <ExpandLessIcon />
                        ) : (
                            <ExpandMoreIcon />
                        )}
                    </div>
                    <div
                        className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${activeDropdown === "passwordChange" ? "max-h-[400px]" : "max-h-0"
                            }`}
                        onClick={stopPropagation}
                    >
                        {activeDropdown === "passwordChange" && (
                            <form className="flex flex-col gap-4 mt-4" onSubmit={handleUpdatePassword}>
                                <div className="relative">
                                    <TextField
                                        style={{ width: '30%' }}
                                        label="Current Password"
                                        type={passwordVisible ? "text" : "password"}
                                        variant="standard"
                                        InputProps={{
                                            style: { color: 'var(--theme-text)' },
                                        }}
                                        InputLabelProps={{
                                            style: { color: 'var(--theme-text)' },
                                        }}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute inset-y-0 px-3 py-2 text-gray-400"
                                    >
                                        {passwordVisible ? <VisibilityOffTwoToneIcon /> : <VisibilityTwoToneIcon />}
                                    </button>
                                </div>
                                <div className="relative">
                                    <TextField
                                        style={{ width: '30%' }}
                                        label="New Password"
                                        type={newPasswordVisible ? "text" : "password"}
                                        variant="standard"
                                        InputProps={{
                                            style: { color: 'var(--theme-text)' },
                                        }}
                                        InputLabelProps={{
                                            style: { color: 'var(--theme-text)' },
                                        }}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={toggleNewPasswordVisibility}
                                        className="absolute inset-y-0 px-3 py-2 mb-5 text-gray-400"
                                    >
                                        {newPasswordVisible ? <VisibilityOffTwoToneIcon /> : <VisibilityTwoToneIcon />}
                                    </button>
                                    {newPassword && (
                                        <div className="mt-2">
                                            <div
                                                className="h-2 rounded-full"
                                                style={{
                                                    backgroundColor: getPasswordStrengthColor(passwordStrength.score),
                                                    width: passwordStrength.score === 0 ? '4%' : `${(passwordStrength.score / 4) * 30}%`,
                                                }}
                                            />
                                            <p className="mt-2 text-sm text-theme-text font-bold">{passwordStrength.feedback}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <TextField
                                        style={{ width: '30%' }}
                                        label="Confirm Password"
                                        type={confirmPasswordVisible ? "text" : "password"}
                                        variant="standard"
                                        InputProps={{
                                            style: { color: 'var(--theme-text)' },
                                        }}
                                        InputLabelProps={{
                                            style: { color: 'var(--theme-text)' },
                                        }}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={toggleConfirmPasswordVisibility}
                                        className="absolute inset-y-0 px-3 py-2 text-gray-400"
                                    >
                                        {confirmPasswordVisible ? <VisibilityOffTwoToneIcon /> : <VisibilityTwoToneIcon />}
                                    </button>
                                </div>
                                {!passwordsMatch && (
                                    <p className="text-red-500">New password and confirm password do not match.</p>
                                )}
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    className="py-2 px-4 w-fit bg-theme-accent text-white rounded-md hover:bg-theme-accent-dark transition duration-300 ease-in-out transform hover:scale-[101%] shadow-md hover:shadow-lg"
                                >
                                    Update Password
                                </Button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Theme Toggle Section */}
                <div
                    className="hover:text-theme-text cursor-pointer p-6 bg-theme-secondary rounded-lg h-auto shadow-md transition duration-300 ease-in-out hover:shadow-lg hover:scale-[101%]"
                    onClick={() => toggleDropdown("themes")}
                >
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Themes</h1>
                        {activeDropdown === "themes" ? (
                            <ExpandLessIcon />
                        ) : (
                            <ExpandMoreIcon />
                        )}
                    </div>
                    <div
                        className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${activeDropdown === "themes" ? "max-h-[200px]" : "max-h-0"
                            }`}
                        onClick={stopPropagation}
                    >
                        {activeDropdown === "themes" && (
                            <div className="mt-4">
                                <ThemeToggle />
                            </div>
                        )}
                    </div>
                </div>

                {/* Add navigationSection before the About Us section in your return statement */}
                {navigationSection}

                {/* Backup & Restore Section */}
                <div
                    className="hover:text-theme-text cursor-pointer p-6 bg-theme-secondary rounded-lg h-auto shadow-md transition duration-300 ease-in-out hover:shadow-lg hover:scale-[101%]"
                    onClick={() => toggleDropdown("backupRestore")}
                >
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold">Backup & Restore</h1>
                        {activeDropdown === "backupRestore" ? (
                            <ExpandLessIcon />
                        ) : (
                            <ExpandMoreIcon />
                        )}
                    </div>
                    <div
                        className={`transition-[max-height] flex justify-center duration-300 ease-in-out overflow-hidden ${activeDropdown === "backupRestore" ? "max-h-[200px]" : "max-h-0"
                            }`}
                        onClick={stopPropagation}
                    >
                        {activeDropdown === "backupRestore" && (
                            <div className="mt-4 flex flex-col gap-4 w-1/2">
                                <Button
                                    variant="contained"
                                    color="primary"
                                    className="py-2 px-4 w-fit bg-theme-accent text-white rounded-md hover:bg-theme-accent-dark transition duration-300 ease-in-out transform hover:scale-[101%] shadow-md hover:shadow-lg"
                                >
                                    Backup
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    className="py-2 px-4 w-fit bg-theme-accent text-white rounded-md hover:bg-theme-accent-dark transition duration-300 ease-in-out transform hover:scale-[101%] shadow-md hover:shadow-lg"
                                >
                                    Restore
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* About Us Section */}
                <div
                    className="hover:text-theme-text cursor-pointer p-6 bg-theme-secondary rounded-lg h-auto shadow-md transition duration-300 ease-in-out hover:shadow-lg hover:scale-[101%]"
                    onClick={() => toggleDropdown("aboutUs")}
                >
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold">About Us</h1>
                        {activeDropdown === "aboutUs" ? (
                            <ExpandLessIcon />
                        ) : (
                            <ExpandMoreIcon />
                        )}
                    </div>
                    <div
                        className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${activeDropdown === "aboutUs" ? "max-h-[200px]" : "max-h-0"
                            }`}
                        onClick={stopPropagation}
                    >
                        {activeDropdown === "aboutUs" && (
                            <div className="mt-4">
                                <p className="text-xl font-medium">
                                    Hi, I am <span className="font-bold">Akash</span> (GitHub:&nbsp;
                                    <a
                                        href="#"
                                        className="text-cyan-800 underline"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleExternalLink('https://github.com/akash2061');
                                        }}
                                    >
                                        akash2061
                                    </a>), a passionate Full Stack Developer and Rustacean. <br />I  specialize in building secure, scalable, and efficient software solutions. Feel free to explore my&nbsp;
                                    <a
                                        href="#"
                                        className="text-cyan-800 underline"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleExternalLink('https://github.com/akash2061/Code_Canvas');
                                        }}
                                    >
                                        projects
                                    </a> and reach out for collaborations &&nbsp;
                                    <a
                                        href="#"
                                        className="text-cyan-800 underline"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleExternalLink('https://www.linkedin.com/in/akash-soni-01475924b/');
                                        }}
                                    >
                                        connection
                                    </a>.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete Account Section */}
                <div
                    className="hover:text-theme-text cursor-pointer h-auto bg-theme-secondary-transparent rounded-lg p-6 shadow-md transition duration-300 ease-in-out hover:shadow-lg hover:scale-[101%]"
                    onClick={() => toggleDropdown("deleteAccount")}
                >
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold">Delete Account</h1>
                        {activeDropdown === "deleteAccount" ? (
                            <ExpandLessIcon />
                        ) : (
                            <ExpandMoreIcon />
                        )}
                    </div>
                    <div
                        className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${activeDropdown === "deleteAccount" ? "max-h-[300px]" : "max-h-0"
                            }`}
                        onClick={stopPropagation}
                    >
                        {activeDropdown === "deleteAccount" && (
                            <form className="flex flex-col gap-4 mt-4" onSubmit={openDeleteModal}>
                                <TextField
                                    style={{ width: '30%' }}
                                    label="Username"
                                    variant="standard"
                                    InputProps={{
                                        style: { color: 'var(--theme-text)' },
                                    }}
                                    InputLabelProps={{
                                        style: { color: 'var(--theme-text)' },
                                    }}
                                    value={deleteUsername}
                                    onChange={(e) => setDeleteUsername(e.target.value)}
                                />
                                <div className="relative">
                                    <TextField
                                        style={{ width: '30%' }}
                                        label="Password"
                                        type={passwordVisible ? "text" : "password"}
                                        variant="standard"
                                        InputProps={{
                                            style: { color: 'var(--theme-text)' },
                                        }}
                                        InputLabelProps={{
                                            style: { color: 'var(--theme-text)' },
                                        }}
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute inset-y-0 px-3 py-2 text-gray-400"
                                    >
                                        {passwordVisible ? <VisibilityOffTwoToneIcon /> : <VisibilityTwoToneIcon />}
                                    </button>
                                </div>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="error"
                                    className="py-2 px-4 w-fit bg-red-500 text-white rounded-md hover:bg-red-700 transition duration-100 ease-in-out transform hover:scale-[101%] shadow-md hover:shadow-lg"
                                >
                                    Delete Account
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <Modal
                open={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                aria-labelledby="delete-account-modal"
                aria-describedby="delete-account-confirmation"
            >
                <Box
                    className="bg-theme-primary p-6 rounded-lg shadow-lg"
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "400px",
                        outline: "none",
                    }}
                >
                    <h2 className="text-xl font-bold mb-4 text-theme-background-transparent">
                        Confirm Account Deletion
                    </h2>
                    <p className="text-theme-background-transparent mb-4">
                        To confirm, type <strong>"delete"</strong> in the box below.
                    </p>
                    <TextField
                        fullWidth
                        variant="outlined"
                        label="Type 'delete' to confirm"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        InputProps={{
                            style: { color: "var(--theme-text)" },
                        }}
                        InputLabelProps={{
                            style: { color: "var(--theme-text)" },
                        }}
                    />
                    <div className="flex justify-end gap-4 mt-6">
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="text-theme-text hover:bg-theme-accent"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleDeleteAccount}
                            className="bg-red-500 text-theme-text hover:bg-red-700"
                        >
                            Delete Account
                        </Button>
                    </div>
                </Box>
            </Modal>
        </div>
    );
};

export default Settings;