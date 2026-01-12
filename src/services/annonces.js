const { Op } = require('sequelize');
const { Annonce, dbInstance } = require('../models');
const { mailer } = require('../utils/mailer');
const { ApiError } = require('../middlewares/errorHandler');
require('dotenv').config({ quiet: true });

const getAnnonceById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const annonce = await Annonce.findOne({
            where: {
                id
            },
            include: [
                {
                    model: require('../models').Category,
                    as: 'Category',
                    attributes: ['id', 'name', 'slug']
                },
                {
                    model: require('../models').User,
                    as: 'User',
                    attributes: ['id', 'username', 'firstname', 'lastname']
                }
            ]
        });

        if (!annonce) {
            return next(ApiError.notFound("Annonce non trouvée"));
        }

        return res.status(200).json({
            success: true,
            data: {
                annonce
            }
        });
    } catch(error) {
        next(ApiError.internal("Erreur lors de la récupération de l'annonce"));
    }
}

const searchAnnonce = async (req, res, next) => {
    try {
        const search_key = req.query.search;
        const category_id = req.query.category_id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Validation
        if (page < 1 || limit < 1 || limit > 100) {
            return next(ApiError.badRequest('Paramètres de pagination invalides'));
        }

        // Construction des conditions WHERE
        const where = {};
        if (search_key) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search_key}%` } },
                { description: { [Op.like]: `%${search_key}%` } }
            ];
        }
        if (category_id) {
            where.category_id = category_id;
        }

        const conditions = {
            where,
            limit,
            offset,
            include: [{
                model: require('../models').Category,
                as: 'Category',
                attributes: ['id', 'name', 'slug']
            }],
            order: [['createdAt', 'DESC']]
        };

        const { count, rows } = await Annonce.findAndCountAll(conditions);

        return res.status(200).json({
            success: true,
            data: {
                annonces: rows,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit),
                    hasNextPage: page < Math.ceil(count / limit),
                    hasPrevPage: page > 1
                }
            }
        });
    } catch(error) {
        next(ApiError.internal("Erreur lors de la recherche d'annonces"));
    }
}

const createAnnonce = async (req, res, next) => {
    const transaction = await dbInstance.transaction();
    try {
        const { title, description, price, filepath, status, category_id } = req.body;
        const annonce = await Annonce.create({
            title,
            description,
            price,
            filepath,
            status,
            category_id: category_id || null,
            user_id: req.user ? req.user.id : null
        }, { transaction });

        // notification de l'admin d'une nouvelle annonce publiée
        const info = await mailer(
            process.env.ADMIN_EMAIL,
            'Nouvelle Annonce',
            'Email de confirmation - Une nouvelle annonce à été créer',
            '<html><h1>Email de confirmation</h1><br><p>Une nouvelle annonce à été créer.</p></html>'
        );

        await transaction.commit();
        return res.status(201).json({
            success: true,
            message: "Annonce créée avec succès",
            data: {
                annonce,
                mail_notification: info
            }
        });
    } catch (error) {
        await transaction.rollback();
        const errormsg = (error.name === 'SequelizeDatabaseError') ? error.parent.sqlMessage : error;
        next(ApiError.badRequest("Erreur lors de la création de l'annonce", errormsg));
    }
}

const updateAnnonce = async (req, res, next) => {
    const transaction = await dbInstance.transaction();
    try {
        const { title, description, price, filepath, status, category_id, admin_comment } = req.body;
        const { id } = req.params;

        // Vérifier si l'annonce existe
        const existingAnnonce = await Annonce.findOne({
            where: { id },
            transaction
        });

        if (!existingAnnonce) {
            await transaction.rollback();
            return next(ApiError.notFound("Annonce non trouvée"));
        }

        // Construire l'objet de mise à jour
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = price;
        if (filepath !== undefined) updateData.filepath = filepath;
        if (category_id !== undefined) updateData.category_id = category_id;

        // Seuls les admins peuvent modifier le statut et ajouter des commentaires
        if (req.user.role === 'admin') {
            if (status !== undefined) updateData.status = status;
            if (admin_comment !== undefined) updateData.admin_comment = admin_comment;
        }

        // Mettre à jour l'annonce
        await Annonce.update(updateData, {
            where: {
                id
            },
            transaction
        });

        // Récupérer l'annonce mise à jour avec les relations
        const updatedAnnonce = await Annonce.findOne({
            where: { id },
            include: [{
                model: require('../models').Category,
                as: 'Category',
                attributes: ['id', 'name', 'slug']
            }],
            transaction
        });

        await transaction.commit();
        return res.status(200).json({
            success: true,
            message: "Annonce mise à jour avec succès",
            data: {
                annonce: updatedAnnonce
            }
        });
    } catch (error) {
        await transaction.rollback();
        next(ApiError.badRequest("Erreur lors de la mise à jour de l'annonce", error.message));
    }
}

const deleteAnnonce = async (req, res, next) => {
    const transaction = await dbInstance.transaction();
    try {
        const { id } = req.params;

        // Vérifier si l'annonce existe
        const existingAnnonce = await Annonce.findOne({
            where: { id },
            transaction
        });

        if (!existingAnnonce) {
            await transaction.rollback();
            return next(ApiError.notFound("Annonce non trouvée"));
        }

        // Supprimer l'annonce
        const annonce = await Annonce.destroy({
            where: {
                id
            },
            transaction
        });

        await transaction.commit();
        return res.status(200).json({
            success: true,
            message: "Annonce supprimée avec succès"
        });
    } catch (error) {
        await transaction.rollback();
        next(ApiError.badRequest("Erreur lors de la suppression de l'annonce", error.message));
    }
}

const getAllAnnonces = async (req, res, next) => {
    try {
        const { user_id, status, page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const where = {};
        if (user_id) where.user_id = user_id;
        if (status) where.status = status;

        const { count, rows } = await Annonce.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset,
            include: [
                {
                    model: require('../models').User,
                    as: 'User',
                    attributes: ['id', 'username', 'firstname', 'lastname']
                },
                {
                    model: require('../models').Category,
                    as: 'Category',
                    attributes: ['id', 'name', 'slug']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: {
                annonces: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages: Math.ceil(count / parseInt(limit))
                }
            }
        });
    } catch(error) {
        next(ApiError.internal("Erreur lors de la récupération des annonces"));
    }
};

module.exports = {
    getAnnonceById,
    createAnnonce,
    searchAnnonce,
    updateAnnonce,
    deleteAnnonce,
    getAllAnnonces
};