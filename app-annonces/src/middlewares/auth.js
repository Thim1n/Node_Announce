const jwt = require('jsonwebtoken');
const User = require('../models/Users');
require('dotenv').config();

/**
 * Middleware d'authentification JWT
 * Vérifie la présence et la validité du token JWT
 */
const authenticate = async (req, res, next) => {
    try {
        // Récupérer le token depuis le header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Token manquant. Veuillez vous authentifier.'
            });
        }

        // Extraire le token (format: "Bearer TOKEN")
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                message: 'Token invalide. Veuillez vous authentifier.'
            });
        }

        // Vérifier et décoder le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Récupérer l'utilisateur depuis la base de données
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                message: 'Utilisateur non trouvé. Token invalide.'
            });
        }

        // Ajouter l'utilisateur à l'objet request pour utilisation ultérieure
        req.user = user;
        next();
    } catch (error) {
        // Gérer les différentes erreurs JWT
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: 'Token invalide. Veuillez vous reconnecter.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Token expiré. Veuillez vous reconnecter.'
            });
        }

        return res.status(500).json({
            message: 'Erreur d\'authentification',
            error: error.message
        });
    }
};

/**
 * Middleware d'autorisation par rôle
 * Vérifie si l'utilisateur a le rôle requis
 * @param  {...string} roles - Rôles autorisés
 * @returns {Function} Middleware function
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        // Vérifier que l'utilisateur est authentifié
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentification requise'
            });
        }

        // Vérifier que l'utilisateur a le bon rôle
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Accès refusé. Permissions insuffisantes.',
                required_roles: roles,
                user_role: req.user.role
            });
        }

        next();
    };
};

/**
 * Middleware optionnel d'authentification
 * N'échoue pas si le token est manquant, mais vérifie s'il est présent
 */
const optionalAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];

            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.userId);

                if (user) {
                    req.user = user;
                }
            }
        }

        next();
    } catch (error) {
        next();
    }
};

module.exports = {
    authenticate,
    authorize,
    optionalAuthenticate
};