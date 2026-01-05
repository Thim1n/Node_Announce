const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const Annonce = require('../models/Annonces');
const User = require('../models/Users');
const { body, param, validationResult } = require('express-validator');

/**
 * @route   GET /api/admin/annonces
 * @desc    Récupérer toutes les annonces (toutes, même non-visibles) avec filtres
 * @access  Private (Administrateur uniquement)
 * @query   user_id - Filtrer par utilisateur
 * @query   statut - Filtrer par statut (visible, non-visible)
 * @query   categorie - Filtrer par catégorie
 * @query   search - Rechercher dans titre/description
 */
router.get('/annonces', authenticate, authorize('administrateur'), async (req, res) => {
    try {
        const { user_id, statut, categorie, search } = req.query;

        const filters = {};

        if (user_id) filters.user_id = Number.parseInt(user_id);
        if (statut) filters.statut = statut;
        if (categorie) filters.categorie = categorie;
        if (search) filters.search = search;

        const annonces = await Annonce.findAll(filters);

        res.json({
            message: 'Liste de toutes les annonces',
            count: annonces.length,
            annonces
        });
    } catch (error) {
        console.error('Erreur récupération annonces admin:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des annonces',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/admin/annonces/:id
 * @desc    Récupérer une annonce spécifique (même si non-visible)
 * @access  Private (Administrateur uniquement)
 */
router.get('/annonces/:id', authenticate, authorize('administrateur'), [
    param('id').isInt({ min: 1 }).withMessage('ID invalide')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Erreurs de validation',
                errors: errors.array()
            });
        }

        const annonce = await Annonce.findById(req.params.id);

        if (!annonce) {
            return res.status(404).json({
                message: 'Annonce non trouvée'
            });
        }

        res.json({
            message: 'Détails de l\'annonce',
            annonce
        });
    } catch (error) {
        console.error('Erreur récupération annonce admin:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération de l\'annonce',
            error: error.message
        });
    }
});

/**
 * @route   PATCH /api/admin/annonces/:id/statut
 * @desc    Modifier le statut d'une annonce et ajouter un commentaire
 * @access  Private (Administrateur uniquement)
 * @body    statut - Nouveau statut (visible, non-visible)
 * @body    commentaire_admin - Commentaire de l'administrateur (optionnel)
 */
router.patch('/annonces/:id/statut', authenticate, authorize('administrateur'), [
    param('id').isInt({ min: 1 }).withMessage('ID invalide'),
    body('statut')
        .notEmpty()
        .withMessage('Le statut est requis')
        .isIn(['visible', 'non-visible'])
        .withMessage('Le statut doit être "visible" ou "non-visible"'),
    body('commentaire_admin')
        .optional()
        .isString()
        .withMessage('Le commentaire doit être une chaîne de caractères')
        .trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Erreurs de validation',
                errors: errors.array()
            });
        }

        const { statut, commentaire_admin } = req.body;

        // Vérifier que l'annonce existe
        const annonce = await Annonce.findById(req.params.id);
        if (!annonce) {
            return res.status(404).json({
                message: 'Annonce non trouvée'
            });
        }

        // Mettre à jour le statut
        const affectedRows = await Annonce.updateStatut(
            req.params.id,
            statut,
            commentaire_admin || null
        );

        if (affectedRows === 0) {
            return res.status(500).json({
                message: 'Erreur lors de la mise à jour du statut'
            });
        }

        res.json({
            message: 'Statut de l\'annonce mis à jour avec succès',
            new_statut: statut,
            commentaire_admin: commentaire_admin || null
        });
    } catch (error) {
        console.error('Erreur modification statut:', error);
        res.status(500).json({
            message: 'Erreur lors de la modification du statut',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/admin/annonces/:id
 * @desc    Supprimer une annonce (admin peut supprimer n'importe quelle annonce)
 * @access  Private (Administrateur uniquement)
 */
router.delete('/annonces/:id', authenticate, authorize('administrateur'), [
    param('id').isInt({ min: 1 }).withMessage('ID invalide')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Erreurs de validation',
                errors: errors.array()
            });
        }

        const annonce = await Annonce.findById(req.params.id);

        if (!annonce) {
            return res.status(404).json({
                message: 'Annonce non trouvée'
            });
        }

        await Annonce.delete(req.params.id);

        res.json({
            message: 'Annonce supprimée avec succès par l\'administrateur'
        });
    } catch (error) {
        console.error('Erreur suppression annonce admin:', error);
        res.status(500).json({
            message: 'Erreur lors de la suppression de l\'annonce',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/admin/users
 * @desc    Récupérer tous les utilisateurs
 * @access  Private (Administrateur uniquement)
 * @query   role - Filtrer par rôle
 */
router.get('/users', authenticate, authorize('administrateur'), async (req, res) => {
    try {
        const { role } = req.query;

        const filters = {};
        if (role) filters.role = role;

        const users = await User.findAll(filters);

        res.json({
            message: 'Liste des utilisateurs',
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Erreur récupération utilisateurs:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des utilisateurs',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Récupérer les statistiques de la plateforme
 * @access  Private (Administrateur uniquement)
 */
router.get('/stats', authenticate, authorize('administrateur'), async (req, res) => {
    try {
        const annonceStats = await Annonce.getStats();
        const users = await User.findAll();

        const stats = {
            annonces: annonceStats,
            users: {
                total: users.length,
                annonceurs: users.filter(u => u.role === 'annonceur').length,
                acheteurs: users.filter(u => u.role === 'acheteur').length,
                administrateurs: users.filter(u => u.role === 'administrateur').length
            }
        };

        res.json({
            message: 'Statistiques de la plateforme',
            stats
        });
    } catch (error) {
        console.error('Erreur récupération stats:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
});

module.exports = router;