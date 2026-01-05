const express = require('express');
const router = express.Router();
const { authenticate, optionalAuthenticate } = require('../middlewares/auth');
const Annonce = require('../models/Annonces');
const {
    createAnnonceValidation,
    updateAnnonceValidation,
    idParamValidation
} = require('../validators/annoncesValidator');
const { validationResult } = require('express-validator');

/**
 * @route   GET /api/annonces
 * @desc    Récupérer toutes les annonces visibles (avec filtres optionnels)
 * @access  Public
 * @query   categorie - Filtrer par catégorie
 * @query   search - Rechercher dans titre/description
 */
router.get('/', async (req, res) => {
    try {
        const { categorie, search } = req.query;

        // Seules les annonces visibles sont affichées pour le public
        const filters = {
            statut: 'visible'
        };

        if (categorie) filters.categorie = categorie;
        if (search) filters.search = search;

        const annonces = await Annonce.findAll(filters);

        res.json({
            message: 'Liste des annonces',
            count: annonces.length,
            annonces
        });
    } catch (error) {
        console.error('Erreur récupération annonces:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des annonces',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/annonces/categories
 * @desc    Récupérer toutes les catégories disponibles
 * @access  Public
 */
router.get('/categories', async (req, res) => {
    try {
        const categories = await Annonce.getCategories();

        res.json({
            message: 'Liste des catégories',
            categories
        });
    } catch (error) {
        console.error('Erreur récupération catégories:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des catégories',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/annonces/mes-annonces
 * @desc    Récupérer toutes les annonces de l'utilisateur connecté
 * @access  Private (Annonceur)
 */
router.get('/mes-annonces', authenticate, async (req, res) => {
    try {
        const annonces = await Annonce.findByUserId(req.user.id);

        res.json({
            message: 'Mes annonces',
            count: annonces.length,
            annonces
        });
    } catch (error) {
        console.error('Erreur récupération mes annonces:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération de vos annonces',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/annonces/:id
 * @desc    Récupérer une annonce par ID
 * @access  Public (seulement si visible)
 */
router.get('/:id', idParamValidation, async (req, res) => {
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

        // Vérifier que l'annonce est visible (sauf pour le propriétaire)
        if (annonce.statut !== 'visible') {
            return res.status(404).json({
                message: 'Annonce non disponible'
            });
        }

        res.json({
            message: 'Détails de l\'annonce',
            annonce
        });
    } catch (error) {
        console.error('Erreur récupération annonce:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération de l\'annonce',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/annonces
 * @desc    Créer une nouvelle annonce
 * @access  Private (Annonceur authentifié)
 */
router.post('/', authenticate, createAnnonceValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Erreurs de validation',
                errors: errors.array()
            });
        }

        const { titre, description, prix, categorie } = req.body;

        const annonceId = await Annonce.create({
            titre,
            description,
            prix,
            categorie,
            user_id: req.user.id
        });

        res.status(201).json({
            message: 'Annonce créée avec succès',
            annonceId
        });
    } catch (error) {
        console.error('Erreur création annonce:', error);
        res.status(500).json({
            message: 'Erreur lors de la création de l\'annonce',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/annonces/:id
 * @desc    Modifier une annonce (propriétaire uniquement)
 * @access  Private (Annonceur propriétaire)
 */
router.put('/:id', authenticate, updateAnnonceValidation, async (req, res) => {
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

        // Vérifier que l'utilisateur est le propriétaire
        if (annonce.user_id !== req.user.id) {
            return res.status(403).json({
                message: 'Accès refusé. Vous n\'êtes pas le propriétaire de cette annonce.'
            });
        }

        const { titre, description, prix, categorie } = req.body;
        const updateData = {};

        if (titre !== undefined) updateData.titre = titre;
        if (description !== undefined) updateData.description = description;
        if (prix !== undefined) updateData.prix = prix;
        if (categorie !== undefined) updateData.categorie = categorie;

        await Annonce.update(req.params.id, updateData);

        res.json({
            message: 'Annonce mise à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur modification annonce:', error);
        res.status(500).json({
            message: 'Erreur lors de la modification de l\'annonce',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/annonces/:id
 * @desc    Supprimer une annonce (propriétaire uniquement)
 * @access  Private (Annonceur propriétaire)
 */
router.delete('/:id', authenticate, idParamValidation, async (req, res) => {
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

        // Vérifier que l'utilisateur est le propriétaire
        if (annonce.user_id !== req.user.id) {
            return res.status(403).json({
                message: 'Accès refusé. Vous n\'êtes pas le propriétaire de cette annonce.'
            });
        }

        await Annonce.delete(req.params.id);

        res.json({
            message: 'Annonce supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur suppression annonce:', error);
        res.status(500).json({
            message: 'Erreur lors de la suppression de l\'annonce',
            error: error.message
        });
    }
});

module.exports = router;