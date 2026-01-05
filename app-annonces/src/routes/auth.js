const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middlewares/auth');
require('dotenv').config();

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post('/register', [
    body('nom')
        .notEmpty()
        .withMessage('Le nom est requis')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom doit contenir entre 2 et 100 caractères'),

    body('email')
        .notEmpty()
        .withMessage('L\'email est requis')
        .isEmail()
        .withMessage('L\'email doit être valide')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Le mot de passe est requis')
        .isLength({ min: 6 })
        .withMessage('Le mot de passe doit contenir au moins 6 caractères'),

    body('role')
        .optional()
        .isIn(['annonceur', 'acheteur'])
        .withMessage('Le rôle doit être "annonceur" ou "acheteur"')
], async (req, res) => {
    try {
        // Validation des données
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Erreurs de validation',
                errors: errors.array()
            });
        }

        const { nom, email, password, role } = req.body;

        // Vérifier si l'email existe déjà
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                message: 'Cet email est déjà utilisé'
            });
        }

        // Créer l'utilisateur
        const userId = await User.create({
            nom,
            email,
            password,
            role: role || 'annonceur'
        });

        // Générer le token JWT
        const token = jwt.sign(
            { userId, role: role || 'annonceur' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Retourner la réponse
        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            token,
            user: {
                id: userId,
                nom,
                email,
                role: role || 'annonceur'
            }
        });
    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json({
            message: 'Erreur lors de l\'inscription',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
router.post('/login', [
    body('email')
        .notEmpty()
        .withMessage('L\'email est requis')
        .isEmail()
        .withMessage('L\'email doit être valide')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Le mot de passe est requis')
], async (req, res) => {
    try {
        // Validation des données
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Erreurs de validation',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Trouver l'utilisateur par email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Vérifier le mot de passe
        const isValidPassword = await User.comparePassword(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Générer le token JWT
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Retourner la réponse
        res.json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                nom: user.nom,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erreur connexion:', error);
        res.status(500).json({
            message: 'Erreur lors de la connexion',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    Récupérer les informations de l'utilisateur connecté
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'Utilisateur non trouvé'
            });
        }

        res.json({
            user: {
                id: user.id,
                nom: user.nom,
                email: user.email,
                role: user.role,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Erreur récupération profil:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération du profil',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/auth/update-profile
 * @desc    Mettre à jour le profil de l'utilisateur
 * @access  Private
 */
router.put('/update-profile', authenticate, [
    body('nom')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom doit contenir entre 2 et 100 caractères'),

    body('email')
        .optional()
        .isEmail()
        .withMessage('L\'email doit être valide')
        .normalizeEmail(),

    body('password')
        .optional()
        .isLength({ min: 6 })
        .withMessage('Le mot de passe doit contenir au moins 6 caractères')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Erreurs de validation',
                errors: errors.array()
            });
        }

        const { nom, email, password } = req.body;
        const updateData = {};

        if (nom) updateData.nom = nom;
        if (email) updateData.email = email;
        if (password) updateData.password = password;

        // Vérifier si l'email est déjà utilisé par un autre utilisateur
        if (email && email !== req.user.email) {
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.id !== req.user.id) {
                return res.status(400).json({
                    message: 'Cet email est déjà utilisé'
                });
            }
        }

        await User.update(req.user.id, updateData);

        res.json({
            message: 'Profil mis à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        res.status(500).json({
            message: 'Erreur lors de la mise à jour du profil',
            error: error.message
        });
    }
});

module.exports = router;