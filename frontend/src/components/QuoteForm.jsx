import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PdfPreview from './pdfPreview';
import ClientInfo from './clientInfos';
import QuoteHeader from './QuoteHeader';
import WorkerInfo from './WorkerInfo';
import { ToWords } from 'to-words';
import { createPortal } from 'react-dom';

const QuoteForm = ({data, quoteId, accessToken, close}) => {

    const [quote, setQuote] = useState(data);
    console.log("Quote Id:",quoteId);
    console.log(quote);
    const materials  = quote.items.reduce((acc, item) => {
        const price = Number(item.lineTotal) ;
        return acc + price;
    }, 0);

    const laborEl = materials * 0.3;
    const general = materials + laborEl;

    const navigate = useNavigate();

    const [showForm, setShowForm] = useState(true);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [currency, setCurrency] = useState("");
    const [terms, setTerms] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [labor, setLabor] = useState(laborEl);
    const [materialsTotal , setMaterialsTotal] = useState(materials);
    const [generalTotal, setGeneralTotal] = useState(general);
    const [specificCient, setSpecificClient] = useState({
        id: "",
        name: "",
        client_phone: "",
        email: ""
    });

    useEffect(() => {
        setLabor(laborEl);
    }, [laborEl]);

    useEffect(() => {
        setMaterialsTotal(materials);
    }, [materials]);

    const toWords = new ToWords({
        localeCode: "fr-FR"
    });

    // Function to handle  in quote's items array
    const handleItemsChanges = (index, field, value) => {
        setQuote((prevQuote) => {
            const updatedItems = [...prevQuote.items];
           updatedItems[index] = {
            ...updatedItems[index],
            [field]: value
           };

           if (field === 'quantity' || field === 'unitPrice') {
            const quantity = Number(field === 'quantity' ? value : updatedItems[index].quantity) || 0;
            const unitPrice = Number(field === 'unitPrice' ? value : updatedItems[index].unitPrice) || 0;
            updatedItems[index].lineTotal = quantity * unitPrice;
           }

           return {
            ...prevQuote,
            items: updatedItems
           };
        });
    };

    // Function to handle the Document info changes
    const handleDocumentChanges = (field, value) => {
        setQuote((prevQuote) => ({
            ...prevQuote,
            document: {
                ...prevQuote.document,
                [field]: value
            }
        }));
    };

    // Function to handle the general quote info
    const handleQuoteChange = (field, value) => {
        setQuote((prevQuote) => ({
            ...prevQuote,
            [field]: value
        }))
    };

    // Function for form submission
    const handleFormSubmit = async (e) => {
         e.preventDefault();
         console.log(quoteId);
         try {
             const saveResponse = await fetch("http://localhost:5000/api/scan/save", {
                 method: "POST",
                 headers: {
                     "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                 },
                 body: JSON.stringify({
                     data: quote,
                     quoteId: quoteId
                 }),
             });

                if (!saveResponse.ok) {
                    throw new Error("Failed to save quote");
                }

                const saveResponseData = await saveResponse.json();
                const {message, quoteIdEl} = saveResponseData;
                console.log(quoteIdEl);

                const pdfGenResponse = await fetch(`http://localhost:5000/api/scan/quote/${quoteIdEl}/pdf`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const pdfBlob = await pdfGenResponse.blob(); // Read the response content and transform it into a blob,  returns a promise

                const url = URL.createObjectURL(pdfBlob); //Create a temporary url that points to the pdf
                setPdfUrl(url);
                setShowPreview(true); 
         } catch (error) {
             console.error("Error submitting form:", error);
         }
    };

    const handleDownload = () => {
        setIsDownloading(true);
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = "devis.pdf"; // Tells to the navigator to download the file
        link.click();
        URL.revokeObjectURL(pdfUrl); // release the memory used by the url once the download started

    };

    // Navigate to the base of the app
    const handleCancel = () => {
        setIsDownloading(false);
        setShowPreview(false);
        if (close) close();
        setShowForm(false);
        window.location.href = '/hdquote';  
    };

    // Function to add rows in the quote
    const handleAddRows = (index) => {
        setQuote( prev => {
            const newItems = [...prev.items];
            newItems.splice(index + 1, 0, {
                quantity: "",
                designation: "",
                unitPrice: "",
                lineTotal: ""
            });

            return {
                ...prev,
                items: newItems
            };
        });
    };

    // Function to delete a row
    const handleDeleteRow = (index) => {
        setQuote(prev => {
            const newItems = prev.items.filter((_, i) => i !== index);

            return {
                ...prev,
                items: newItems
            };
        });
    };

    // Close the preview of the generated pdf
    const onClose = () => {
        setShowPreview(false);
    };

    const savePrefernces = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/scan/preferences/${quoteId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type":"application/json"
                },
                body: JSON.stringify({
                    paymentMethod: paymentMethod,
                    terms: terms,
                    currency: currency
                })
            });

            if (!response.ok) {
                throw new Error("An error occured while saving or updating preferences");
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (showPreview) {
            savePrefernces();
        }
    }, [showPreview]);

    return createPortal(
        <div className='fixed inset-0 z-15 overflow-y-auto'>
        {showForm  && (
            <form
                onSubmit={handleFormSubmit}
                className="min-h-screen w-screen bg-white/70 flex flex-col space-y-2  items-center p-8 border border-white/90 rounded-3xl shadow-xl backdrop-blur-md overflow-auto">
                <div className='relative min-h-53 min-w-170'>
                    <div className='absolute top-2 left-3'>
                        <WorkerInfo accessToken={accessToken} />
                    </div>
                    <div className='absolute top-29 right-8'>
                        <ClientInfo accessToken={accessToken} quoteId={quoteId} clientName={quote.client_name} clientId={quote.client_id} clientPhone={quote.client_phone} clientEmail={quote.client_email} />
                    </div>
                    <div className='absolute top-3 right-8'>
                        <QuoteHeader quoteId={quoteId} accessToken={accessToken} showPreview={showPreview} />
                    </div>
                </div>
                <h3 className="w-full text-center text-2xl font-bold mb-4">
                    <input 
                        className="w-full border-none text-center text-2xl font-bold mb-4"
                        value={quote.document.title}
                        onChange={(e) => handleDocumentChanges('title', e.target.value)}
                    />    
                </h3>
                <table>
                    <thead>
                        <tr>
                            <th className="font-bold ">Qté</th>
                            <th className="font-bold ">Désignation</th>
                            <th className="font-bold ">P. Unitaire</th>
                            <th className="font-bold ">P. Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quote.items.map((item, index) => (
                            <tr key={index} className='group'>
                                <td>
                                    <input
                                    value={item.quantity}
                                    onChange={(e) => handleItemsChanges(index, 'quantity', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                    value={item.designation}
                                    onChange={(e) => handleItemsChanges(index, 'designation', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                    value={item.unitPrice}
                                    onChange={(e) => handleItemsChanges(index, 'unitPrice', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                    value={item.lineTotal}
                                    onChange={(e) => handleItemsChanges(index, 'lineTotal', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleAddRows(index)}
                                        className='text-cyan-800 h-12 px-2 bg-white/15 border border-white/95 rounded-full shadow-lg backdrop-blur-md font-semibold text-md cursor-pointer hover:-translate-y-0.7 transition-all duration-150 active:translate-y-1 active:shadow-md opacity-0 group-hover:opacity-100'
                                    >
                                        +
                                    </button>
                                    <button
                                        onClick={() => handleDeleteRow(index)}
                                        className='text-cyan-800 h-12 px-2 bg-white/15 border border-white/95 rounded-full shadow-lg backdrop-blur-md font-semibold text-md cursor-pointer hover:-translate-y-0.7 transition-all duration-150 active:translate-y-1 active:shadow-md opacity-0 group-hover:opacity-100'
                                    >
                                        x
                                    </button>
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <td colSpan="3">Total Matériel</td>
                            <td >
                                <input value={materialsTotal || 0}
                                onChange={(e) => setMaterialsTotal(e.target.value)} 
                                onFocus={(e) => e.target.select()}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="3">Total Main d'oeuvre</td>
                            <td >
                                <input value={labor || 0}
                                onChange={(e) => setLabor(e.target.value)} />
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="3">Total Général</td>
                            <td >
                                <input value={generalTotal || 0}
                                onChange={(e) => setGeneralTotal(e.target.value)} />
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div className='flex flex-col gap-5'>
                    {quote.grandTotal !== null && (<p>Net à payer: {toWords.convert(generalTotal)}</p>)}
                    <select
                        value={currency}
                        className=''
                        onChange={(e) => setCurrency(e.target.value)}
                    >
                        <option value="">Devise </option>
                        <option value="XAF">Franc CFA</option>
                        <option value="EUR">Euro</option>
                        <option value="USD">US Dollar</option>
                    </select>

                    <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                        <label>Mode de paiement</label>
                        <option value="">Mode de paiement</option>
                        <option value="Espèces">Espèces</option>
                        <option value="Virement bancaire">Virement bancaire</option>
                        <option value="Mobile Money">Mobile Money</option>
                    </select>
                    
                    <textarea
                        value={terms}
                        onChange={(e) => setTerms(e.target.value)}
                        placeholder='Termes et conditions...'
                    />
                </div>

                <div className="flex flex-row justify-between items-center" >
                    <button type="submit" className="text-cyan-800 h-12 px-2 bg-white/15 border border-white/95 rounded-xl shadow-lg backdrop-blur-md font-semibold text-md cursor-pointer hover:-translate-y-0.7 transition-all duration-150 active:translate-y-1 active:shadow-md" >Voir l'apperçu</button>
                    <button type="button" onClick={handleCancel} className="h-12 px-2 py-2 m-3 bg-white/15 border border-white/95 rounded-xl shadow-lg backdrop-blur-md font-medium text-base cursor-pointer duration-150 hover:-translate-y-0.8 active:translate-y-1 active:shadow-md">Annuler</button>
                </div>
                
            </form>           
        )}
        
        {showPreview && (
            <PdfPreview pdfUrl={pdfUrl} handleDownload={handleDownload} onClose={onClose} />
        )}
        </div>, document.body
    )
};

export default QuoteForm;