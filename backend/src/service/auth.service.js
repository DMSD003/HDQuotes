const bcrypt = require('bcrypt');
const pool = require('../../pool');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const nodemailler = require('nodemailer');

/**
 * User Registration Service
 * 
 * Verify if the user is already in the DB, encrypt his password else, and store his data in he DB
 * 
 * @param {string} name user's first and last name
 * @param {string} email user's email
 * @param {string} password user's password
 * @param {string} phone user's phone number
 * 
 * @throws {error} if the user already exist or if an issue occurs during insertion in the db or the token creation
 * 
 * @returns {string} The access token of the user just crated
*/
exports.createUser = async (name, email, passsword, phone) => {

    // Check if User's data exists in the DB
        const checkUser = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
        if (checkUser.rows.length > 0) {
            console.log("email already exits");
            throw new Error("EMAIL_ALREADY_EXISTS");
        }

        // Hash the password
        const saltRounds = 10 // 2^10
        const passwordHash = await bcrypt.hash(passsword, saltRounds);

        // Insert user in the DB
        const result = await pool.query('INSERT INTO users(name, email, password_hash, user_phone) VALUES($1, $2, $3, $4) RETURNING id, name, email', [name, email, passwordHash, phone]);

        // Creating the token
        const token = jwt.sign({id: result.rows[0].id}, process.env.JWT_SECRET, {expiresIn: '100h'});
        
        return {token}; // returns the user's token just created
};


/**
 * Login service
 * 
 * Verify if the user is really already stored, compare the hashed password with the actual one
 * 
 * @param {string} email email of the user 
 * @param {string} password the passwoedof the user
 * 
 * @throws {error} if the user is not yet registered, if the password doesn't match orif there is any issue with the DB or token creation
 * 
 * @returns {Object} the user info and the token just created 
*/
exports.loginUser = async(email, password) => {

    let result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);

    // CHeck if the user really exists in the DB
    if (result.rows.length === 0) {
        throw new Error('INVALID_CREDENTIALS');
    } 

    const user = result.rows[0];
    const passwordHash = user.password_hash;

    // Verify if the entered password match the passwordHash stored in the DB
    const isMatch = bcrypt.compare(password, passwordHash);
    if (!isMatch) {
        throw new Error('INVALID_CREDENTIALS');
    }

    // Creating the token
    const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {expiresIn: '100h'});

    return {user, token};
}

// Forgot password service
exports.forgotPass = async(email) => {

    const transporter = nodemailler.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD
        }
    });

    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);

    // verify if the user is'nt in the DB, and he will to sign in
    if ( result.rows.length === 0 ) {
        throw new Error('USER_IS_NOT_REGISTERED');
    }

    const user = result.rows[0];
    // create a token with a low time life
    const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {expiresIn: '15m'});

    // the reset link that point to a frontend route
    const resetLink = `http://localhost:5173/reset-password?token=${token}`;

    // Configurations of the mail options
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Reset your password',
        html: `<p>Reset your password. Click on the link to modify it (available for 15 minutes)</p><a href="${resetLink}">Reset your password</a>`
    }

    console.log("1 preparation de l'envoi à:", user.email );
    console.log("2 contenu des mailOptions");

    // send the email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("3. Email envoyé avec succès! ID:", info.messageId);
    } catch (error) {
        console.log("3. CRASH NODEMAILER :", error);
    }

    console.log("4. fin du service, retour du token");
    return {token};
}

// reset password service
exports.reset = async(newPassword, token) => {

    // Verify the token , this can throw an error when the token is expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const id = decoded.id;

    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password in the table users
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [passwordHash, id]);

    return {message: "Password modified, you can now login"};
}

exports.getUser = async (userId) => {

    const user = await pool.query('SELECT name, email, user_phone FROM users WHERE id=$1', [userId]);

    const userData = user.rows[0];

    return {userData};
}