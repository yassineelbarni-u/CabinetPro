const express = require('express');
const router = express.Router();
const {
    getSummary, getExpenses, getRevenue, getChart, getCategories,
    createExpense, updateExpense, deleteExpense
} = require('../controllers/accounting.controller');
const auth = require('../middleware/auth');

// Résumé (KPI)
router.get('/summary', auth, getSummary);

// Charges (CRUD)
router.get('/expenses', auth, getExpenses);
router.post('/expenses', auth, createExpense);
router.put('/expenses/:id', auth, updateExpense);
router.delete('/expenses/:id', auth, deleteExpense);

// Recettes (liste paiements)
router.get('/revenue', auth, getRevenue);

// Graphiques
router.get('/chart', auth, getChart);
router.get('/categories', auth, getCategories);

module.exports = router;
