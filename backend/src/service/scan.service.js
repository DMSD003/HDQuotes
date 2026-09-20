const pool = require('../../pool');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const pdfDoc = require('pdfkit');
const { ToWords } = require('to-words');
const supabase = require('../../config/supabase');

exports.upload = async (userId, imagesPath, mimeImagesType) => {
    

    // ------------------- SENDING A PROMPT TO AI TO ANALYSE THE DOCUMENT ----------------

    // Convert the files in Binary because of the dest parameter in upload
    const imagesBuffer = imagesPath.map(imagePath => fs.readFileSync(imagePath));

    // Convert the files in Base64, because the AI only understand that
    const imagesBase = imagesBuffer.map(imageBuffer => imageBuffer.toString("base64"));
    
    // The prompt
    const prompt =`Tu es un expert en analyse de devis manuscrits. Analyse très attentivement l'image fournie. Ta mission est d'extraire les informations du devis avec la plus grande fidélité possible. Règles : 
    1- Ne corrige pas le contenu écrit par l'utilisateur,
    2- Si une valeur est illisible remplace la par null,
    3- Si une valeur est abscente remplace la par null et ne l'invente jamais,
    4- Ne fais jamais de calculs,
    5- Ne déduis aucune valeur manquante,
    6- Ne reformule pas les désignations,
    7- Respecte exactement les nombres écris,
    8- Répond uniquement avec un objet JSON valide,
    9- N'ajoute aucune expilcation, aucun commentaire, aucun texte avant et après le JSON,
    10- Renvoie seulement et uniquement un objet JSON valide comme réponse,
    11- Si il ya plusieur pages , elles seront pour un même devis, analyse les dans leur ordre et considère-les comme un seul document,
    12- Pour toutes les valeurs numériques (unitPrice, lineTotal, quantity, labor, materialsTotal, grandTotal) , renvoie uniquement des chiffres bruts sans espaces de séparation des milliers (exemple: écris 3000 et non 3 000),
    13- La propriété quantity doit être un nombre pur. Si une unité de msure est présente (comme kg, m, litres,sacs), extrait uniquement le nombre pour quantity et bascule l'unité textuelle à la fin de la propriété designation pour faciliter les calculs totaux plutard (exemple: pour '1kg de colle', renvoie quantity: 1 et desigantion colle (kg)),
    14- Tu ne renvoie aucun caractère en trop avant ou après le json que tu rnevoie , uniquement le json sur lequel je ne fais que insister, aucunne balise json, juste l'objet json de telle sorte que l'opération JSON.parse(response.text) se passe très bien

    Le JSON doit respecter exactement la structure suivante: 
    {
        document: {
            "title": "",
            "date": ""
        },
        items: [
            {
                "quantity": "",
                "designation": "",
                "unitPrice": "",
                "lineTotal": ""
            }
        ],
        "labor": null,
        "materialsTotal": null,
        "grandTotal": null
    }`;

    // Configure the ai service
    const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

    const aiContent = [
        {text: prompt}
    ]

    for (let i = 0; i < imagesBase.length; i++) {
        aiContent.push({
            inlineData: {
                mimeType: mimeImagesType[i],
                data: imagesBase[i]
            }
        })
    }
    // Makes an API request to generate content with a given model
    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: aiContent,
        config: {
            responseMimeType: 'application/json'
        }
    });

    // Retrieve the response
    const responseText = response.text;
    let data;
    try {
        data = JSON.parse(responseText);
    } catch (error) {
        console.error("Json parsing error",error);
        throw new Error("AI_RETURNED_INVALID_JSON"); 
    }
    console.log(responseText);

    // Verify the structure of the response object
    console.log(data);
    if (!data ) {
        throw new Error('AI_RETURNED_INVALID_JSON OR A_BAD_OBJECT_STRUCTURE');
    }

    // Release the imagesPath array 
    for (const imagePath of imagesPath) {
        await fs.promises.unlink(imagePath);
    }

    // Insert the gennerals document's info in the DB
    const title = data.document.title;

    const quote = await pool.query('INSERT INTO quotes(user_id, title) VALUES($1, $2) RETURNING id', [userId, title]);
    const quoteId = quote.rows[0].id;
    console.log(quoteId);
    return { data, quoteId };
}

// saving service
exports.save = async(data, userId, quoteId) => {
        // Updating the quote status to 'terminé' only if it is not yet definined to 'treminé'
        const result = await pool.query('UPDATE quotes SET status=$1 WHERE id=$2 AND user_id=$3 AND status <> $1', ['terminé', quoteId, userId]);
        console.log(result.rowCount);

        // Inserting each quote's line with a transaction because many queries should be considered as one
        const client = await pool.connect(); // request a specific connection in the pool so all the transaction can be executed in that one connexion

        try {
            await client.query('BEGIN'); // Start the transaction

            await client.query('DELETE FROM quote_items WHERE quote_id=$1', [quoteId]);

             for (let item of data.items) {
                await client.query('INSERT INTO quote_items(quote_id, designaion, unit_price, quantity, total_price) VALUES($1, $2, $3, $4, $5)', [quoteId, item.designation, item.unitPrice, item.quantity, item.lineTotal]);
            }

            await client.query("COMMIT") // Validate all queries since the BEGIN query
        } catch (error) {
            await client.query("ROLLBACK"); // Cancel all queries since the BEGIN query if an error occurs
            console.error("ERREUR ROLLBACK :", error);
            throw error;
        } finally {
            client.release(); // Give up the connection anyway
        }
        console.log("quote id from service:" ,quoteId);
        return { quoteId };
}

// Generate the pdf 
exports.pdfGen = async(userId, quoteId) => {
    try {
        // Generals quote's info with Left join because terms and payment method can be empty or null
        const generalInfo = await pool.query(`
            SELECT 
                u.name AS user_name,
                u.email AS user_email,
                u.user_phone,

                q.title,
                q.quote_date AS initial_date,
                q.quote_validity,

                c.name AS client_name,
                c.client_phone,
                c.email AS client_email,

                up.payment_method,
                up.terms,
                up.currency

            FROM users u
            LEFT JOIN client c ON c.user_id = u.id
            LEFT JOIN quotes q ON q.user_id = u.id AND q.client_id = c.id
            LEFT JOIN user_preference up ON up.quote_id = q.id AND up.user_id = u.id
            WHERE u.id = $1 AND q.id = $2
            `, [userId, quoteId]);

        // Main quote's info 
        const mainInfo = await pool.query('SELECT designaion, unit_price, quantity, total_price FROM quote_items WHERE quote_id = $1', [quoteId])

        if (generalInfo.rowCount === 0 || mainInfo.rowCount === 0) {
            throw new Error('FORBIDEN');
        }

        // Start drawing the quote
        const doc = new pdfDoc({
            size: "A4", // The size of the pdf paper
            margin: 20, 
        });

        const toWords = new ToWords({
            localeCode: "fr-FR"
        });

        const chunks = [];

        // Writting user Infos on the final quote
        doc.fillColor('#D9F0ED').strokeColor('#555555').rect(20, 49, 170, 15).fillAndStroke();
        doc.fillColor('#1F4F4A').font('Helvetica-Bold').fontSize(11).text("Prestataire", 24, 53);
        doc.fillColor('#222222').font('Helvetica');
        doc.rect(20, 64, 170, 15).stroke();
        doc.font('Helvetica-Bold').fontSize(10).text(`Nom: ${generalInfo.rows[0].user_name}`, 24, 68);
        doc.rect(20, 79, 170, 15).stroke();
        doc.font('Helvetica-Bold').fontSize(10).text(`Email :${generalInfo.rows[0].user_email}`, 24, 83);
        doc.rect(20, 94, 170, 15).stroke();
        doc.font('Helvetica-Bold').fontSize(10).text(`Tel: ${generalInfo.rows[0].user_phone}`, 24, 98);

        // Writting quote date informations
        doc.fillColor('#D9F0ED').strokeColor('#555555').rect(378, 49, 141, 20).fillAndStroke();
        doc.fillColor('#1F4F4A').font('Helvetica-Bold').fontSize(13).text("DEVIS", 382, 53);
        doc.fillColor('#222222').font('Helvetica');
        doc.rect(378, 69, 141, 15).stroke();
        doc.font('Helvetica-Bold').fontSize(10).text(`Date d'émission: ${generalInfo.rows[0].initial_date.toISOString().split("T")[0]}`, 380, 71);
        doc.rect(378, 84, 141, 15).stroke();
        doc.font('Helvetica-Bold').fontSize(10).text(`Date de validité: ${generalInfo.rows[0].quote_validity.toISOString().split("T")[0]}`, 380, 86);

        // Writting the client informations$
        doc.fillColor('#D9F0ED').strokeColor('#555555').rect(348, 138,  170, 15).fillAndStroke();
        doc.fillColor('#1F4F4A').font('Helvetica-Bold').fontSize(11).text("Client", 350, 143);
        doc.fillColor('#222222').font('Helvetica');
        doc.rect(348, 153, 170, 15).stroke();
        doc.font('Helvetica-Bold').fontSize(11).text(`Nom: ${generalInfo.rows[0].client_name}`, 350, 155);
        doc.rect(348, 168, 170, 15).stroke();
        doc.font('Helvetica-Bold').fontSize(11).text(`Tel: ${generalInfo.rows[0].client_phone}`, 350, 170);
        doc.rect(348, 183, 170, 15).stroke();
        doc.font('Helvetica-Bold').fontSize(11).text(`Email: ${generalInfo.rows[0].client_email}`, 350, 185);

        // The Object of the quote
        doc.font('Helvetica-Bold').fontSize(13).text(`Objet: ${generalInfo.rows[0].title}`, 20, 220, {underline: true, align: "center"});

        // The main information of the quote
        doc.fillColor('#D9F0ED').strokeColor('#555555').rect(20, 254, 25, 20).stroke().fill("");
        doc.fillColor('#1F4F4A').font('Helvetica-Bold').fontSize(12).text("N°", 23, 257);
        doc.fillColor('#D9F0ED').strokeColor('#555555').rect(45, 254, 40, 20).stroke().fill("");
        doc.fillColor('#1F4F4A').font('Helvetica-Bold').fontSize(12).text("Qté",48, 257);
        doc.fillColor('#D9F0ED').strokeColor('#555555').rect(85, 254, 230, 20).stroke().fill("");
        doc.fillColor('#1F4F4A').font('Helvetica-Bold').fontSize(12).text("Désignation", 88, 257);
        doc.fillColor('#D9F0ED').strokeColor('#555555').rect(315, 254, 60, 20).stroke().fill("");
        doc.fillColor('#1F4F4A').font('Helvetica-Bold').fontSize(12).text("P. Unitaire", 318, 257);
        doc.fillColor('#D9F0ED').strokeColor('#555555').rect(375, 254, 60, 20).stroke().fill("");
        doc.fillColor('#1F4F4A').font('Helvetica-Bold').fontSize(12).text("P. Total", 378, 257);
        doc.fillColor('#222222').font('Helvetica');

        let height = 274;
        let rowCount = 1;
        for (let row of mainInfo.rows) {

            if (doc.y + 17 > 802) {
                doc.addPage();
                height = 20;
            }

            doc.rect(20, height, 25, 17).stroke(); 
            doc.rect(45, height, 40, 17).stroke();
            doc.rect(85, height, 230, 17).stroke(); 
            doc.rect(315, height, 60, 17).stroke(); 
            doc.rect(375, height, 60, 17).stroke();

            
            doc.fontSize(11).text(`${rowCount}`, 23, height + 3);
            doc.fontSize(11).text(`${row.quantity}`, 48, height + 3);
            doc.fontSize(11).text(`${row.designaion}`, 88, height + 3);
            doc.fontSize(11).text(`${row.unit_price}`, 318, height + 3);
            doc.fontSize(11).text(`${row.total_price}`, 378, height + 3);
            height += 17;
            rowCount ++;
        }
        
        // The total materials amount
        const totalMaterials = mainInfo.rows.reduce((acc, row) => {
            const price = parseFloat(row.total_price) || 0;
            return acc + price;
        }, 0);

        // The labor Calculation
        const labor = totalMaterials * 0.3;

        // The genralAmount
        const generalAmount = totalMaterials + labor;

        if (doc.y + 60 > 802) {
            doc.addPage();
            height = 20;
        }
        doc.rect(20, height, 355, 20).stroke();
        doc.rect(375, height, 60, 20).stroke();
        doc.rect(20, (height + 20), 355, 20).stroke();
        doc.rect(375, (height+20), 60, 20).stroke();
        doc.rect(375, (height+40), 60, 20).stroke();
        doc.rect(20, (height+40), 355, 20).stroke();

       doc.font('Helvetica-Bold').text("Total Matériels",100, height+3).fontSize(12);
       doc.font('Helvetica-Bold').text(`${totalMaterials}`, 378, height+3).fontSize(12);
       doc.font('Helvetica-Bold').text("Main d'oeuvre", 100, height + 23).fontSize(12);
       doc.font('Helvetica-Bold').text(`${labor}`, 378, height + 23).fontSize(12);
       doc.font('Helvetica-Bold').text("Total General", 100, height + 43).fontSize(12);
       doc.font('Helvetica-Bold').text(`${generalAmount}`, 378, height + 43).fontSize(12);

       // Terms, payment method
       if (doc.y > 802) {
            doc.addPage();
        }
       doc.font('Helvetica-Bold').fontSize(11).text(`Net à payer: ${toWords.convert(generalAmount)} ${generalInfo.rows[0].currency}`, 25, doc.y +10);

       doc.font('Helvetica-Bold').fontSize(11).text(`Mode de paiement: ${generalInfo.rows[0].payment_method}`, 25, doc.y);

       doc.font('Helvetica-Bold').fontSize(9).text(`Termes: ${generalInfo.rows[0].terms}`, 30, doc.y, {align: "center"});

        const pdfPath = `pdfs/quote-${quoteId}.pdf`;
        
        await pool.query('INSERT INTO quote_pdf(quote_id, pdf_url) VALUES ($1, $2) ON CONFLICT (quote_id) DO UPDATE SET pdf_url = EXCLUDED.pdf_url',[quoteId, pdfPath]);

        return await new Promise((resolve, reject) => {
            doc.on("data", (chunk) => {chunks.push(chunk);});
            doc.on("end", () => {
                const pdfBuffer = Buffer.concat(chunks);
                //fs.promises.writeFile(pdfPath, pdfBuffer);
                supabase.storage.from('pdfs').upload(pdfPath, pdfBuffer, {contentType: 'application/pdf'});
                resolve(pdfBuffer);
            })
            doc.on("error", reject);
             doc.end();
        })

        
    } catch (error) {
        console.error("Pdf service failled", error);
    }
};

exports.getClient = async (userId) => {
    const clientInfos = await pool.query('SELECT * FROM client WHERE user_id=$1', [userId]);

    const infos = clientInfos.rows;
    console.log("client infos:",infos);
    return { infos };
};

exports.saveClient = async (userId, name, email, phone) => {

    const result = await pool.query('INSERT INTO client(user_id, name, client_phone, email) VALUES($1, $2, $3, $4) ON CONFLICT (user_id, name) DO UPDATE SET client_phone = EXCLUDED.client_phone email = EXCLUDED.email RETURNING id ', [userId, name, phone, email]);
    const clientId = result.rows[0].id;
    console.log("ClientId: ", clientId);;
    return {clientId};
};

exports.quoteDate = async (quoteId, userId) => {
    
    const info = await pool.query('SELECT quote_date, quote_validity FROM quotes WHERE id=$1 AND user_id=$2', [quoteId, userId]);

    const creationDate = info.rows[0].quote_date;
    const validityDate = info.rows[0].quote_validity;
    return {creationDate, validityDate};
};

exports.updateValidity = async (quoteId, userId,newValidity) => {
    const result = await pool.query('UPDATE quotes SET quote_validity=$1 WHERE id=$2 AND user_id=$3', [newValidity, quoteId, userId]);
};

exports.preferences = async (quoteId, userId, paymentMethod, terms, currency) => {
    const result = await pool.query('INSERT INTO user_preference(quote_id, user_id, payment_method, terms, currency) VALUES($1, $2, $3, $4, $5) ON CONFLICT (quote_id, user_id) DO UPDATE SET payment_method = EXCLUDED.payment_method, terms = EXCLUDED.terms, currency = EXCLUDED.currency', [quoteId, userId, paymentMethod, terms, currency]);

};

exports.updateQuoteClient = async (quoteId, clientId) => {
    await pool.query('UPDATE quotes SET client_id = $1 WHERE id = $2', [clientId, quoteId]);
};

/**
 * Quotes Searching service
 * @param {number} userId ID of the user who is searching quotes
 * @param {string} title The title of the Quote.It is Optional.
 * @param {string} date the creation date of the quote, that is also optional
 * 
 * @throws {}
 * 
 * @returns {Promise} All the quotes that match date or title filters
 */
exports.searchQuotes = async (userId, title) => {
    let query = `SELECT q.id, q.title, q.status, q.quote_date, qp.pdf_url
    FROM quotes q
    LEFT JOIN quote_pdf qp ON qp.quote_id = q.id
    WHERE q.user_id = $1 AND q.status = 'terminé'`;

    const params = [userId];

    if(title) {
        params.push(`%${title}%`);
        query += ` AND q.title ILIKE $${params.length}`;
    }

    query += ` ORDER BY q.quote_date  DESC LIMIT 50`;
    const result = await pool.query(query, params);
    console.log("result of quotes searches:", result.rows);
    return result;
};

/**
 * Release quote service
 * @param {number} userId the ID of the user who is deleting the quote
 * @param {number} quoteId the ID of the quote we're deleting
 * 
 * @throws {error} if there is not userId or  quoteId 
*/
exports.deleteQuote = async (userId, quoteId) => {
    await pool.query('DELETE FROM quotes WHERE id = $1 AND user_id = $2', [quoteId, userId]);
};

/**
 * Get all informations of a specific quote in order to modify it
 * @param {number} userId the ID of the user who is editting the quote
 * @param {number} quoteId the ID of the quote we're editting
 * 
 * @throws {error} if there is not userId or  quoteId
 * @returns {Promise} the object containing all necessary quote's data
*/
exports.getQuoteForEdit = async (userId, quoteId) => {
    const generalInfo = await pool.query(`
            SELECT 
                u.name AS user_name,
                u.email AS user_email,
                u.user_phone,

                q.title,
                q.quote_date,
                q.quote_validity,

                c.id,
                c.name AS client_name,
                c.client_phone,
                c.email AS client_email,

                up.payment_method,
                up.terms,
                up.currency

            FROM users u
            LEFT JOIN client c ON c.user_id = u.id
            LEFT JOIN quotes q ON q.user_id = u.id AND q.client_id = c.id
            LEFT JOIN user_preference up ON up.quote_id = q.id AND up.user_id = u.id
            WHERE u.id = $1 AND q.id = $2
            `, [userId, quoteId]);

        // Main quote's info 
        const mainInfo = await pool.query('SELECT designaion, unit_price, quantity, total_price FROM quote_items WHERE quote_id = $1', [quoteId])

        if (generalInfo.rowCount === 0 || mainInfo.rows === 0) {
            return null;
        }

        const row = generalInfo.rows[0];

        return {
            document: {
                title: row.title
            },
            items: mainInfo.rows.map(item => ({
                designation: item.designaion,
                unitPrice: item.unit_price,
                quantity: item.quantity,
                lineTotal: item.total_price
            })),
            client_id: row.id,
            client_name: row.client_name,
            client_email: row.client_email,
            client_phone: row.client_phone,
            payment_method: row.payment_method,
            terms: row.terms,
            currency: row.currency,
            quote_date: row.quote_date,
            quote_validity: row.quote_validity
        };
}

/**
 * Get the pdf url stored in the quote_pdf table of the DB
 * @param {number} quoteId the ID of the quote that generated the pdf file
 * @param {number} userId the ID of the user who generated the pdf 
 * 
 * @throws {error} If an error occurs durring the query exexution
 * @returns {Promise} 
*/
exports.getPdfFile = async (quoteId, userId) => {
    const result = await pool.query(`
        SELECT qp.pdf_url FROM quote_pdf qp
        JOIN quotes q ON q.id = qp.quote_id
        WHERE q.id = $1 AND q.user_id = $2
    `, [quoteId, userId]);

    const pdfUrl = result.rows[0];
    console.log(pdfUrl);
    return { pdfUrl };
}