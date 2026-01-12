const express = require('express');
const router = express.Router();
const { validateAuthentication } = require('../middlewares/auth');
const { getProfile, updateProfile, changePassword } = require('../services/users');

// Récupérer son profil
router.get('/profile', validateAuthentication, getProfile);

// Mettre à jour son profil
router.put('/profile', validateAuthentication, updateProfile);

// Changer son mot de passe
router.put('/profile/password', validateAuthentication, changePassword);

module.exports = router;
