const { Category } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * Récupère toutes les catégories
 */
const getAllCategories = async (req, res, next) => {
    try {
        const categories = await Category.findAll({
            order: [['name', 'ASC']]
        });

        return res.status(200).json({
            success: true,
            data: {
                categories
            }
        });
    } catch(error) {
        next(ApiError.internal('Erreur lors de la récupération des catégories'));
    }
};

/**
 * Récupère une catégorie par son slug
 */
const getCategoryBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const category = await Category.findOne({
            where: { slug }
        });

        if (!category) {
            return next(ApiError.notFound('Catégorie non trouvée'));
        }

        return res.status(200).json({
            success: true,
            data: {
                category
            }
        });
    } catch(error) {
        next(ApiError.internal('Erreur lors de la récupération de la catégorie'));
    }
};

/**
 * Crée une nouvelle catégorie (admin uniquement)
 */
const createCategory = async (req, res, next) => {
    try {
        const { name, slug, description } = req.body;

        const category = await Category.create({
            name,
            slug,
            description
        });

        return res.status(201).json({
            success: true,
            message: 'Catégorie créée avec succès',
            data: {
                category
            }
        });
    } catch(error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return next(ApiError.conflict('Une catégorie avec ce nom ou slug existe déjà'));
        }
        next(ApiError.badRequest('Erreur lors de la création de la catégorie', error.message));
    }
};

/**
 * Met à jour une catégorie (admin uniquement)
 */
const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, slug, description } = req.body;

        const category = await Category.findByPk(id);

        if (!category) {
            return next(ApiError.notFound('Catégorie non trouvée'));
        }

        await category.update({
            ...(name !== undefined && { name }),
            ...(slug !== undefined && { slug }),
            ...(description !== undefined && { description })
        });

        return res.status(200).json({
            success: true,
            message: 'Catégorie mise à jour avec succès',
            data: {
                category
            }
        });
    } catch(error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return next(ApiError.conflict('Une catégorie avec ce nom ou slug existe déjà'));
        }
        next(ApiError.badRequest('Erreur lors de la mise à jour de la catégorie', error.message));
    }
};

/**
 * Supprime une catégorie (admin uniquement)
 */
const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        const category = await Category.findByPk(id);

        if (!category) {
            return next(ApiError.notFound('Catégorie non trouvée'));
        }

        await category.destroy();

        return res.status(200).json({
            success: true,
            message: 'Catégorie supprimée avec succès'
        });
    } catch(error) {
        next(ApiError.badRequest('Erreur lors de la suppression de la catégorie', error.message));
    }
};

module.exports = {
    getAllCategories,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory
};
