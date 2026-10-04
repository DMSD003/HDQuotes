import React, { useState } from 'react';
import { createPortal } from 'react-dom';

const PdfPreview = ({pdfUrl, handleDownload, onClose}) => {
    const is Mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    return createPortal(
        <div className="h-screen w-screen fixed top-0 left-0 z-20 flex flex-col justify-between items-center">
            <button
            type="button"
                onClick={onClose}
                className="absolute top-5 right-5"
            >x</button>
            {isMobile ? (
                <a href={pdfUrl} target="_blank" rel="noreferrer"
                    className="px-4 py-2 rounded bg-blue-500 text-white">
                    Ouvrir le PDF
                </a>
            ): (
                <iframe className="h-full w-full" src={pdfUrl} alt="Preview of the generated pdf" />
            )}
            <button 
                type="button"
                onClick={handleDownload}
                className="text-cyan-800 h-10 px-2 bg-white/15 border border-white/95 rounded-xl shadow-lg backdrop-blur-md font-semibold text-md cursor-pointer hover:-transalte-y-0.7 transition-all duration-150 active:translate-y-1 active:shadow-md"
            >Telecharger le pdf</button>
        </div>, document.body
    )
};

export default PdfPreview;