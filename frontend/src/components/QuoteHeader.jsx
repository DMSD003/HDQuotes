import { useState, useEffect } from "react";

const QuoteHeader = ({quoteId, accessToken, showPreview}) => {

    const [quoteCreationDate, setQuoteCreationDate] = useState("");
    const [validity, setValidity] = useState("");
    const [isValidityChanged, setIsValidityChanged] = useState(false);

    useEffect(() => {
        const getDate = async () => {

            const response = await fetch(`http://localhost:5000/api/scan/quoteDate/${quoteId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error("An error occured while getting quote's date");
            }
            const data = await response.json();
            console.log(data);
            const creationDate = data.date.creationDate.split("T")[0];
            console.log("creationDate:",creationDate);
            setQuoteCreationDate(creationDate);
            const validityDate = data.date.validityDate.split("T")[0];
            console.log("validity date:", validityDate);
            setValidity(validityDate);
        };

        getDate();
    }, []);

    const handleValidityChange = (event) => {
        setValidity(event.target.value);
        setIsValidityChanged(true);
    };

    const handleUpdateValidity = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/scan/quoteDate/${quoteId}`, {
                method:"PUT",
                headers:  {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    newValidity: validity
                })
            });
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (isValidityChanged) {
            handleUpdateValidity();
        }
    });

    return (
        <div className="flex flex-col justify-center">
            <h3>Devis</h3>
            <input
                type="date" 
                value={quoteCreationDate}
                readOnly
            />
            <input
                type="date"
                value={validity}
                onChange={handleValidityChange}
            />
        </div>
    )
};

export default QuoteHeader;