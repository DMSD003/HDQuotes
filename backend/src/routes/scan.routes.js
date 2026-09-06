const express = require('express');
const multer = require('multer');
const scanController = require('../controllers/scan.controller');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware.js');
const upload = multer({ dest: 'uploads/' });

/**
 * Generate an object based on the documents scanned or imported by the user
 * @route POST /api/scan/upload
 * @access Private (requires a Bearer token)
 * @bodyparam {array} formData - The formData array containing all images scanned or uploaded by the user
 * @returns  {200} {message: string,quoteIdEl: number, data: object } - The service successfully got the images informations and process parsing
 * @returns {400} {error: string} - If there are some miissing data or bad request
 * @returns {503} {error: string, message: string} -If the AI service failled to parse the images and send the JSON object to generate quote
 * @returns {500} {error: string} - If an error occurs while images being parsed
*/
router.post('/upload',authMiddleware.check, upload.array('images', 5), scanController.upload);

/**
 * Saving the validated JSON in the DB
 * @route POST /api/scan/save 
 * @access Private (requires a Bearer token)
 * @bodyparam {Object} data - The final informations of the quote
 * @bodyparam {number} quoteId - the Id of the quote to save
 * @returns  {201} - The information of the quote saved successufully
 * @return {400} {error: string} - If some infos are missing 
*/
router.post('/save', authMiddleware.check, scanController.save);

/**
 * Export the generated quote
 * @route GET /api/scan/quote/:id/pdf
 * @acccess Private (requires a Bearer token)
 * @param { number} quoteId - The Id of the quote to transform into pdf file
 * @returns {Buffer} PDF file
 * @returns {403} {error: string} - If the user does'nt have access to that
*/
router.get('/quote/:id/pdf', authMiddleware.check, scanController.pdfGen);

/**
 * Get all clients from the DB
 * @route GET /api/scan/getClient
 * @access Private (requires a Bearer token)
 * returns {200} - CLients found successfully
 * returns {404} {message: string} - If clients not found
*/
router.get('/getClient', authMiddleware.check, scanController.client);

/**
 * Store new users informations to the D
 * @route POST /api/scan/client
 * @access Private (requires a Bearer token)
 * @bodyparam {Object} - The object of the client informations like name, email and phone number.
 * @returns {200} {message: string, id: number } - The success message and the Id of the new saved Client
 * returns {500} {message: string} - If an error occurs during the saving process
*/
router.post('/client', authMiddleware.check, scanController.saveClient);

/**
 *  Get quote creation and validity date
 * @route GET /api/scan/quoteDate/:quoteId
 * @access Private (requires a Bearer token)
 * @param {number} quoteId - The Id of the quote of which we want to get creation and validity date
 * @returns {200} {date: Object}
 * @returns {500} {message: string} - If an internal error occurs
*/
router.get('/quoteDate/:quoteId', authMiddleware.check, scanController.date);

// update validity date
router.put('/quoteDate/:quoteId', authMiddleware.check, scanController.validityDate);

// insert user's preferences in the db
router.post('/preferences/:quoteId', authMiddleware.check, scanController.preferences)

// Linking client to a quote
router.put('/quote/:quoteId/client', authMiddleware.check, scanController.updateQuoteClient);

// Search or list quotes with optionnals filters
router.get('/quotes', authMiddleware.check, scanController.searchQuotes);

// Delete a quote 
router.delete('/quote/:quoteId', authMiddleware.check, scanController.deleteQuote);

// Retrieve a specific quote info for editing
router.get('/quote/:quoteId/edit', authMiddleware.check, scanController.getQuoteForEdit);

// Get the pdf file and send it to the client
router.get('/quote/:quoteId/pdf-file' ,authMiddleware.check, scanController.getPdfFile);
module.exports = router;