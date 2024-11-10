import React from 'react'
import { Outlet } from 'react-router-dom'

const AppLayout3: React.FC = () => {
    return (
        <div className='flex flex-col h-screen'>

            <div className='flex flex-1'>
                <nav className='w-64 bg-gray-200 p-4'>
                    <ul className='space-y-4'>
                        <li>
                            <a href="/" className="text-blue-600 hover:underline">Home</a>
                        </li>
                        <li>
                            <a href="/about" className="text-blue-600 hover:underline">About</a>
                        </li>
                        <li>
                            <a href="/contact" className="text-blue-600 hover:underline">Contact</a>
                        </li>
                    </ul>
                </nav>

                <div className='flex-1 overflow-auto'>
                    <header className='bg-gray-200 text-white p-4'>
                        <h1>Decoration</h1>
                    </header>
                    <main className='flex-1 p-6 overflow-auto'>

                        {/* <Outlet /> */}
                        <h1>Main</h1>
                    </main>
                </div>
            </div>
        </div>
    )
}

export default AppLayout3
