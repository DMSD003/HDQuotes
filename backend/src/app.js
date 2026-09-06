const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes')
const scanRoutes = require('./routes/scan.routes')
const app = express();

app.use(cors({
    origin: 'http://localhost:5173', // activate cors for my frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);

app.use('/api/scan', scanRoutes);

module.exports = app;
