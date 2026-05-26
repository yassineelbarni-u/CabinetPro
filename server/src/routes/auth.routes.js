const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

// Routes publiques
router.post('/register', register);
router.post('/login', login);

// Routes protégées
router.get('/me', auth, getMe);

module.exports = router;
