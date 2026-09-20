const express = require('express');
const app = require('./src/app');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

app.listen(PORT,'0.0.0.0' () => {
    console.log(`Server is listenning on port ${PORT}`);
})