const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove, getStats } = require('../controllers/patients.controller');
const auth = require('../middleware/auth');

// Toutes les routes patients sont protégées
router.use(auth);

router.get('/stats', getStats);
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
