/**
 * Classe d'erreur personnalisée pour l'API
 * Permet de créer des erreurs avec un code HTTP et des détails
 */
class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'ApiError';
    }

    static badRequest(message, details = null) {
        return new ApiError(400, message, details);
    }

    static unauthorized(message = 'Non autorisé') {
        return new ApiError(401, message);
    }

    static forbidden(message = 'Accès interdit') {
        return new ApiError(403, message);
    }

    static notFound(message = 'Ressource non trouvée') {
        return new ApiError(404, message);
    }

    static conflict(message, details = null) {
        return new ApiError(409, message, details);
    }

    static internal(message = 'Erreur interne du serveur') {
        return new ApiError(500, message);
    }
}

/**
 * Middleware de gestion globale des erreurs
 * Capture toutes les erreurs et renvoie une réponse formatée
 */
const errorHandler = (err, req, res, next) => {
    // Si c'est une ApiError, utiliser son statusCode
    const statusCode = err.statusCode || 500;

    // Format de réponse standardisé
    const response = {
        success: false,
        message: err.message || 'Une erreur est survenue',
        ...(err.details && { details: err.details })
    };

    // En développement, ajouter la stack trace
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    // Logger l'erreur (sera remplacé par un vrai logger plus tard)
    if (statusCode >= 500) {
        console.error('[ERROR]', {
            message: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        });
    }

    res.status(statusCode).json(response);
};

/**
 * Middleware pour capturer les routes non trouvées (404)
 */
const notFoundHandler = (req, res, next) => {
    next(ApiError.notFound(`Route ${req.method} ${req.path} non trouvée`));
};

/**
 * Wrapper async pour éviter les try/catch répétitifs
 * Usage: router.get('/', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    ApiError,
    errorHandler,
    notFoundHandler,
    asyncHandler
};
