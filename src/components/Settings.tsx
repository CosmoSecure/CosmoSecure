import './scroll.css';
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { ThemeToggle } from "../themes";
import { useUser } from '../contexts/UserContext';
import { VisibilityOffTwoToneIcon, VisibilityTwoToneIcon } from './auth/passCSS';
import { reloadApp_Update } from "./reloadApp_Update";
import { useQuickNotifications } from '../utils/notifications';
import { useNavigation } from '../contexts/';
import { toast } from 'sonner';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
// Additional icons for better UI
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import PaletteIcon from '@mui/icons-material/Palette';
import NavigationIcon from '@mui/icons-material/Navigation';
import BackupIcon from '@mui/icons-material/Backup';
import InfoIcon from '@mui/icons-material/Info';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import BarChartIcon from '@mui/icons-material/BarChart';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';

function debounce(func: (...args: any[]) => void, wait: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

const Settings = () => {
    const { user, refreshUser } = useUser();
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

    // Notification hooks
    const quick = useQuickNotifications();

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
            quick.error("Username is already taken. Please choose a unique username.");
            return;
        }
        try {
            if (user) {
                const args = { userId: user.userId, newName: newName || null, newUsername: newUsername || null };
                console.log("Arguments passed to invoke:", args); // Print arguments passed to invoke
                await invoke("update_name_username", args);
                quick.success("Name and/or Username updated successfully!");
                await reloadApp_Update(user.userId);
                await refreshUser(); // Refresh user context

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
            quick.error("Password Mismatch", "New password and confirm password do not match.");
            return;
        }
        try {
            if (user) {
                const args = { userId: user.userId, currentPassword: currentPassword, newPassword: newPassword };
                const response = await invoke<string>("update_user_password", args);
                if (response === "New password cannot be the same as the current password.") {
                    quick.error("Invalid Password", "New password cannot be the same as the current password.");
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
                quick.success('Password updated successfully!', 'Changes applied. Please relogin to apply changes.');
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
                                    <span className={commonIconClass}><HomeIcon /></span>
                                </div>
                                <div className="w-full h-8 bg-theme-accent-transparent rounded flex items-center justify-center">
                                    <span className={commonIconClass}><BarChartIcon /></span>
                                </div>
                                <div className="w-full h-8 bg-theme-accent-transparent rounded flex items-center justify-center">
                                    <span className={commonIconClass}><SettingsIcon /></span>
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
                                <span className={commonIconClass}><HomeIcon /></span>
                            </div>
                            <div className="w-full h-8 bg-theme-accent-transparent rounded flex items-center justify-center">
                                <span className={commonIconClass}><BarChartIcon /></span>
                            </div>
                            <div className="w-full h-8 bg-theme-accent-transparent rounded flex items-center justify-center">
                                <span className={commonIconClass}><SettingsIcon /></span>
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
                                <span className={commonIconClass}><HomeIcon /></span>
                                <span className="text-xs">Home</span>
                            </div>
                            <div className="absolute ml-28 mt-5 w-6 h-6 bg-theme-accent rounded-full flex items-center justify-center cursor-pointer z-10 shadow-md hover:scale-110 transition-transform">
                                <MenuOpenIcon className="text-white text-sm font-bold" />
                            </div>
                            <div className="w-full h-8 bg-theme-accent-transparent rounded flex items-center justify-between px-2">
                                <span className={commonIconClass}><BarChartIcon /></span>
                                <span className="text-xs">Stats</span>
                            </div>
                            <div className="w-full h-8 bg-theme-accent-transparent rounded flex items-center justify-between px-2">
                                <span className={commonIconClass}><SettingsIcon /></span>
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
            className="group hover:text-theme-text cursor-pointer p-8 bg-gradient-to-r from-theme-secondary-transparent to-theme-primary-transparent border border-theme-accent-transparent rounded-2xl h-auto shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[101%] hover:border-theme-accent backdrop-blur-sm"
            onClick={() => toggleDropdown("navigation")}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-theme-accent rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        <NavigationIcon />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-theme-text group-hover:text-theme-accent transition-colors">Navigation Style</h1>
                        <p className="text-theme-accent text-sm">Choose your preferred navigation layout</p>
                    </div>
                </div>
                <div className="p-2 rounded-full bg-theme-accent-transparent group-hover:bg-theme-accent transition-colors">
                    {activeDropdown === "navigation" ? (
                        <ExpandLessIcon className="text-theme-accent group-hover:text-white" />
                    ) : (
                        <ExpandMoreIcon className="text-theme-accent group-hover:text-white" />
                    )}
                </div>
            </div>
            <div
                className={`transition-[max-height] duration-500 ease-in-out overflow-hidden 
                    ${activeDropdown === "navigation" ? "max-h-[300px]" : "max-h-0"}`}
                onClick={stopPropagation}
            >
                {activeDropdown === "navigation" && (
                    <div className="pt-6 border-t border-theme-accent-transparent">
                        <div className="grid grid-cols-3 gap-6 p-4 bg-theme-background-transparent rounded-xl">
                            {(['default', 'compact', 'expanded'] as const).map((style) => (
                                <button
                                    key={style}
                                    onClick={() => setNavStyle(style)}
                                    className={`p-6 rounded-xl border-2 transition-all duration-300 
                                        flex flex-col items-center gap-4 hover:shadow-lg transform hover:scale-105
                                        ${navStyle === style
                                            ? 'border-theme-accent bg-theme-accent-transparent shadow-lg scale-105'
                                            : 'border-theme-secondary-transparent hover:border-theme-accent-transparent bg-theme-background-transparent'}`}
                                >
                                    <NavigationPreview type={style} />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-theme-background h-full p-6 flex flex-col justify-center items-center text-theme-text">
            {/* Settings Header */}
            <div className="w-[95%] mb-6">
                <h1 className="text-4xl font-bold text-theme-text text-center mb-2">Settings</h1>
                <p className="text-theme-accent text-center text-lg">Customize your CosmoSecure experience</p>
            </div>

            {/* Settings Container */}
            <div className="bg-theme-primary border border-theme-secondary-transparent p-8 rounded-2xl overflow-auto shadow-2xl h-[85%] w-[95%] flex flex-col gap-8 transition duration-300 ease-in-out transform animated-scrollbar backdrop-blur-sm">
                {/* Name & Username Update/Change Section */}
                <div
                    className="group hover:text-theme-text cursor-pointer h-auto bg-gradient-to-r from-theme-secondary-transparent to-theme-primary-transparent border border-theme-accent-transparent rounded-2xl p-8 shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[101%] hover:border-theme-accent backdrop-blur-sm"
                    onClick={() => toggleDropdown("nameUsernameChange")}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-theme-accent rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                <PersonIcon />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-theme-text group-hover:text-theme-accent transition-colors">Name & Username Update</h1>
                                <p className="text-theme-accent text-sm">Manage your personal information</p>
                            </div>
                        </div>
                        <div className="p-2 rounded-full bg-theme-accent-transparent group-hover:bg-theme-accent transition-colors">
                            {activeDropdown === "nameUsernameChange" ? (
                                <ExpandLessIcon className="text-theme-accent group-hover:text-white" />
                            ) : (
                                <ExpandMoreIcon className="text-theme-accent group-hover:text-white" />
                            )}
                        </div>
                    </div>
                    <div
                        className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${activeDropdown === "nameUsernameChange" ? "max-h-[300px]" : "max-h-0"
                            }`}
                        onClick={stopPropagation}
                    >
                        {activeDropdown === "nameUsernameChange" && (
                            <div className="pt-6 border-t border-theme-accent-transparent">
                                <form className="flex flex-col gap-6" onSubmit={handleUpdateNameUsername}>
                                    <div className="flex items-center gap-6">
                                        <div className="flex-1">
                                            <TextField
                                                fullWidth
                                                label="New Name"
                                                variant="outlined"
                                                size="medium"
                                                InputProps={{
                                                    style: {
                                                        color: 'var(--theme-text)',
                                                        backgroundColor: 'var(--theme-background-transparent)',
                                                        borderRadius: '12px'
                                                    },
                                                }}
                                                InputLabelProps={{
                                                    style: { color: 'var(--theme-accent)' },
                                                }}
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="bg-theme-background-transparent rounded-xl"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            size="large"
                                            className="px-8 py-3 bg-gradient-to-r from-theme-accent to-theme-secondary text-white rounded-xl hover:from-theme-secondary hover:to-theme-accent transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
                                        >
                                            Save Name
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex-1">
                                            <TextField
                                                fullWidth
                                                label="New Username"
                                                variant="outlined"
                                                size="medium"
                                                InputProps={{
                                                    style: {
                                                        color: 'var(--theme-text)',
                                                        backgroundColor: 'var(--theme-background-transparent)',
                                                        borderRadius: '12px'
                                                    },
                                                }}
                                                InputLabelProps={{
                                                    style: { color: 'var(--theme-accent)' },
                                                }}
                                                value={newUsername}
                                                onChange={(e) => setNewUsername(e.target.value)}
                                                className="bg-theme-background-transparent rounded-xl"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            size="large"
                                            className="px-8 py-3 bg-gradient-to-r from-theme-accent to-theme-secondary text-white rounded-xl hover:from-theme-secondary hover:to-theme-accent transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
                                        >
                                            Save Username
                                        </Button>
                                    </div>
                                    {usernameAvailable === null ? null : usernameAvailable ? (
                                        <div className="flex items-center gap-2 text-green-500 bg-green-100 p-3 rounded-xl">
                                            <span className="text-lg">✅</span>
                                            <p className="font-medium">Username is available</p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-red-500 bg-red-100 p-3 rounded-xl">
                                            <span className="text-lg">❌</span>
                                            <p className="font-medium">Username is already taken</p>
                                        </div>
                                    )}
                                    <div className="bg-theme-accent-transparent border-l-4 border-theme-accent p-4 rounded-r-xl">
                                        <p className="text-sm font-semibold text-theme-text">
                                            <WarningIcon className="inline mr-1 text-amber-500" />
                                            Note: You can only change your username 3 times.
                                        </p>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
                {/* Password Change Section */}
                <div
                    className="group hover:text-theme-text cursor-pointer h-auto bg-gradient-to-r from-theme-secondary-transparent to-theme-primary-transparent border border-theme-accent-transparent rounded-2xl p-8 shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[101%] hover:border-theme-accent backdrop-blur-sm"
                    onClick={() => toggleDropdown("passwordChange")}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-theme-accent rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                <LockIcon />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-theme-text group-hover:text-theme-accent transition-colors">Password Change</h1>
                                <p className="text-theme-accent text-sm">Update your account security</p>
                            </div>
                        </div>
                        <div className="p-2 rounded-full bg-theme-accent-transparent group-hover:bg-theme-accent transition-colors">
                            {activeDropdown === "passwordChange" ? (
                                <ExpandLessIcon className="text-theme-accent group-hover:text-white" />
                            ) : (
                                <ExpandMoreIcon className="text-theme-accent group-hover:text-white" />
                            )}
                        </div>
                    </div>
                    <div
                        className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${activeDropdown === "passwordChange" ? "max-h-[500px]" : "max-h-0"
                            }`}
                        onClick={stopPropagation}
                    >
                        {activeDropdown === "passwordChange" && (
                            <div className="pt-6 border-t border-theme-accent-transparent">
                                <form className="flex flex-col gap-6" onSubmit={handleUpdatePassword}>
                                    <div className="relative">
                                        <TextField
                                            fullWidth
                                            label="Current Password"
                                            type={passwordVisible ? "text" : "password"}
                                            variant="outlined"
                                            size="medium"
                                            InputProps={{
                                                style: {
                                                    color: 'var(--theme-text)',
                                                    backgroundColor: 'var(--theme-background-transparent)',
                                                    borderRadius: '12px'
                                                },
                                            }}
                                            InputLabelProps={{
                                                style: { color: 'var(--theme-accent)' },
                                            }}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="bg-theme-background-transparent rounded-xl"
                                        />
                                        <button
                                            type="button"
                                            onClick={togglePasswordVisibility}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-accent hover:text-theme-text transition-colors p-2 rounded-lg hover:bg-theme-accent-transparent"
                                        >
                                            {passwordVisible ? <VisibilityOffTwoToneIcon /> : <VisibilityTwoToneIcon />}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <TextField
                                            fullWidth
                                            label="New Password"
                                            type={newPasswordVisible ? "text" : "password"}
                                            variant="outlined"
                                            size="medium"
                                            InputProps={{
                                                style: {
                                                    color: 'var(--theme-text)',
                                                    backgroundColor: 'var(--theme-background-transparent)',
                                                    borderRadius: '12px'
                                                },
                                            }}
                                            InputLabelProps={{
                                                style: { color: 'var(--theme-accent)' },
                                            }}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="bg-theme-background-transparent rounded-xl"
                                        />
                                        <button
                                            type="button"
                                            onClick={toggleNewPasswordVisibility}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-accent hover:text-theme-text transition-colors p-2 rounded-lg hover:bg-theme-accent-transparent"
                                        >
                                            {newPasswordVisible ? <VisibilityOffTwoToneIcon /> : <VisibilityTwoToneIcon />}
                                        </button>
                                        {newPassword && (
                                            <div className="mt-4 p-4 bg-theme-accent-transparent rounded-xl">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-sm font-semibold text-theme-text">Password Strength:</span>
                                                    <div className="flex-1 bg-theme-background rounded-full h-3 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-300 ease-in-out"
                                                            style={{
                                                                backgroundColor: getPasswordStrengthColor(passwordStrength.score),
                                                                width: passwordStrength.score === 0 ? '10%' : `${(passwordStrength.score / 4) * 100}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-sm text-theme-text font-medium">{passwordStrength.feedback}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <TextField
                                            fullWidth
                                            label="Confirm Password"
                                            type={confirmPasswordVisible ? "text" : "password"}
                                            variant="outlined"
                                            size="medium"
                                            InputProps={{
                                                style: {
                                                    color: 'var(--theme-text)',
                                                    backgroundColor: 'var(--theme-background-transparent)',
                                                    borderRadius: '12px'
                                                },
                                            }}
                                            InputLabelProps={{
                                                style: { color: 'var(--theme-accent)' },
                                            }}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="bg-theme-background-transparent rounded-xl"
                                        />
                                        <button
                                            type="button"
                                            onClick={toggleConfirmPasswordVisibility}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-accent hover:text-theme-text transition-colors p-2 rounded-lg hover:bg-theme-accent-transparent"
                                        >
                                            {confirmPasswordVisible ? <VisibilityOffTwoToneIcon /> : <VisibilityTwoToneIcon />}
                                        </button>
                                    </div>
                                    {!passwordsMatch && (
                                        <div className="flex items-center gap-2 text-red-500 bg-red-100 p-3 rounded-xl">
                                            <span className="text-lg">❌</span>
                                            <p className="font-medium">New password and confirm password do not match.</p>
                                        </div>
                                    )}
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        className="self-start px-8 py-3 bg-gradient-to-r from-theme-accent to-theme-secondary text-white rounded-xl hover:from-theme-secondary hover:to-theme-accent transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
                                    >
                                        Update Password
                                    </Button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                {/* Theme Toggle Section */}
                <div
                    className="group hover:text-theme-text cursor-pointer p-8 bg-gradient-to-r from-theme-secondary-transparent to-theme-primary-transparent border border-theme-accent-transparent rounded-2xl h-auto shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[101%] hover:border-theme-accent backdrop-blur-sm"
                    onClick={() => toggleDropdown("themes")}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-theme-accent rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                <PaletteIcon />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-theme-text group-hover:text-theme-accent transition-colors">Themes</h1>
                                <p className="text-theme-accent text-sm">Customize your visual experience</p>
                            </div>
                        </div>
                        <div className="p-2 rounded-full bg-theme-accent-transparent group-hover:bg-theme-accent transition-colors">
                            {activeDropdown === "themes" ? (
                                <ExpandLessIcon className="text-theme-accent group-hover:text-white" />
                            ) : (
                                <ExpandMoreIcon className="text-theme-accent group-hover:text-white" />
                            )}
                        </div>
                    </div>
                    <div
                        className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${activeDropdown === "themes" ? "max-h-[200px]" : "max-h-0"
                            }`}
                        onClick={stopPropagation}
                    >
                        {activeDropdown === "themes" && (
                            <div className="pt-6 border-t border-theme-accent-transparent">
                                <div className="p-4 bg-theme-background-transparent rounded-xl">
                                    <ThemeToggle />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add navigationSection before the About Us section in your return statement */}
                {navigationSection}

                {/* Backup & Restore Section */}
                <div
                    className="group hover:text-theme-text cursor-pointer p-8 bg-gradient-to-r from-theme-secondary-transparent to-theme-primary-transparent border border-theme-accent-transparent rounded-2xl h-auto shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[101%] hover:border-theme-accent backdrop-blur-sm"
                    onClick={() => toggleDropdown("backupRestore")}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-theme-accent rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                <BackupIcon />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-theme-text group-hover:text-theme-accent transition-colors">Backup & Restore</h1>
                                <p className="text-theme-accent text-sm">Secure your data with backups</p>
                            </div>
                        </div>
                        <div className="p-2 rounded-full bg-theme-accent-transparent group-hover:bg-theme-accent transition-colors">
                            {activeDropdown === "backupRestore" ? (
                                <ExpandLessIcon className="text-theme-accent group-hover:text-white" />
                            ) : (
                                <ExpandMoreIcon className="text-theme-accent group-hover:text-white" />
                            )}
                        </div>
                    </div>
                    <div
                        className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${activeDropdown === "backupRestore" ? "max-h-[200px]" : "max-h-0"
                            }`}
                        onClick={stopPropagation}
                    >
                        {activeDropdown === "backupRestore" && (
                            <div className="pt-6 border-t border-theme-accent-transparent">
                                <div className="flex flex-col gap-4 p-4 bg-theme-background-transparent rounded-xl">
                                    <Button
                                        variant="contained"
                                        size="large"
                                        className="px-8 py-3 bg-gradient-to-r from-theme-accent to-theme-secondary text-white rounded-xl hover:from-theme-secondary hover:to-theme-accent transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
                                    >
                                        <CloudUploadIcon className="mr-2" />
                                        Create Backup
                                    </Button>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        className="px-8 py-3 bg-gradient-to-r from-theme-secondary to-theme-accent text-white rounded-xl hover:from-theme-accent hover:to-theme-secondary transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
                                    >
                                        <CloudDownloadIcon className="mr-2" />
                                        Restore Backup
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* About Us Section */}
                <div
                    className="group hover:text-theme-text cursor-pointer p-8 bg-gradient-to-r from-theme-secondary-transparent to-theme-primary-transparent border border-theme-accent-transparent rounded-2xl h-auto shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[101%] hover:border-theme-accent backdrop-blur-sm"
                    onClick={() => toggleDropdown("aboutUs")}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-theme-accent rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                <InfoIcon />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-theme-text group-hover:text-theme-accent transition-colors">About Us</h1>
                                <p className="text-theme-accent text-sm">Learn about the developer</p>
                            </div>
                        </div>
                        <div className="p-2 rounded-full bg-theme-accent-transparent group-hover:bg-theme-accent transition-colors">
                            {activeDropdown === "aboutUs" ? (
                                <ExpandLessIcon className="text-theme-accent group-hover:text-white" />
                            ) : (
                                <ExpandMoreIcon className="text-theme-accent group-hover:text-white" />
                            )}
                        </div>
                    </div>
                    <div
                        className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${activeDropdown === "aboutUs" ? "max-h-[200px]" : "max-h-0"
                            }`}
                        onClick={stopPropagation}
                    >
                        {activeDropdown === "aboutUs" && (
                            <div className="pt-6 border-t border-theme-accent-transparent">
                                <div className="p-6 bg-theme-background-transparent rounded-xl">
                                    <p className="text-lg leading-relaxed text-theme-text">
                                        Hi, I am <span className="font-bold text-theme-accent">Akash</span> (GitHub:&nbsp;
                                        <a
                                            href="#"
                                            className="text-theme-accent hover:text-theme-secondary underline decoration-2 underline-offset-2 font-semibold transition-colors"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleExternalLink('https://github.com/akash2061');
                                            }}
                                        >
                                            akash2061
                                        </a>), a passionate Full Stack Developer and Rustacean. <br /><br />I specialize in building secure, scalable, and efficient software solutions. Feel free to explore my&nbsp;
                                        <a
                                            href="#"
                                            className="text-theme-accent hover:text-theme-secondary underline decoration-2 underline-offset-2 font-semibold transition-colors"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleExternalLink('https://github.com/akash2061/Code_Canvas');
                                            }}
                                        >
                                            projects
                                        </a> and reach out for collaborations &nbsp;
                                        <a
                                            href="#"
                                            className="text-theme-accent hover:text-theme-secondary underline decoration-2 underline-offset-2 font-semibold transition-colors"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleExternalLink('https://www.linkedin.com/in/akash-soni-01475924b/');
                                            }}
                                        >
                                            connection
                                        </a>.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete Account Section */}
                <div
                    className="group hover:text-theme-text cursor-pointer h-auto bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-2xl p-8 shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[101%] hover:border-red-500 backdrop-blur-sm"
                    onClick={() => toggleDropdown("deleteAccount")}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                <DeleteIcon />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-red-500 group-hover:text-red-400 transition-colors">Delete Account</h1>
                                <p className="text-red-400 text-sm">Permanently remove your account</p>
                            </div>
                        </div>
                        <div className="p-2 rounded-full bg-red-500/20 group-hover:bg-red-500 transition-colors">
                            {activeDropdown === "deleteAccount" ? (
                                <ExpandLessIcon className="text-red-500 group-hover:text-white" />
                            ) : (
                                <ExpandMoreIcon className="text-red-500 group-hover:text-white" />
                            )}
                        </div>
                    </div>
                    <div
                        className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${activeDropdown === "deleteAccount" ? "max-h-[400px]" : "max-h-0"
                            }`}
                        onClick={stopPropagation}
                    >
                        {activeDropdown === "deleteAccount" && (
                            <div className="pt-6 border-t border-red-500/30">
                                <div className="p-4 bg-red-50/10 border border-red-500/20 rounded-xl mb-4">
                                    <p className="text-red-400 text-sm font-semibold">
                                        <WarningIcon className="inline mr-2 text-red-500" />
                                        Warning: This action cannot be undone. All your data will be permanently deleted.
                                    </p>
                                </div>
                                <form className="flex flex-col gap-6" onSubmit={openDeleteModal}>
                                    <TextField
                                        fullWidth
                                        label="Username"
                                        variant="outlined"
                                        size="medium"
                                        InputProps={{
                                            style: {
                                                color: 'var(--theme-text)',
                                                backgroundColor: 'var(--theme-background-transparent)',
                                                borderRadius: '12px'
                                            },
                                        }}
                                        InputLabelProps={{
                                            style: { color: 'var(--theme-accent)' },
                                        }}
                                        value={deleteUsername}
                                        onChange={(e) => setDeleteUsername(e.target.value)}
                                        className="bg-theme-background-transparent rounded-xl"
                                    />
                                    <div className="relative">
                                        <TextField
                                            fullWidth
                                            label="Password"
                                            type={passwordVisible ? "text" : "password"}
                                            variant="outlined"
                                            size="medium"
                                            InputProps={{
                                                style: {
                                                    color: 'var(--theme-text)',
                                                    backgroundColor: 'var(--theme-background-transparent)',
                                                    borderRadius: '12px'
                                                },
                                            }}
                                            InputLabelProps={{
                                                style: { color: 'var(--theme-accent)' },
                                            }}
                                            value={deletePassword}
                                            onChange={(e) => setDeletePassword(e.target.value)}
                                            className="bg-theme-background-transparent rounded-xl"
                                        />
                                        <button
                                            type="button"
                                            onClick={togglePasswordVisibility}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-accent hover:text-theme-text transition-colors p-2 rounded-lg hover:bg-theme-accent-transparent"
                                        >
                                            {passwordVisible ? <VisibilityOffTwoToneIcon /> : <VisibilityTwoToneIcon />}
                                        </button>
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        className="self-start px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
                                    >
                                        <DeleteIcon className="mr-2" />
                                        Delete Account
                                    </Button>
                                </form>
                            </div>
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
                    className="bg-theme-primary border border-theme-accent-transparent p-8 rounded-2xl shadow-2xl backdrop-blur-sm"
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "500px",
                        outline: "none",
                    }}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            <WarningIcon className="text-red-500 text-5xl mb-4" />
                        </div>
                        <h2 className="text-2xl font-bold text-theme-text">
                            Confirm Account Deletion
                        </h2>
                    </div>
                    <div className="bg-red-50/10 border border-red-500/20 rounded-xl p-4 mb-6">
                        <p className="text-theme-text mb-2">
                            To confirm, type <strong className="text-red-500">"delete"</strong> in the box below.
                        </p>
                        <p className="text-red-400 text-sm font-semibold">
                            This action cannot be undone!
                        </p>
                    </div>
                    <TextField
                        fullWidth
                        variant="outlined"
                        label="Type 'delete' to confirm"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        InputProps={{
                            style: {
                                color: "var(--theme-text)",
                                backgroundColor: 'var(--theme-background-transparent)',
                                borderRadius: '12px'
                            },
                        }}
                        InputLabelProps={{
                            style: { color: "var(--theme-accent)" },
                        }}
                        className="mb-6 bg-theme-background-transparent rounded-xl"
                    />
                    <div className="flex justify-end gap-4 mt-6">
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-6 py-2 text-theme-text border-theme-accent hover:bg-theme-accent-transparent rounded-xl transition-all duration-300"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleDeleteAccount}
                            className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
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