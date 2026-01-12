const { checkSchema } = require('express-validator');
const { ApiError } = require('./errorHandler');

const isAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return next(ApiError.forbidden("Vous n'avez pas les droits nécessaires pour accéder à cette ressource"));
    }
    next();
}

const validateRegister = async (req, res, next) => {
    const [ validation ] = await checkSchema({
        username: {
            notEmpty: {
                errorMessage: 'Le nom d\'utilisateur est requis'
            },
            isLength: {
                options: { min: 3, max: 20 },
                errorMessage: 'Le nom d\'utilisateur doit contenir entre 3 et 20 caractères'
            },
            trim: true
        },
        password: {
            notEmpty: {
                errorMessage: 'Le mot de passe est requis'
            },
            isLength: {
                options: { min: 8 },
                errorMessage: 'Le mot de passe doit contenir au moins 8 caractères'
            },
            matches: {
                options: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                errorMessage: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
            }
        },
        firstname: {
            optional: true,
            isLength: {
                options: { max: 50 },
                errorMessage: 'Le prénom ne peut pas dépasser 50 caractères'
            },
            trim: true
        },
        lastname: {
            optional: true,
            isLength: {
                options: { max: 50 },
                errorMessage: 'Le nom ne peut pas dépasser 50 caractères'
            },
            trim: true
        },
        phone_number: {
            optional: true,
            matches: {
                options: /^[0-9+\-\s()]+$/,
                errorMessage: 'Le numéro de téléphone n\'est pas valide'
            }
        },
        zip_code: {
            optional: true,
            matches: {
                options: /^[0-9]{5}$/,
                errorMessage: 'Le code postal doit contenir 5 chiffres'
            }
        }
    }).run(req);

    if(!validation.isEmpty()) {
        return next(ApiError.badRequest('Erreur de validation', validation.array()));
    }
    next();
}

module.exports = {
    isAdmin,
    validateRegister
}