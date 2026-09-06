const pool = require('../../pool');
const scanService = require('../service/scan.service');
const path = require('path');

// Save the quote data in the DB
exports.save = async(req, res) => {
    try {
        
        const userId = req.userId;
        console.log(req.body);

        const data = req.body.data;
        const quoteId = req.body.quoteId;

        const savedQuoteId = await scanService.save(data, userId, quoteId);

        res.status(201).json({message: "Quote informations saved successfully", quoteIdEl: savedQuoteId.quoteId});
    } catch (error) {
        console.error(error);
        res.status(400).json({error: "Client sent bad data"});
    }
}

exports.upload = async(req, res) => {
    try {

        if (!req.files) {
            return res.status(400).json({error: 'No image file provided'});
        }

        const userId = req.userId;
        const imagesPath = req.files.map(file => file.path);
        const mimeImagesType = req.files.map(file => file.mimetype);

        console.log("Image Infos:", userId, imagesPath, mimeImagesType);

    
        const service = await scanService.upload(userId, imagesPath, mimeImagesType);
        return res.status(200).json({
            message: "Got AI quote JSON successfuly, analysing...",
            quoteIdEl: service.quoteId,
            data: service.data
        });
    } catch (error) {
        if (error.message === 'AI_RETURNED_INVALID_JSON OR A_BAD_OBJECT_STRUCTURE') {
            return res.status(400).json({error: "Invalid Json object"})
        }
        if (error.status === 503) {
            return res.status(503).json({
                error: "AI_SERVICE_UNAVAILABLE",
                message: "The parsing service is temporary unavailable"
            });
        }
        console.error("Transfert files error:", error);
        return res.status(500).json({error: 'error while uploading the scan'})
    }
}

// Generate the final pdf to download
exports.pdfGen = async(req, res) => {
    try {
        console.log(req.params.id);
        const userId = req.userId;
        const pdfBuffer = await scanService.pdfGen(userId,req.params.id);

        res.setHeader("Content-Type", "application/pdf");

        res.setHeader("Content-Disposition", 'attachment; filename="devis.pdf"');
        res.send(pdfBuffer);
    } catch (error) {
        console.error(error);
        res.status(403).json({error: "Forbidden"});
    }
}

// Send client informations
exports.client = async (req, res) => {
    try {
        const userId = req.userId;

        const clientInfo = await scanService.getClient(userId);

        res.status(200).json({infos: clientInfo.infos, message: "Client Found Successfully"});
    } catch (error) {
        console.error(error)
        res.status(404).json({message: "Client Not Found"});
    }
}

// Save new clients in the db
exports.saveClient = async (req, res) => {
    try {
        const userId = req.userId;

        const clientInfo = req.body;
        console.log(clientInfo);

        const { name, email, phone} = clientInfo;

        const saveResult = await scanService.saveClient(userId, name, email, phone);
        
        res.status(200).json({message: "client stored successfully", id: saveResult.clientId });
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Internal server error"});
    }
};

exports.date = async (req,res) => {
    try {
        const quoteId = req.params.quoteId;
        const userId = req.userId;

        const date = await scanService.quoteDate(quoteId,userId);
        console.log(date);
        res.status(200).json({date: date});
    } catch (error) {
        console.error("getting quote date error: ", error);
        res.status(500).json({message: "getting quote date error"});
    }
};

exports.validityDate = async (req,res) => {
    try {
        const quoteId = req.params.quoteId;
        const userId = req.userId;
        const newValidity = req.body.newValidity;
        console.log(quoteId, userId, newValidity);

        const updateResult = await scanService.updateValidity(quoteId, userId);

        res.status(200).json({message: "updated the quote valididty date successfully"});
    } catch (error) {
        console.error("updating validity date error: ", error);
        res.status(500).json({message: "updating date error"});
    }
};

// send user's preferences 
exports.preferences = async (req, res) => {
    try {
        const quoteId = req.params.quoteId;
        const userId = req.userId;
        const {paymentMethod, terms , currency} = req.body;
        console.log("preferences info: ", quoteId, userId, paymentMethod, terms, currency);

        const result = await scanService.preferences(quoteId, userId, paymentMethod, terms, currency);
        res.status(200).json({message: "user inserted or uspdated successfully"})
    } catch (error) {
        console.error('preferences error: ', error);
        res.status(500).json({message: "internal server error"});
    }
}

exports.updateQuoteClient = async (req, res) => {
    try {
        const { quoteId } = req.params;
        const { clientId } = req.body;

        await scanService.updateQuoteClient(quoteId, clientId);

        return res.status(200).json({message: "Client linked to quote successfully"});
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Failed to update the quote's client"});
    }
};

/**
 * Seach quotes bases on thier titles, or creation date from the query parameters
 * @param {import("express").Request} req HTTP request
 * @param {import("express").Response} res HTTP response
 * 
 * @returns {Promise<import("express").Response} the response object
*/
exports.searchQuotes = async (req,res) => {
    try {
        const userId = req.userId;
        const { title} = req.query;
        console.log("seach options:", req.query);

        const quotes = await scanService.searchQuotes(userId, title);
        return res.status(200).json({quotes: quotes.rows});
    } catch (error) {
        console.error("Error searching quotes:", error);
        res.status(500).json({error: "Failled to search quotes"});
    }
};

/**
 * Release quote controller base on its Id
 * @param {import("express").Request} req HTTP request
 * @param {import("express").Response} res HTTP response
 * 
 * @throws {error} if the scanService fail or if userId or quoteId are missing
 * @returns {Promise<import("express").Response}
*/
exports.deleteQuote = async (req, res) => {
    try {
        const userId = req.userId;
        const quoteId = req.params.quoteId;
        console.log("info of the quote to delete:", userId, quoteId);

        await scanService.deleteQuote(userId, quoteId);
        res.status(200).json({message: "Quote deleted successfully"});
    
    } catch (error) {
        console.error("Error while deleting the quote: ", error);
        res.status(500).json({error: "Failled to release the quote"})
    }
};

/**
 * Get All informations of a generated quote to edit it
 * @param {import("express").Request} req HTTP request
 * @param {import("express").Response} res HTTP response
 * 
 * @throws {error} if the scanService that get the quote data for edit fail or if userId or quoteId are missing
 * @returns {Promise<import("express").Response}
*/
exports.getQuoteForEdit = async (req, res) => {
    try {
        const userId = req.userId;
        const quoteId = req.params.quoteId;
        console.log("Infos of the the quote to edit: ", userId, quoteId);

        const quoteData = await scanService.getQuoteForEdit(userId, quoteId );
        if (!quoteData) {
            return res.status(404).json({error: "Quote Not Found"});
        }
        console.log("quote's data to edit:", quoteData);
        return res.status(200).json({data: quoteData});
    } catch (error) {
        console.error("Error while obtaining quote data for editing: ", error);
        res.status(500).json({error: "Failled to get quote info for editing"});
    }

};

/**
 * Get pdf file controller. It builds the file path that the frontend will use as src
 * @param {import("express").Request} req HTTP request
 * @param {import("express").Response} res HTTP response
 * 
 * @throws {error} if the scanService fail or if userId or quoteId are missing
 * @returns {Promise<import("express").Response}
*/
exports.getPdfFile = async (req, res) => {
    try {
        const quoteId = req.params.quoteId;
        const userId = req.userId;
        console.log("Data of the pdf file to get: ", quoteId, userId);

        const result = await scanService.getPdfFile(quoteId, userId);
        if(!result) {
            return res.status(404).json({error: "PDF not found"});
        }
        const filePath = path.join(__dirname, "..", "..", result.pdfUrl.pdf_url);
        console.log('file path: ', filePath);
        res.sendFile(filePath);
    } catch (error) {
     console.log("error");
     res.status(500).json({error: "Failed to retrieve PDF"});
    }
};