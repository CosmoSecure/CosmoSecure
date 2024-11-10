import React from 'react'
import { Link, Outlet } from 'react-router-dom'

const AppLayout: React.FC = () => {
    return (
        <div className='flex flex-col h-screen'>
            {/* Header Section */}
            <header className='bg-gray-800 text-white p-4'>
                <h1>Decoration</h1>
            </header>

            <div className='flex flex-1 pt-1'>
                {/* Sidebar Section */}
                <nav className='w-64 bg-gray-200 p-4'>
                    <ul className='space-y-4'>
                        <li>
                            <Link to="/home" className="text-blue-600 hover:underline">Home</Link>
                        </li>
                        <li>
                            <Link to="/about" className="text-blue-600 hover:underline">About</Link>
                        </li>
                        <li>
                            <Link to="/contact" className="text-blue-600 hover:underline">Contact</Link>
                        </li>
                    </ul>
                </nav>

                {/* Main Content Section */}
                <div className='flex-1 pl-1 overflow-auto'>
                    <main className='flex-1 h-full'>
                        {/* The Outlet renders the current route's page here */}
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    )
}

export default AppLayout
