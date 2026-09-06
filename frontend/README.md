# HDQuotes

## QUotes creation and management

## Presentation

HDQuotes is an application (PWA for instanct) that helps t create a and manage quotes. It's composed of a frontend React (React js) and of a backend Express, with a data base PostgreSQL and a Gemini integretion instead of a classic ORC. It is more expensive (budget for Gemini API calls), it might hallucinate if Images (captured or uploaded ) are ambiguous and The OCR is faster than an API call but the AI understand the context that i gave him and send me back directly a json while with OCR it's more complex to extract data. That's the core of my system.

## Functionnalities

    -   Quote Creation
    -   Authentification (JWT)
    -   Content Generation assisted by AI (Gemini)
    -   Quote exports in PDF files
    -   Downloadable application
    -   Responsive interface

## Technologies

    Frontend    |   React + vite-plugin-pwa
    Backend     |   Node.js + Express
    Data Base   |   PostgreSQL
    IA          |   Gemini (Google)
    Authentification    |   JWT
    Project Size        |   Monorepo(frontend/backend)


## Installation and getting started
1. Clone/Fork the Github repo
    [repo link](https://github.com/DMSD003/HDQuotes.git)
2. Install dependencies
    npm install
3. Lanch the application in development mode
    npm run dev

## Access

    Once the application is Lauched, open the browser on http://localhost:5173

## Future ameliorations
    1. Improve security,for users, for token with cookies and apply refresh token,
    2. Add User management system to madify, delete and add informations,
    3. Improve user experience by adding dark theme, styles and increase performance by using appropriate hooks such as reactMemo or useCallbak,
    4. Add more templates of Generated PDFs