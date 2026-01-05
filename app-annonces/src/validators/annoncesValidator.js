const { body, param } = require('express-validator');

/**
 * Validation pour la création d'une annonce
 */
const createAnnonceValidation = [
    body('titre')
        .notEmpty()
        .withMessage('Le titre est requis')
        .isLength({ min: 3, max: 100 })
        .withMessage('Le titre doit contenir entre 3 et 100 caractères')
        .trim(),

    body('description')
        .notEmpty()
        .withMessage('La description est requise')
        .isLength({ min: 10, max: 1000 })
        .withMessage('La description doit contenir entre 10 et 1000 caractères')
        .trim(),

    body('prix')
        .notEmpty()
        .withMessage('Le prix est requis')
        .isFloat({ min: 0 })
        .withMessage('Le prix doit être un nombre positif'),

    body('categorie')
        .optional()
        .isString()
        .withMessage('La catégorie doit être une chaîne de caractères')
        .trim(),

    body('email')
        .optional()
        .isEmail()
        .withMessage('L\'email doit être valide')
        .normalizeEmail(),

    body('telephone')
        .optional()
        .matches(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/)
        .withMessage('Le numéro de téléphone doit être valide (format français)')
];

/**
 * Validation pour la mise à jour d'une annonce
 */
const updateAnnonceValidation = [
    param('id')
        .notEmpty()
        .withMessage('L\'ID est requis')
        .isInt({ min: 1 })
        .withMessage('L\'ID doit être un entier positif'),

    body('titre')
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage('Le titre doit contenir entre 3 et 100 caractères')
        .trim(),

    body('description')
        .optional()
        .isLength({ min: 10, max: 1000 })
        .withMessage('La description doit contenir entre 10 et 1000 caractères')
        .trim(),

    body('prix')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Le prix doit être un nombre positif'),

    body('categorie')
        .optional()
        .isString()
        .withMessage('La catégorie doit être une chaîne de caractères')
        .trim(),

    body('email')
        .optional()
        .isEmail()
        .withMessage('L\'email doit être valide')
        .normalizeEmail(),

    body('telephone')
        .optional()
        .matches(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/)
        .withMessage('Le numéro de téléphone doit être valide (format français)')
];

/**
 * Validation pour l'ID dans les paramètres
 */
const idParamValidation = [
    param('id')
        .notEmpty()
        .withMessage('L\'ID est requis')
        .isInt({ min: 1 })
        .withMessage('L\'ID doit être un entier positif')
];

module.exports = {
    createAnnonceValidation,
    updateAnnonceValidation,
    idParamValidation
};