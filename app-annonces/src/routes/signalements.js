const express = require('express');
const router = express.Router();
const db = require('../config/database');
const Annonce = require('../models/Annonces');
const { sendSignalementEmail } = require('../services/email');
const { body, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * @route   POST /api/signalements
 * @desc    Créer un nouveau signalement pour une annonce
 * @access  Public
 * @body    email - Email de la personne qui signale
 * @body    message - Message du signalement
 * @body    annonce_id - ID de l'annonce concernée
 */
router.post('/', [
    body('email')
        .notEmpty()
        .withMessage('L\'email est requis')
        .isEmail()
        .withMessage('L\'email doit être valide')
        .normalizeEmail(),

    body('message')
        .notEmpty()
        .withMessage('Le message est requis')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Le message doit contenir entre 10 et 1000 caractères'),

    body('annonce_id')
        .notEmpty()
        .withMessage('L\'ID de l\'annonce est requis')
        .isInt({ min: 1 })
        .withMessage('L\'ID de l\'annonce doit être un entier positif')
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

        const { email, message, annonce_id } = req.body;

        // Vérifier que l'annonce existe
        const annonce = await Annonce.findById(annonce_id);

        if (!annonce) {
            return res.status(404).json({
                message: 'Annonce non trouvée'
            });
        }

        // Enregistrer le signalement dans la base de données
        const [result] = await db.query(
            'INSERT INTO signalements (email, message, annonce_id, statut) VALUES (?, ?, ?, ?)',
            [email, message, annonce_id, 'nouveau']
        );

        // Envoyer un email à l'administrateur
        try {
            await sendSignalementEmail({
                userEmail: email,
                message,
                annonceId: annonce_id,
                annonceTitle: annonce.titre
            });
        } catch (emailError) {
            console.error('Erreur envoi email signalement:', emailError);
            // Ne pas bloquer la création du signalement si l'email échoue
        }

        res.status(201).json({
            message: 'Signalement enregistré avec succès. L\'administrateur sera notifié.',
            signalementId: result.insertId
        });
    } catch (error) {
        console.error('Erreur création signalement:', error);
        res.status(500).json({
            message: 'Erreur lors de l\'enregistrement du signalement',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/signalements
 * @desc    Récupérer tous les signalements (admin uniquement)
 * @access  Private (Administrateur)
 * @query   statut - Filtrer par statut (nouveau, traite, rejete)
 * @query   annonce_id - Filtrer par annonce
 */
router.get('/', authenticate, authorize('administrateur'), async (req, res) => {
    try {
        const { statut, annonce_id } = req.query;

        let query = `
            SELECT
                s.*,
                a.titre as annonce_titre,
                a.statut as annonce_statut
            FROM signalements s
                     JOIN annonces a ON s.annonce_id = a.id
        `;
        const params = [];
        const conditions = [];

        if (statut) {
            conditions.push('s.statut = ?');
            params.push(statut);
        }

        if (annonce_id) {
            conditions.push('s.annonce_id = ?');
            params.push(annonce_id);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY s.created_at DESC';

        const [signalements] = await db.query(query, params);

        res.json({
            message: 'Liste des signalements',
            count: signalements.length,
            signalements
        });
    } catch (error) {
        console.error('Erreur récupération signalements:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des signalements',
            error: error.message
        });
    }
});

/**
 * @route   PATCH /api/signalements/:id/statut
 * @desc    Modifier le statut d'un signalement (admin uniquement)
 * @access  Private (Administrateur)
 * @body    statut - Nouveau statut (nouveau, traite, rejete)
 */
router.patch('/:id/statut', authenticate, authorize('administrateur'), [
    body('statut')
        .notEmpty()
        .withMessage('Le statut est requis')
        .isIn(['nouveau', 'traite', 'rejete'])
        .withMessage('Le statut doit être "nouveau", "traite" ou "rejete"')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Erreurs de validation',
                errors: errors.array()
            });
        }

        const { statut } = req.body;
        const signalementId = req.params.id;

        // Vérifier que le signalement existe
        const [signalements] = await db.query(
            'SELECT * FROM signalements WHERE id = ?',
            [signalementId]
        );

        if (signalements.length === 0) {
            return res.status(404).json({
                message: 'Signalement non trouvé'
            });
        }

        // Mettre à jour le statut
        await db.query(
            'UPDATE signalements SET statut = ? WHERE id = ?',
            [statut, signalementId]
        );

        res.json({
            message: 'Statut du signalement mis à jour avec succès',
            new_statut: statut
        });
    } catch (error) {
        console.error('Erreur modification statut signalement:', error);
        res.status(500).json({
            message: 'Erreur lors de la modification du statut',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/signalements/:id
 * @desc    Supprimer un signalement (admin uniquement)
 * @access  Private (Administrateur)
 */
router.delete('/:id', authenticate, authorize('administrateur'), async (req, res) => {
    try {
        const signalementId = req.params.id;

        const [result] = await db.query(
            'DELETE FROM signalements WHERE id = ?',
            [signalementId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Signalement non trouvé'
            });
        }

        res.json({
            message: 'Signalement supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur suppression signalement:', error);
        res.status(500).json({
            message: 'Erreur lors de la suppression du signalement',
            error: error.message
        });
    }
});

module.exports = router;