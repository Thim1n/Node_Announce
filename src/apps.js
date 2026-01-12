require('dotenv').config({ quiet: true });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const app = express();
const initRoutes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const PORT = process.env.PORT || 3000;

// Sécurité avec Helmet (headers HTTP sécurisés)
app.use(helmet());

// Configuration CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // En production, spécifier l'URL exacte du frontend
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());


initRoutes(app);

// Middleware pour gérer les routes non trouvées (404)
app.use(notFoundHandler);

// Middleware de gestion globale des erreurs (doit être en dernier)
app.use(errorHandler);

if (require.main === module) {
    app.listen(PORT, () => {
        console.log('Server running on port', PORT);
    });
}

module.exports = app;
