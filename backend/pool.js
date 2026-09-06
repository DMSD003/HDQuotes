const { Pool } = require('pg');
require('dotenv').config();

// Initialize the pool with .env's vairiables
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    max: 10, // Maximum number of connetions in the pool
    idleTimeoutMillis: 30000 // closes unused connections after 30 seconds
});

// connection test when the server starts
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Erreur de connexion à PostgreSQL via le Pool :', err.stack);
    } else {
        console.log('✅ Le Pool PostgreSQL est actif et connecté à la base 3NF !');
    }
});

module.exports = pool;