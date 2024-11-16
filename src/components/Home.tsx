import React, { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

const Home: React.FC = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
    const [twoFactorSecret, setTwoFactorSecret] = useState('')

    // Function to handle user creation
    const handleAddUser = async () => {
        if (!username || !password) {
            alert('Username and password are required!')
            return
        }

        try {
            // Call backend to handle user creation, including hashing the password
            const response = await invoke('tauri_add_user', {
                username,
                password,  // Send plain password to backend for hashing
                two_factor_secret: twoFactorSecret || null,  // Correct key name (with underscore)
                // two_factor_enabled: twoFactorEnabled,  // Correct key name (with underscore)
            })

            alert('User added successfully: ' + response)
        } catch (error) {
            console.error('Error adding user:', error)
            alert('Failed to add user')
        }
    }

    return (
        <div className='flex flex-col items-center justify-center h-full bg-slate-700'>
            <h2 className='text-3xl font-semibold text-blue-600 mb-4'>Welcome to the Home Page!</h2>
            <p className='text-lg text-gray-700'>
                This is the main page of the app. You can add more content, features, or information here.
            </p>
            <div className='mt-6'>
                <p className='text-lg'>
                    Navigate through the sidebar to explore more pages.
                </p>
            </div>

            {/* User Form */}
            <div className='bg-white/30 h-[300px] w-[300px] m-2 rounded-md flex justify-center items-center text-white'>
                <div className='flex flex-col items-center'>
                    <h1 className='text-2xl mb-4'>Add New User</h1>
                    <input
                        type='text'
                        placeholder='Username'
                        className='mb-2 p-2 rounded-md text-black'
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type='password'
                        placeholder='Password'
                        className='mb-2 p-2 rounded-md text-black'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <input
                        type='text'
                        placeholder='2FA Secret (Optional)'
                        className='mb-2 p-2 rounded-md text-black'
                        value={twoFactorSecret}
                        onChange={(e) => setTwoFactorSecret(e.target.value)}
                    />
                    <label className='text-white'>
                        <input
                            type='checkbox'
                            className='mr-2'
                            checked={twoFactorEnabled}
                            onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                        />
                        Enable Two-Factor Authentication
                    </label>
                    <button
                        onClick={handleAddUser}
                        className='mt-4 p-2 bg-blue-500 rounded-md text-white'
                    >
                        Add User
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Home
