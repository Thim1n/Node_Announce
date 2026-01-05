const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('node:path');

// Charger le fichier swagger.yml
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yml'));

// Configuration personnalisée de Swagger UI
const swaggerOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Annonces - Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
        persistAuthorization: true, // Garder l'authentification entre les rechargements
        displayRequestDuration: true, // Afficher la durée des requêtes
        filter: true, // Activer la recherche
        syntaxHighlight: {
            activate: true,
            theme: 'monokai'
        }
    }
};

module.exports = {
    swaggerUi,
    swaggerDocument,
    swaggerOptions
};