import React from 'react';

/**
 * Component to choose a way to send images to the scan service
 * 
 * @param {function(): void}  handleCapturePhoto callback function when the user choose to take the photo
 * @param {function(): void} handleImportPhoto callback function when the user choose to import an image
 * 
 * @returns {JSX.Element} sending options element
    
*/
const SendingOptions = ({handleCapturePhoto, handleOpenFile}) => {

    return (
        <div className=' flex flex-col justify-center items-center bg-white/70 border border-white/90 rounded-3xl shadow-xl backdrop-blur-md space-y-3'>
            <button onClick={handleCapturePhoto} type='button' aria-label='take photo' className='inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/70 border border-white/90 rounded-3xl shadow-xl backdrop-blur-md text-md font-medium hover:bg-white/40 hover:ring-2 hover:ring-blue-300 hover:ring-offset'>
                <svg
                    xmlns='http://w3.org'
                    className='w-5 h-5 shrink-0'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth={2}
                    strokeLinecap='round'
                    strokeLinejoin='round'
                >
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/>
                    <circle cx="12" cy="13" r="3" />
                </svg>
            </button>

            <button onClick={handleOpenFile} type='button' aria-label='import photo' className='inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/70 border border-white/90 rounded-3xl shadow-xl backdrop-blur-md text-md font-medium hover:bg-white/40 hover:ring-2 hover:ring-blue-300 hover:ring-offset'>
                <svg
                    xmlns='http://w3.org'
                    className='w-5 h-5 shrink-0'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth={2}
                    strokeLinecap='round'
                    strokeLinejoin='round'
                >
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    <circle cx="9" cy="9" r="2" />
                </svg>
            </button>
        </div>
    )
}

export default SendingOptions