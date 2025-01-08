import React from 'react'
import { ThemeToggle } from "../themes";// Import ThemeToggle

const Settings = () => {
    return (
        <div>
            <div className="p-4">
                <ThemeToggle /> {/* Add ThemeToggle button */}
            </div>
        </div>
    )
}

export default Settings