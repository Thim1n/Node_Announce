const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// =============================================================================
// MIDDLEWARES DE SÉCURITÉ
// =============================================================================

// Helmet - Sécurise les headers HTTP
app.use(helmet());

// CORS - Gestion des origines cross-origin
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - Limiter le nombre de requêtes par IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Maximum 100 requêtes par IP dans la fenêtre
    message: {
        message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Appliquer le rate limiting à toutes les routes /api
app.use('/api/', limiter);

// =============================================================================
// MIDDLEWARES DE PARSING
// =============================================================================

// Parser le body des requêtes en JSON
app.use(express.json());

// Parser les données URL-encoded
app.use(express.urlencoded({ extended: true }));

// =============================================================================
// DOCUMENTATION API (SWAGGER)
// =============================================================================

const { swaggerUi, swaggerDocument, swaggerOptions } = require('./config/swagger');

// Route de documentation Swagger
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerDocument, swaggerOptions));

// =============================================================================
// ROUTES
// =============================================================================

// Importer les routes
const authRoutes = require('./routes/auth');
const annoncesRoutes = require('./routes/announces');
const adminRoutes = require('./routes/admin');
const signalementsRoutes = require('./routes/signalements');

// Route de santé (health check)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Route d'accueil
app.get('/', (req, res) => {
    res.json({
        message: 'Bienvenue sur l\'API de la plateforme d\'annonces',
        version: '1.0.0',
        documentation: '/api-docs',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            annonces: '/api/annonces',
            admin: '/api/admin',
            signalements: '/api/signalements'
        }
    });
});

// Monter les routes
app.use('/api/auth', authRoutes);
app.use('/api/annonces', annoncesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/signalements', signalementsRoutes);

// =============================================================================
// GESTION DES ERREURS
// =============================================================================

// 404 - Route non trouvée
app.use((req, res) => {
    res.status(404).json({
        message: 'Route non trouvée',
        path: req.path,
        method: req.method
    });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
    console.error('❌ Erreur serveur:', err.stack);

    res.status(err.status || 500).json({
        message: err.message || 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// =============================================================================
// DÉMARRAGE DU SERVEUR
// =============================================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 Serveur démarré avec succès');
    console.log('='.repeat(60));
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log(`📚 API: http://localhost:${PORT}/api`);
    console.log(`📖 Documentation Swagger: http://localhost:${PORT}/api-docs`);
    console.log('='.repeat(60));
    console.log('📋 Routes disponibles:');
    console.log('  - GET  /api/health');
    console.log('  - POST /api/auth/register');
    console.log('  - POST /api/auth/login');
    console.log('  - GET  /api/auth/me');
    console.log('  - GET  /api/annonces');
    console.log('  - POST /api/annonces');
    console.log('  - GET  /api/annonces/:id');
    console.log('  - PUT  /api/annonces/:id');
    console.log('  - DELETE /api/annonces/:id');
    console.log('  - POST /api/signalements');
    console.log('  - GET  /api/admin/annonces (admin)');
    console.log('  - PATCH /api/admin/annonces/:id/statut (admin)');
    console.log('='.repeat(60));
    console.log('💡 Pour tester l\'API de manière interactive :');
    console.log(`   Ouvrez http://localhost:${PORT}/api-docs dans votre navigateur`);
    console.log('='.repeat(60));
});

module.exports = app;