const express = require('express');
const router = express.Router();
const { register, login, logout } = require('../services/auth');
const { validateRegister } = require('../middlewares/users');

router.post('/register', validateRegister, register);

router.post('/login', login);

router.post('/logout', logout);

module.exports = router;