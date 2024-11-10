import React from 'react'

const Home: React.FC = () => {
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
        </div>
    )
}

export default Home
