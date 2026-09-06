import React, { useState, useEffect } from "react";

const ClientInfo = ({accessToken, quoteId, clientName, clientId, clientPhone, clientEmail}) => {

    const [clients, setClients] = useState([]);
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [showOptions, setShowOptions] = useState(false);
    const [clientEl, setClientEl] = useState({
        id: 0,
        user: 0,
        name: "",
        phone: "",
        email: ""
    });

    useEffect(() => {
      if (clientName || clientEmail || clientPhone) {
        setClientEl({
            id: clientId || 0,
            user: 0,
            name: clientName,
            phone: clientPhone,
            email: clientEmail
        });
      }
    }, [clientName, clientPhone, clientEmail, clientId]);

    useEffect(() => {
        const getClient = async () => {
           
            try {
                const response = await fetch("http://localhost:5000/api/scan/getClient", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });

                const clientsData = await response.json();
                console.log("client data just got:", clientsData);
                setClients(clientsData.infos);
            } catch (error) {
                console.error("client infos error:", error);
            }
        };

        getClient();
    }, [clientEl.name]);


    const handleChange = (event) => {

        const {name, value} = event.target;

        setClientEl((prevClient) => ({
            ...prevClient,
            [name]: value
        }));
        const results = clients.filter(client => 
            client.name.toLowerCase().includes(clientEl.name.toLowerCase())
        );

        setFilteredOptions(results);
        if (filteredOptions.length > 0) {
            setShowOptions(true);
        }
    };

    const updateQuoteClientId = async (quoteId, clientId) => {
       try {
            await fetch (`http://localhost:5000/api/scan/quote/${quoteId}/client`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({clientId})
            });
       } catch (error) {
        console.error("Error linking client to quote:", error);
       }
    }

    const handleSaveNewClient = async () => {
        try {
            const savingResponse = await fetch("http://localhost:5000/api/scan/client", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: clientEl.name,
                    email: clientEl.email,
                    phone: clientEl.phone
                }),
            });
            const data = await savingResponse.json();
            return data.id;
            
        } catch (error) {
            console.error("error from saving client:" , error);
        }
    };

    const handleCLientBlur = async (e) => {
        const nextElement = e.relatedTarget;
        if (nextElement && e.currentTarget.contains(nextElement)) {
            return;
        }
        if (!clientEl.name.trim() && !clientEl.email.trim()&& !clientEl.phone.trim()) return;
        const existingCLient = clients.find(client => client.name === clientEl.name);

        if (existingCLient) {
            setClientEl({
                    name: existingCLient.name,
                    email: existingCLient.email,
                    phone: existingCLient.client_phone
            });
            setShowOptions(false);
            await updateQuoteClientId(quoteId, existingCLient.id);
        } else {
        
            const newClient = await handleSaveNewClient();
            console.log(newClient);
            await updateQuoteClientId(quoteId, newClient)
        }
    };

    const handleSelectClient = async (client) => {
            setClientEl({
                id: client.id,
                user: 0,
                name: client.name,
                email: client.email,
                phone: client.client_phone
            });
            setShowOptions(false);
            await updateQuoteClientId(quoteId, client.id);
            
        
    };

    return (
        <div className="flex flex-col justify-center" onBlur={handleCLientBlur}>
            <p>informations du client</p>
            <input
                name="name"
                value={clientEl.name}
                onChange={handleChange}
            />
            <input 
                name="email"
                onChange={handleChange}
                value={clientEl.email}
            />
            <input 
                name="phone"
                onChange={handleChange}
                value={clientEl.phone}
            />
            {showOptions && (
                <ul>
                    {filteredOptions.map(client => (
                        <li
                            key={client.id}
                            onClick={() => handleSelectClient(client)}
                        >
                            {clientEl.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default ClientInfo;