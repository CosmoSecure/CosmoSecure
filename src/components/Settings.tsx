import { useState } from "react";
import { ThemeToggle } from "../themes";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

const Settings = () => {
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const toggleDropdown = (dropdownName: string) => {
        setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
    };

    const stopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="bg-theme-background h-full p-8 flex flex-col justify-center items-center text-theme-accent">
            {/* Settings Container */}
            <div className="bg-theme-primary p-6 rounded-lg overflow-auto shadow-theme-primary-transparent h-[95%] w-[95%] flex flex-col gap-6 transition duration-300 ease-in-out transform hover:scale-[101%]">
                {/* Name & username Change Section */}
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
                                <input
                                    type="password"
                                    placeholder="Current Password"
                                    className="p-3 rounded-md bg-theme-background text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent shadow-sm"
                                />
                                <input
                                    type="password"
                                    placeholder="New Password"
                                    className="p-3 rounded-md bg-theme-background text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent shadow-sm"
                                />
                                <input
                                    type="password"
                                    placeholder="Rewrite New Password"
                                    className="p-3 rounded-md bg-theme-background text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent shadow-sm"
                                />
                                <button
                                    type="submit"
                                    className="py-2 px-4 bg-theme-accent text-white rounded-md hover:bg-theme-accent-dark transition duration-300 ease-in-out transform hover:scale-[101%] shadow-md hover:shadow-lg"
                                >
                                    Update Password
                                </button>
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
                                <input
                                    type="password"
                                    placeholder="Current Password"
                                    className="p-3 rounded-md bg-theme-background text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent shadow-sm"
                                />
                                <input
                                    type="password"
                                    placeholder="New Password"
                                    className="p-3 rounded-md bg-theme-background text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent shadow-sm"
                                />
                                <input
                                    type="password"
                                    placeholder="Rewrite New Password"
                                    className="p-3 rounded-md bg-theme-background text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent shadow-sm"
                                />
                                <button
                                    type="submit"
                                    className="py-2 px-4 bg-theme-accent text-white rounded-md hover:bg-theme-accent-dark transition duration-300 ease-in-out transform hover:scale-[101%] shadow-md hover:shadow-lg"
                                >
                                    Update Password
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Other Sections */}
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

                {/* Additional sections (Backup & Restore, About Us, Delete Account) */}
                {[
                    { title: "Backup & Restore", content: "Manage your data backups and restore settings here." },
                    { title: "About Us", content: "Learn more about our team and mission." },
                    { title: "Delete Account", content: "Delete your account here." },
                ].map((section, index) => (
                    <div
                        key={index}
                        className="hover:text-theme-text cursor-pointer p-6 bg-theme-secondary rounded-lg h-auto shadow-md transition duration-300 ease-in-out hover:shadow-lg"
                        onClick={() => toggleDropdown(section.title)}
                    >
                        <div className="flex items-center justify-between">
                            <h1 className="text-xl font-bold">{section.title}</h1>
                            {activeDropdown === section.title ? (
                                <ExpandLessIcon />
                            ) : (
                                <ExpandMoreIcon />
                            )}
                        </div>
                        <div
                            className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${activeDropdown === section.title ? "max-h-[200px]" : "max-h-0"
                                }`}
                            onClick={stopPropagation}
                        >
                            {activeDropdown === section.title && <p className="mt-4">{section.content}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Settings;
