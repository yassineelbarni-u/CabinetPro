const { Op, fn, col, literal } = require('sequelize');
const { Expense, Payment } = require('../models');

// ─── GET /api/accounting/summary ──────────────────────────────────────────────
const getSummary = async (req, res, next) => {
    try {
        const cabinet_id = req.user.cabinet_id;
        const { date_from, date_to } = req.query;

        let dateFilter = {};
        if (date_from || date_to) {
            if (date_from) dateFilter[Op.gte] = new Date(date_from);
            if (date_to) {
                const end = new Date(date_to);
                end.setHours(23, 59, 59, 999);
                dateFilter[Op.lte] = end;
            }
        } else {
            // Default: current month
            dateFilter = { [Op.gte]: literal("DATE_TRUNC('month', NOW())") };
        }

        const [totalIncome, totalExpense] = await Promise.all([
            Payment.sum('amount', {
                where: { cabinet_id, payment_date: dateFilter }
            }),
            Expense.sum('amount', {
                where: { cabinet_id, expense_date: dateFilter }
            })
        ]);

        const income = parseFloat(totalIncome || 0);
        const expense = parseFloat(totalExpense || 0);

        res.json({
            success: true,
            data: {
                income,
                expense,
                net_profit: income - expense
            }
        });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/accounting/expenses ──────────────────────────────────────────────
const getExpenses = async (req, res, next) => {
    try {
        const cabinet_id = req.user.cabinet_id;
        const { page = 1, limit = 20 } = req.query;

        const { count, rows } = await Expense.findAndCountAll({
            where: { cabinet_id },
            order: [['expense_date', 'DESC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });

        res.json({
            success: true,
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

// ─── POST /api/accounting/expenses ─────────────────────────────────────────────
const createExpense = async (req, res, next) => {
    try {
        const cabinet_id = req.user.cabinet_id;
        const { category, description, amount, expense_date, frequency } = req.body;

        const expense = await Expense.create({
            cabinet_id,
            created_by: req.user.id,
            category: category || 'autres',
            description,
            amount,
            expense_date: expense_date || new Date(),
            frequency: frequency || 'ponctuelle'
        });

        res.status(201).json({
            success: true,
            message: 'Dépense enregistrée.',
            data: expense
        });
    } catch (error) {
        next(error);
    }
};

// ─── DELETE /api/accounting/expenses/:id ────────────────────────────────────────
const deleteExpense = async (req, res, next) => {
    try {
        const cabinet_id = req.user.cabinet_id;
        const expense = await Expense.findOne({ where: { id: req.params.id, cabinet_id } });

        if (!expense) return res.status(404).json({ success: false, message: 'Dépense introuvable.' });

        await expense.destroy();
        res.json({ success: true, message: 'Dépense supprimée.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getSummary, getExpenses, createExpense, deleteExpense };
