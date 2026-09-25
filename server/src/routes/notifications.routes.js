const express = require('express');
const router = express.Router();
const { getNotifications } = require('../controllers/notifications.controller');
const auth = require('../middleware/auth');

// GET /api/notifications — Alertes dynamiques du cabinet
router.get('/', auth, getNotifications);

module.exports = router;
