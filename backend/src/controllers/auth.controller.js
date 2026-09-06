const authService = require('../service/auth.service');
require('dotenv').config();

/**
 * Registration controller
 * Verify and send user's data to the registration service

 * @param {import("express").Request} req HTTP request
 * @param {import("express").Response} res HTTP response
 * 
 * @returns {Primise<void>}
*/
exports.register = async (req, res) => {

    try {
        const {name, email, password, phone} = req.body;

        //Check if the user's data exists
        if (!email || !name || !password || !phone) {
            return res.status(400).json({error: "User's info are required"});
        }

        const token = await authService.createUser(name, email, password, phone);
        console.log("token controller:", token);
        return res.status(201).json({
            message: "User created successfully",
            userToken: token
        });
    } catch (error) {
        console.error(error);
        if (error.message === "EMAIL_ALREADY_EXISTS") {
            return res.status(400).json({message: "EMAIL_ALREADY_EXISTS"});
        }

        res.status(500).json({error: "Internal server error"});
    }
};


/**
 * Login Controller
 * 
 * Verify and send uder's data to the login service
 * 
 * @param {import("express").Request} req HTTP request
 * @param {import("express").Response} res HTTP response
 * 
 * @returns {Object} the message, userId and the token sent by the service.
*/
exports.login = async(req,res) =>{
    try {

        // Retrieve user's data
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({message: "email and password are empty"});
        }

        const checkUser = await authService.loginUser(email, password);
        console.log(checkUser.user.id, checkUser.token);
        return res.status(200).json({
            message: "User found successfully",
            user: checkUser.user.id,
            token: checkUser.token
        });
    } catch (error) {
        if (error.message === 'INVALID_CREDENTIALS') {
            return res.status(400).json({message: 'invalid credentials'});
        }
        console.error(error);
        res.status(500).json({error: 'Internal server error'});
    }
};

// Forgot password controller
exports.forgotPassword = async(req,res) => {
    try {
        
        const {email} = req.body;

        const resetInfos = await authService.forgotPass(email);
        
        return res.status(200).json({token: resetInfos.token,
            message: "if an acount is associated to this address, a reset link has been sent"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Internal server error"})
    }
}

// reset password controller 
exports.resetPassword = async(req, res) => {
    try {
        // Retrieve the password and the token from the body of the frontend request
        const { newPassword, token } = req.body;

        // verify if there're no password or token
        if (!newPassword || !token) {
            return res.status(400).json({message: "missing data"});
        }

        const reset = await authService.reset( newPassword, token);

        return res.status(200).json({message: reset.message});
    } catch (error) {
        // If jwt.verify failled, the error comes here
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({message: "The link expired." });
        }
        return res.status(401).json({message: "Invalid reset link" });
    }
}

exports.user = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await authService.getUser(userId);

        res.status(200).json({user: user.userData, message: "user found successfully"});
    } catch (error) {
        console.error("finding user error:", error);
        res.status(500).json({message: "internal server error while finding user infos"});
    }
};

