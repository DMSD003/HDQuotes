import { useState, useEffect } from "react";
import PdfPreview from "./pdfPreview";
import QuoteForm from "./QuoteForm";
import { Search } from 'lucide-react';
import QuoteRow from "./QuoteRow";

const Sidebar = ({accessToken, isOpen, close}) => {

    const [search , setSearch] = useState("");
    const [quotes, setQuotes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({message: "", type: ""});
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview,setShowPreview] = useState(false);
    const [edit, setEdit] = useState(false);
    const [quoteInfo, setQuoteInfo] = useState({});

    const triggerNotification = (message, type) => {
        setNotification({message, type});
        setTimeout(() => {setNotification({message: "", type: ""})}, 5000);
    };


    const fetchQuotes = async (searchTerm = "") => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/scan/quotes?title=${encodeURIComponent(searchTerm)}`, {
                method: "GET",
                headers: {
                    Authorization:  `Bearer ${accessToken}`
                }
            });

            const data = await response.json();
            console.log(data);
            setQuotes(data.quotes);
        } catch (error) {
            console.error("Error fetching quotes: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
      fetchQuotes();
    }, []);

    useEffect(() => {
      const timeoutId = setTimeout(() => {
        fetchQuotes(search);
      }, 400);
    
      return () => {
        clearTimeout(timeoutId);
      }
    }, [search]);
    
    const handleDeleteQuote = async (quoteId) => {
        console.log(quoteId);
        setQuotes((prevQuotes) => {
            const newQuotes = [...prevQuotes].filter(quote => quote.id !== quoteId);
            return newQuotes;
        });

        const deleteResponse = await fetch(`http://localhost:5000/api/scan/quote/${quoteId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        if (deleteResponse.ok) {
            triggerNotification("Devis supprimé avec succes", "success");
        } else  {
            triggerNotification("Echec de la suppression du devis", "error");
        }
    };

    const handleSeePdf = async (quoteId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/scan/quote/${quoteId}/pdf-file`, {
                method: "GET",
                headers: {Authorization: `Bearer ${accessToken}`}
            });

            if (!response.ok) {
                triggerNotification("Impossible charger le PDF", "error");
                return;
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
            setShowPreview(true);
        } catch (error) {
            console.error("Error loading Pdf: ", error);
            triggerNotification("Erreur lors du chargement du PDF", "error");
        }
    };

    const handleDownload = () => {
       const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = "devis.pdf"; // Tells to the navigator to download the file
        link.click();
        URL.revokeObjectURL(pdfUrl); // release the memory used by the url once the download started 
    };

    const onClose = () => {
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        setShowPreview(false);
    };

    const handleEdit = async (quoteId) => {
        
        const editResponse = await fetch(`http://localhost:5000/api/scan/quote/${quoteId}/edit`, {
            method: "GET",
            headers: { Authorization: `Bearer ${accessToken}`}
        });

        if (editResponse.ok) {
            setEdit(true);
            const quoteData = await editResponse.json();
            console.log(quoteData);
            console.log('quots data to edit: ', quoteData.data.items);
            setQuoteInfo(quoteData.data);
        } else {
            triggerNotification("Echec de l'obtention du devis.", "error");
        }

    }

    return (
        <>
        {isOpen && (
            <div className="fixed inset-0 bg-black/40 z-30"
                onClick={close}
            />
        )}
        <div className={`fixed top-0 left-0 h-full w-72 sm:w-80 z-40 bg-white/70 flex flex-col space-y-2 overflow-y-auto  items-center p-8 border border-white/90 rounded-3xl shadow-xl backdrop-blur-md overflow-auto transform transition-transform duration-300 ease-in-out
            ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <img src="../../public/HdquoteIcon.png" alt="The-logo-of-the-app" className="w-23 relative top-11 h-14 self-start shadow-xl backdrop-blur-md focus:ring-2 focus-ring-blue-300 rounded rounded-full"/>
            <button className="self-end w-8 mb-4 p-1 bg-white/15 border border-white/95 rounded-xl shadow-lg backdrop-blur-md font-medium text-base cursor-pointer duration-150 hover:-translate-y-0.8 active:translate-y-1 active:shadow-md" onClick={close} >x</button>
            <h3 className="text-lg font-bold font-['Poppins'] text-[#1F4F4A] sm:text-base md:text-base text-center">
                HDquotes
            </h3>
            <div className="relative w-full">
                <Search 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    size={18}
                />
                <input 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un devis..."
                    className="w-full pl-10 pr-3 py-2 text-sm sm:text-base rounded-md border border-white/90 shadow-xl backdrop-blur-md focus:ring-2 focus-ring-blue-300"
                />
            </div>
            <hr className="border-t-2 border-gray-800 my-4" />
            {search ? (
                <p className="font-bold font-['Poppins']">Resultats de la recherche</p>
            ) : (
                <p className="font-bold font-['Poppins']">Récents</p>
            )}
            {isLoading ? (
                [...Array(10).map((_,i) => <div className="flex flex-col gap-2 p-2 border-b border-white-10 animate-pulse">
                    <div className="h-4 bg-gray-300/30 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300/20 rounded w-1/2"></div>
                </div>)]
            ) : quotes.length === 0 ? (
                <p className="text-center font-bold font-['Poppins'] text-gray-400 p-4">Aucun devis trouvé</p>
            ) : (
                quotes.map(quote => <div className="min-w-0 p font-base font-['Poppins'] bg-white/70 shadow-xl backdrop-blur-md focus:ring-2 focus-ring-blue-300 rounded rounded-lg" key={quote.id}>
                    <QuoteRow quote={quote} onDelete={() => handleDeleteQuote(quote.id)} onView={() => handleSeePdf(quote.id)} onEdit={() => handleEdit(quote.id)} />
                    {edit && quoteInfo.items && (
                        <QuoteForm data={quoteInfo} quoteId={quote.id} accessToken={accessToken} close={() => setEdit(false)}/>
                    )}
                    {showPreview && (
                        <PdfPreview pdfUrl={pdfUrl} handleDownload={() => handleDownload()} onClose={onClose} />
                    )}
                </div>)
            )}

            <hr className="border-t-2 border-gray-300 my-4" />

            {notification.message && (
                <div className={`max-w-sm p-4 z-50 rounded-xl border text-sm font-medium shadow-lg transition-all duration-500 ease-out
                    ${notification.type === 'succes'
                        ? 'bg-[#14231c] border-emerald-500/30 text-emerald-400'
                        : 'bg-[#291415] border-red-500/30 text-red-400'
                    }`} >
                        <span>{notification.message}</span>
                </div>
            )}
        </div></>
    );
};

export default Sidebar;