const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration du pool de connexions MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'annonces_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test de connexion
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connexion à la base de données réussie');
        connection.release();
    } catch (error) {
        console.error('❌ Erreur de connexion à la base de données:', error.message);
        console.error('Vérifiez vos variables d\'environnement dans le fichier .env');
    }
};

// Exécuter le test de connexion au démarrage
testConnection();

module.exports = pool;