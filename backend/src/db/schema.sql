/* This script creates all tables for the project*/

-- Drop tables when exists

DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS user_preference CASCADE;
DROP TABLE IF EXISTS document_images CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS quote_pdf CASCADE;
DROP TABLE IF EXISTS quotes_items CASCADE;
DROP TABLE IF EXISTS quotes_styles CASCADE;
DROP TABLE IF EXISTS client CASCADE;

-- Create all necessaries tables

-- The user's table who create the quote
-- The user should be identified with id, his name, email, password and phone number
CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_phone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- One user can use one document to generate a quote
CREATE TABLE documents(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

-- One document can have many pages
CREATE TABLE document_images(
    id SERIAL PRIMARY KEY,
    document_id INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL
);

-- User can have many clients
CREATE TABLE client(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) ,
    client_phone VARCHAR(50),
    email VARCHAR(200)
);

-- A quote made by user for a client
CREATE TABLE quotes(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'en cours',
    quote_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quote_validity TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    client_id INT REFERENCES client(id) ON DELETE CASCADE
);

CREATE TABLE quote_pdf(
    id SERIAL PRIMARY KEY,
    quote_id INT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    pdf_url TEXT NOT NULL
);

-- User's preferences for a specific quote
CREATE TABLE user_preference(
    id SERIAL PRIMARY KEY,
    quote_id INT NOT NULL  REFERENCES quotes(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_method VARCHAR(100),
    terms TEXT,
    currency VARCHAR(20),
    UNIQUE(quote_id, user_id)
);

CREATE TABLE quote_items(
    id SERIAL PRIMARY KEY,
    quote_id INT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    designaion VARCHAR(300) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL
);

CREATE TABLE quote_styles (
    id SERIAL PRIMARY KEY,
    quote_id INT NOT NULL UNIQUE REFERENCES quotes(id) ON DELETE CASCADE,
    theme_color VARCHAR(7) DEFAULT '#ffffff',
    font_size INT DEFAULT 11,
    is_bold BOOLEAN DEFAULT FALSE,
    is_italic BOOLEAN DEFAULT FALSE
);