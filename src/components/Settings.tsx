import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { ThemeToggle } from "../themes";
import { decryptUser } from './auth/token_secure';

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
    const [usernameChangeCount, setUsernameChangeCount] = useState(0);

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

    const handleUpdateNameUsername = async (e: React.FormEvent) => {
        e.preventDefault();
        if (usernameChangeCount >= 3) {
            alert("You can only change your username 3 times.");
            return;
        }
        if (usernameAvailable === false) {
            alert("Username is already taken. Please choose a unique username.");
            return;
        }
        try {
            const user = decryptUser();
            console.log("Decrypted user data:", user); // Print decrypted user data
            if (user) {
                const args = { userId: user.user_id, newName: newName, newUsername: newUsername };
                console.log("Arguments passed to invoke:", args); // Print arguments passed to invoke
                await invoke("update_name_username", args);
                setUsernameChangeCount(usernameChangeCount + 1);
                alert("Name and Username updated successfully!");
            } else {
                console.error("Failed to decrypt user data");
            }
        } catch (error) {
            console.error("Error updating name and username:", error);
        }
    };

    return (
        <div className="bg-theme-background h-full p-8 flex flex-col justify-center items-center text-theme-accent">
            {/* Settings Container */}
            <div className="bg-theme-primary p-6 rounded-lg overflow-auto shadow-theme-primary-transparent h-[95%] w-[95%] flex flex-col gap-6 transition duration-300 ease-in-out transform hover:scale-[101%]">
                {/* Name & Username Update/Change Section */}
                <div
                    className="hover:text-theme-text cursor-pointer h-auto bg-theme-secondary-transparent rounded-lg p-6 shadow-md transition duration-300 ease-in-out hover:shadow-lg"
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
                                <TextField
                                    label="New Name"
                                    variant="standard"
                                    fullWidth
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                                <TextField
                                    label="New Username"
                                    variant="standard"
                                    fullWidth
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                />
                                {usernameAvailable === null ? null : usernameAvailable ? (
                                    <p className="text-green-500">Username is available</p>
                                ) : (
                                    <p className="text-red-500">Username is already taken</p>
                                )}
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    className="py-2 px-4 w-fit bg-theme-accent text-white rounded-md hover:bg-theme-accent-dark transition duration-300 ease-in-out transform hover:scale-[101%] shadow-md hover:shadow-lg"
                                >
                                    Update Name & Username
                                </Button>
                                <p className="text-sm text-gray-500 mt-2">
                                    Note: You can only change your username 3 times.
                                </p>
                            </form>
                        )}
                    </div>
                </div>
                {/* Password Change Section */}
                <div
                    className="hover:text-theme-text cursor-pointer h-auto bg-theme-secondary-transparent rounded-lg p-6 shadow-md transition duration-300 ease-in-out hover:shadow-lg"
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
                        className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${activeDropdown === "passwordChange" ? "max-h-[300px]" : "max-h-0"
                            }`}
                        onClick={stopPropagation}
                    >
                        {activeDropdown === "passwordChange" && (
                            <form className="flex flex-col gap-4 mt-4">
                                <TextField
                                    label="Current Password"
                                    type="password"
                                    variant="standard"
                                    fullWidth
                                />
                                <TextField
                                    label="New Password"
                                    type="password"
                                    variant="standard"
                                    fullWidth
                                />
                                <TextField
                                    label="Rewrite New Password"
                                    type="password"
                                    variant="standard"
                                    fullWidth
                                />
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
                    className="hover:text-theme-text cursor-pointer p-6 bg-theme-secondary rounded-lg h-auto shadow-md transition duration-300 ease-in-out hover:shadow-lg"
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

                {/* Backup & Restore Section */}
                <div
                    className="hover:text-theme-text cursor-pointer p-6 bg-theme-secondary rounded-lg h-auto shadow-md transition duration-300 ease-in-out hover:shadow-lg"
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
                    className="hover:text-theme-text cursor-pointer p-6 bg-theme-secondary rounded-lg h-auto shadow-md transition duration-300 ease-in-out hover:shadow-lg"
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
                                    Hi, I am <span className="font-bold">Akash</span> (GitHub: <a href="https://github.com/akash2061" className="text-cyan-800 underline">akash2061</a>), a passionate Full Stack Developer and Rustacean. <br />I specialize in building secure, scalable, and efficient software solutions. Feel free to explore my <a href="https://github.com/akash2061/Code_Canvas" target="_blank" className="text-cyan-800 underline">projects</a> and reach out for collaborations & <a href="https://www.linkedin.com/in/akash-soni-01475924b/" target="_blank" className="text-cyan-800 underline">connection</a>.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete Account Section */}
                <div
                    className="hover:text-theme-text cursor-pointer p-6 bg-theme-secondary rounded-lg h-auto shadow-md transition duration-300 ease-in-out hover:shadow-lg"
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
                        className={`transition-[max-height] duration-300 ease-in-out overflow-hidden flex justify-center ${activeDropdown === "deleteAccount" ? "max-h-[300px]" : "max-h-0"
                            }`}
                        onClick={stopPropagation}
                    >
                        {activeDropdown === "deleteAccount" && (
                            <form className="flex flex-col gap-4 mt-4 w-3/4">
                                <TextField
                                    label="Username"
                                    variant="standard"
                                    fullWidth
                                />
                                <TextField
                                    label="Password"
                                    type="password"
                                    variant="standard"
                                    fullWidth
                                />
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="secondary"
                                    className="py-2 px-4 w-fit bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-100 ease-in-out transform hover:scale-[101%] shadow-md hover:shadow-lg"
                                >
                                    Delete Account
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;