const express = require('express');
const router = express.Router();
const { validateAnnonce, checkAnnonceOwnership } = require('../middlewares/annonces');
const { validateAuthentication } = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/users');

const { deleteAnnonce, getAnnonceById, createAnnonce, searchAnnonce, updateAnnonce, getAllAnnonces } = require('../services/annonces');

router.get('/', searchAnnonce);

router.get('/all', validateAuthentication, isAdmin, getAllAnnonces);

router.get('/:id', getAnnonceById);

router.post('/', validateAuthentication, validateAnnonce, createAnnonce);

router.put('/:id', validateAuthentication, checkAnnonceOwnership, validateAnnonce, updateAnnonce);

router.delete('/:id', validateAuthentication, checkAnnonceOwnership, deleteAnnonce);

module.exports = router;