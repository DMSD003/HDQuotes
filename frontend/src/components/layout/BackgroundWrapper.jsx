import React from 'react';

const BackgroundWrapper = ({children}) => {

    return (
        <div className="app-container relative h-screen w-screen bg-[#eef2f7] min-h-screen w-screen overflow-x-hidden transition-[#eef2f7] duration-500 ease">

            {/* fond de grille triangulaire*/}
                
            <div className="content-safe-layer flex justify-center items-center h-[100vh] px-[2.5rem] py-[1.25rem]">
               {children} 
            </div>
        </div>
    );
}

export default BackgroundWrapper; 