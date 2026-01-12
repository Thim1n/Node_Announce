const { checkSchema } = require('express-validator');
const { Annonce } = require('../models');
const { ApiError } = require('./errorHandler');

const validateAnnonce = async (req, res, next) => {
    const [ validation ] = await checkSchema({
        title: { notEmpty: true },
        price: {
            optional: { options: { nullable: true } },
            isFloat: {
                errorMessage: 'Le prix doit être un nombre valide'
            }
        }
    }).run(req);
    if(!validation.isEmpty()) {
        return next(ApiError.badRequest('Validation échouée', validation.array()));
    }
    next();
}

/**
 * Middleware pour vérifier que l'utilisateur est le propriétaire de l'annonce
 * Permet aux admins d'accéder à toutes les annonces
 */
const checkAnnonceOwnership = async (req, res, next) => {
    try {
        const { id } = req.params;
        const annonce = await Annonce.findByPk(id);

        if (!annonce) {
            return next(ApiError.notFound('Annonce non trouvée'));
        }

        // Vérifier la propriété (sauf pour les admins)
        if (req.user.role !== 'admin' && annonce.user_id !== req.user.id) {
            return next(ApiError.forbidden(
                'Vous n\'êtes pas autorisé à modifier cette annonce'
            ));
        }

        // Attacher l'annonce à la requête pour éviter une double requête
        req.annonce = annonce;
        next();
    } catch(error) {
        next(ApiError.internal('Erreur lors de la vérification des droits'));
    }
};

module.exports = {
    validateAnnonce,
    checkAnnonceOwnership
};