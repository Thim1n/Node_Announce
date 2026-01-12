const { User } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');
const bcrypt = require('bcryptjs');

/**
 * Récupère le profil de l'utilisateur connecté
 */
const getProfile = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return next(ApiError.notFound('Utilisateur non trouvé'));
        }

        return res.status(200).json({
            success: true,
            data: {
                user: user.clean()
            }
        });
    } catch(error) {
        next(ApiError.internal('Erreur lors de la récupération du profil'));
    }
};

/**
 * Met à jour le profil de l'utilisateur connecté
 */
const updateProfile = async (req, res, next) => {
    try {
        const { firstname, lastname, phone_number, address, zip_code, city, profil_picture } = req.body;

        const user = await User.findByPk(req.user.id);

        if (!user) {
            return next(ApiError.notFound('Utilisateur non trouvé'));
        }

        // Mise à jour des champs fournis
        await user.update({
            ...(firstname !== undefined && { firstname }),
            ...(lastname !== undefined && { lastname }),
            ...(phone_number !== undefined && { phone_number }),
            ...(address !== undefined && { address }),
            ...(zip_code !== undefined && { zip_code }),
            ...(city !== undefined && { city }),
            ...(profil_picture !== undefined && { profil_picture })
        });

        return res.status(200).json({
            success: true,
            message: 'Profil mis à jour avec succès',
            data: {
                user: user.clean()
            }
        });
    } catch(error) {
        next(ApiError.badRequest('Erreur lors de la mise à jour du profil', error.message));
    }
};

/**
 * Change le mot de passe de l'utilisateur connecté
 */
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return next(ApiError.badRequest('Mot de passe actuel et nouveau mot de passe requis'));
        }

        const user = await User.findByPk(req.user.id);

        if (!user) {
            return next(ApiError.notFound('Utilisateur non trouvé'));
        }

        // Vérifier le mot de passe actuel
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return next(ApiError.unauthorized('Mot de passe actuel incorrect'));
        }

        // Hacher et sauvegarder le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedPassword });

        return res.status(200).json({
            success: true,
            message: 'Mot de passe changé avec succès'
        });
    } catch(error) {
        next(ApiError.internal('Erreur lors du changement de mot de passe'));
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword
};
