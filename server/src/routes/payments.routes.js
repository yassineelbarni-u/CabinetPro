const express = require('express');
const router = express.Router();
const { getAll, getStats, create, remove, update } = require('../controllers/payments.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.route('/')
    .get(getAll)
    .post(create);

router.get('/stats', getStats);

router.route('/:id')
    .put(update)
    .delete(remove);

module.exports = router;
