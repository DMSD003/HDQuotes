import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuoteForm from './QuoteForm';
import SendingOptions from './SendingOptions';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { createPortal } from 'react-dom';

const CameraCapture = () => {

    // All necessary states
    const [images, setImages] = useState([]); // images to send to the backend service
    const [capturedImages, setCapturedImages] = useState([]); // Images just took and validated
    const [isCameraOpen, setIsCameraOpen] = useState(false); // If the camera is opened
    const [quoteData, setQuoteData] = useState({}); // the quote object sent from the backend service
    const [quoteId, setQuoteId] = useState(""); // The id of the scanned document sent by the backend service  
    const [showCanvas, setShowCanvas] = useState(false);
    const [showRetry, setShowRetry] = useState(false); // for When the AI service is temporary unavailable  
    const [isLoading, setIsLoading] = useState(false); // When the AI is parsing the images just saptured
    const [showOptions, setShowOptions] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Refferences for video and canvas
    const videoRef = useRef(null);
    const canvaRef = useRef(null);
    const inputRef = useRef(null);

    const navigate = useNavigate();

    useEffect(() => {
        if (isCameraOpen) {
            let stream ;
            const startCamera = async () => {
                try {
                     stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            facingMode: {ideal: "environment"},
                            
                        },
                        audio: false
                    });

                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }

                } catch (error) {
                    console.error("camera error:", error);
                }
            };

            startCamera();

            return() => {
                if (stream) {
                    stream.getTracks().forEach(track => {
                        track.stop();
                    });
                }
            }
        }
    }, [isCameraOpen]);

    // 1- Function to open the camera
    const handleOpenCamera = async () => {
        setShowCanvas(false);
        setIsCameraOpen(true);
    }

    // 2- Function to close the camera
    const handleCloseCamera = () => {
        setIsCameraOpen(false);
        
    };

    
    // 3- Function to take the photo of the document
    const handleCapturePhoto = () => {
        setIsCameraOpen(true);
        setShowCanvas(true);
        const video = videoRef.current; 
        const canva = canvaRef.current;
        console.log(canva);
        console.log("isCameraOpen:", isCameraOpen, "videoRef:", videoRef.current);

        const context = canva.getContext('2d');
        canva.height = video.videoHeight;
        canva.width = video.videoWidth;
        context.drawImage(video, 0, 0, canva.width, canva.height);

        canva.toBlob((blob) => {
            setCapturedImages(prevImages =>
            [...prevImages, blob]
            );
        }, 'image/jpeg');
        handleCloseCamera();
    };

    // 4- Function to retake the photo
    const handleRetakePhoto = () => {
        setCapturedImages([]);
        handleCloseCamera();
    };

    // 5- Function to validate a photo. This gives images []
    const handleValidatePhoto = () => {
        setImages(prevImages => [
            ...prevImages,
            ...capturedImages 
        ]);
        console.log(images, capturedImages);
        setCapturedImages([]);
        handleCloseCamera();
    };

    const accessToken = localStorage.getItem('accessToken');

    // 6- Function to show a quote's preview
    const handleShowPreview = async () => {
        setIsLoading(true);
        const formData = new FormData();
        images.forEach((image) => {
            formData.append("images", image);
        });

        const response = await fetch("http://localhost:5000/api/scan/upload", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            body: formData
        });

        const dataEl = await response.json();
        

        if (dataEl.error === "AI_SERVICE_UNAVAILABLE" || dataEl.error === "Invalid Json object" || dataEl.error === "error while uploading the scan") {
            setShowRetry(true);
            return;
        }

        const {message, quoteIdEl, data} = dataEl;
        console.log(quoteIdEl);
        setQuoteData(data);
        setIsLoading(false);
        setQuoteId(quoteIdEl);
        console.log(quoteId);
    };

    // Function to cancel the hole operation
    const handleCancelOperation = () => {
        setImages([]);
        setCapturedImages([]);
        setQuoteData({});
        setDocumentId("");
        handleCloseCamera();
        navigate('/hdquote');
    };

    // Function to retry to send images to the AI servvie
    const handleRetry = () => {
        setShowRetry(false);
        handleShowPreview();
    };

    // Function to open file explorer
    const handleOpenFile = () =>  {
        inputRef.current.click();
    };

    // Function to show the ways to send images to the service
    const handleShowOptions = () => {
        setShowOptions(true);
    }

    const handleImportImages = (event) => {
        const files = Array.from(event.target.files);

        if (files.length === 0) return;

        setCapturedImages(prevImages => [
            ...prevImages,
            ...files
        ]);
    };

    return (
        <div className="h-screen w-screen bg-transparent flex flex-col items-center justify-center p-8 relative z-2" >
            <div className='relative '>
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className='fixed p-2 left-5 top-5 rounded hover:bg-white/10 bg-white/15 border border-white/95 rounded-xl shadow-lg backdrop-blur-md font-medium text-base cursor-pointer duration-150 hover:-translate-y-0.8 active:translate-y-1 active:shadow-md'
                    aria-label='Open the menu'
                >
                    <Menu size={24} />
                </button>
                <Sidebar accessToken={accessToken} isOpen={isSidebarOpen} close={() => setIsSidebarOpen(false)} />
            </div>
            {capturedImages.length < 1 && images.length < 1  && (
                <div className="astuce relative flex flex-col justify-center items-center">
                <img src="../../public/HdquoteIcon.png" alt="Logo-of-the-app" className='w-50 h-30 text-center'/>
                    <h4 className="text-center text-xl font-bold font-['Poppins'] text-[#1F4F4A] mb-4">Astuce: prendre ou importer des photos claires avec un éclairage adéquat.</h4>
                </div>
            )}

            {capturedImages.length > 0 && (
                <>
                    <img src={URL.createObjectURL(capturedImages[capturedImages.length - 1])} alt='Captured image'/>
                    <button onClick={handleValidatePhoto} className="absolute bottom-4 right-4 cursor-pointer text-3xl font-bold" > ✓ </button>
                    <button onClick={handleRetakePhoto} className="absolute bottom-4 left-4 cursor-pointer text-3xl font-bold" > ↺ </button>
                </>
            )}
             
            <canvas ref={canvaRef} style={{ display: "none" }}/>
            <input
                type='file'
                ref={inputRef}
                hidden
                multiple
                accept='image/png,image/jpeg,image/jpg'
                onChange={handleImportImages}
            />
            <div className="absolute flex flex-row justify-between items-center gap-4 bottom-3 h-12 p-3  bg-white/15 border border-white/95 rounded-xl shadow-lg backdrop-blur-md">
                {images.length < 6 && (
                <div className="camera-container relative w-20">
                    {!isCameraOpen && (
                        <>
                            <button onClick={handleShowOptions} className="w-8 px-2 py-2 m-3 bg-white/15 border border-white/95 font-bold rounded-xl shadow-lg backdrop-blur-md cursor-pointer duration-150 hover:-translate-y-0.8 active:translate-y-1 active:shadow-md"> + </button>
                            {showOptions && (
                                <SendingOptions handleCapturePhoto={handleCapturePhoto} handleOpenFile={handleOpenFile} />
                            )}
                        </>
                    )}
                </div>
                )}
                {!isCameraOpen && images.length > 0 && (
                    <>
                        <button onClick={handleShowPreview} className=" bg-white/15 border border-white/95 rounded-md shadow-lg backdrop-blur-md cursor-pointer duration-150 hover:-translate-y-0.8 active:translate-y-1 active:shadow-md">Voir l'apperçu</button>
                        <button onClick={handleCancelOperation} className=" bg-white/15 border border-white/95 rounded-md shadow-lg backdrop-blur-md cursor-pointer duration-150 hover:-translate-y-0.8 active:translate-y-1 active:shadow-md">Annuler</button>
                    </>
                )}
                {showRetry && (
                    <button onClick={handleRetry} className=" bg-white/15 border border-white/95 rounded-md shadow-lg backdrop-blur-md cursor-pointer duration-150 hover:-translate-y-0.8 active:translate-y-1 active:shadow-md">Rééssayer</button>
                )}
            </div>
            {isLoading ? (
                <p>Analyse...</p>
            ) : Object.keys(quoteData).length > 0 ? (
                <QuoteForm data={quoteData} quoteId={Number(quoteId)} accessToken={accessToken} />
            ): 
                <div className="relative z-[-3] max-h-[400px] grid-cols-2 sm:grig-cols-3 md:grid-cols-5 gap-4 px-2 py-2 m-3 bg-white/15 border border-white/95 rounded-xl shadow-lg backdrop-blur-md">
                    {images.map((image, index) => (
                        <img
                        key={index}
                        className='w-auto h-auto object-cover'
                        src={URL.createObjectURL(image)}
                        alt={`Page ${index+1}`} />
                    ))}
                </div> }
            {isCameraOpen && (
                <div className="camera-container relative h-full w-full">
                    <video ref={videoRef} muted autoPlay playsInline className="w-full h-auto" />
                    <button className="absolute top-4 right-4 cursor-pointer text-3xl font-bold" onClick={handleCloseCamera} > x </button>
                    <button className="absolute bottom-4 left-50 cursor-pointer text-3xl font-bold" onClick={handleCapturePhoto} > ⬯ </button>
                    
                </div>
            )}
        </div>
    );
}
export default CameraCapture;