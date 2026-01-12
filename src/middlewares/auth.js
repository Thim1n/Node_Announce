const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { ApiError } = require('./errorHandler');

const validateAuthentication = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return next(ApiError.unauthorized('Aucun token fourni'));
        }

        // Extraire le token (support pour "Bearer TOKEN" et "TOKEN")
        const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

        // Utiliser async/await au lieu de callback
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ where: { token } });

        if (!user) {
            return next(ApiError.forbidden('Session expirée'));
        }

        req.user = user;
        next();
    } catch(err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return next(ApiError.forbidden('Token invalide ou expiré'));
        }
        next(ApiError.internal('Erreur lors de la validation du token'));
    }
};

module.exports = {
    validateAuthentication
}