const express = require('express');
const router = express.Router();
const { getSummary, getExpenses, createExpense, deleteExpense } = require('../controllers/accounting.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/summary', getSummary);

router.route('/expenses')
    .get(getExpenses)
    .post(createExpense);

router.route('/expenses/:id')
    .delete(deleteExpense);

module.exports = router;
