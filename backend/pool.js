const { Pool } = require('pg');
require('dotenv').config();

// Initialize the pool with .env's vairiables
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {rejectUnauthorized: false},
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