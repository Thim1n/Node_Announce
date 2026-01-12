const express = require('express');
const router = express.Router();
const { validateAuthentication } = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/users');
const {
    getAllCategories,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../services/categories');

// Routes publiques
router.get('/', getAllCategories);
router.get('/:slug', getCategoryBySlug);

// Routes admin uniquement
router.post('/', validateAuthentication, isAdmin, createCategory);
router.put('/:id', validateAuthentication, isAdmin, updateCategory);
router.delete('/:id', validateAuthentication, isAdmin, deleteCategory);

module.exports = router;
