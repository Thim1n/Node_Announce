const { where } = require("sequelize");
const { dbInstance, User } = require("../models");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ApiError } = require('../middlewares/errorHandler');
require('dotenv').config({ quiet: true });

const register = async (req, res, next) => {
    const transaction = await dbInstance.transaction();
    try {
        const { firstname, lastname, profil_picture, phone_number, address, zip_code, city, username, password } = req.body;
        const hashedpassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            firstname,
            lastname,
            username,
            profil_picture,
            phone_number,
            address,
            zip_code,
            city,
            password: hashedpassword
        }, { transaction });

        await transaction.commit();
        return res.status(201).json({
            success: true,
            message: 'Utilisateur créé avec succès',
            data: {
                user: user.clean()
            }
        })
    } catch(error) {
        await transaction.rollback();
        const errormsg = (error.name === 'SequelizeDatabaseError') ? error.parent.sqlMessage : error;
        next(ApiError.badRequest("Erreur lors de la création de l'utilisateur", errormsg));
    }
}

const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({
            where: { username }
        });

        // Protection contre timing attack : toujours comparer même si user n'existe pas
        const hash = user?.password || await bcrypt.hash('dummy_password_for_timing', 10);
        const isValid = await bcrypt.compare(password, hash);

        // Message d'erreur générique pour ne pas révéler si l'utilisateur existe
        if (!user || !isValid) {
            return next(ApiError.unauthorized('Identifiants invalides'));
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        user.token = token;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Connexion réussie',
            data: {
                user: user.clean(),
                token
            }
        })
    } catch(error) {
        // En cas d'erreur, retourner le même message générique
        next(ApiError.unauthorized('Identifiants invalides'));
    }
}

const logout = async (req, res, next) => {
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

        if(!user) {
            return next(ApiError.unauthorized('Session expirée'));
        }

        user.token = null;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Déconnexion réussie'
        });
    } catch(error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return next(ApiError.forbidden('Token invalide ou expiré'));
        }
        next(ApiError.internal('Erreur lors de la déconnexion'));
    }
}

module.exports = {
    register,
    login,
    logout
}