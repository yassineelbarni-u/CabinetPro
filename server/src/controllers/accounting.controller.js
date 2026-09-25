const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/db');
const { Expense, Payment, Session, Patient } = require('../models');

// ─── Utilitaire : calcul plage de dates ───────────────────────────────────────
function getDateRange(period, date_from, date_to) {
    const now = new Date();
    let start, end;

    switch (period) {
        case 'this_month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
        case 'last_month':
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            break;
        case 'this_quarter':
            const qStart = Math.floor(now.getMonth() / 3) * 3;
            start = new Date(now.getFullYear(), qStart, 1);
            end = new Date(now.getFullYear(), qStart + 3, 0, 23, 59, 59, 999);
            break;
        case 'this_year':
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;
        case 'custom':
            start = date_from ? new Date(date_from) : new Date(now.getFullYear(), now.getMonth(), 1);
            end = date_to ? new Date(date_to) : new Date();
            end.setHours(23, 59, 59, 999);
            break;
        default: // this_month
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    return { start, end };
}

// ─── GET /api/accounting/summary ──────────────────────────────────────────────
const getSummary = async (req, res, next) => {
    try {
        const cabinet_id = req.user.cabinet_id;
        const { period = 'this_month', date_from, date_to } = req.query;
        const { start, end } = getDateRange(period, date_from, date_to);

        const dateFilter = { [Op.gte]: start, [Op.lte]: end };

        const [totalIncome, totalExpense, sessionCount] = await Promise.all([
            Payment.sum('amount', {
                where: { cabinet_id, payment_date: dateFilter }
            }),
            Expense.sum('amount', {
                where: { cabinet_id, expense_date: dateFilter }
            }),
            Session.count({
                where: { cabinet_id, session_date: dateFilter }
            }),
        ]);

        const income = parseFloat(totalIncome || 0);
        const expense = parseFloat(totalExpense || 0);
        const avgTicket = sessionCount > 0 ? income / sessionCount : 0;

        // Taux de recouvrement : total payé / total dû sur la période
        const totalDue = await Session.sum('total_price', {
            where: { cabinet_id, session_date: dateFilter }
        }) || 0;
        const recoveryRate = parseFloat(totalDue) > 0
            ? Math.round((income / parseFloat(totalDue)) * 100)
            : 0;

        res.json({
            success: true,
            data: {
                income,
                expense,
                net_profit: income - expense,
                session_count: sessionCount,
                avg_ticket: parseFloat(avgTicket.toFixed(2)),
                recovery_rate: recoveryRate,
                period: { start, end },
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
        const { page = 1, limit = 20, period = 'this_month', date_from, date_to } = req.query;
        const { start, end } = getDateRange(period, date_from, date_to);

        const { count, rows } = await Expense.findAndCountAll({
            where: {
                cabinet_id,
                expense_date: { [Op.gte]: start, [Op.lte]: end },
            },
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

// ─── GET /api/accounting/revenue — Liste des paiements ────────────────────────
const getRevenue = async (req, res, next) => {
    try {
        const cabinet_id = req.user.cabinet_id;
        const { page = 1, limit = 20, period = 'this_month', date_from, date_to } = req.query;
        const { start, end } = getDateRange(period, date_from, date_to);

        const { count, rows } = await Payment.findAndCountAll({
            where: {
                cabinet_id,
                payment_date: { [Op.gte]: start, [Op.lte]: end },
            },
            include: [{
                model: Patient,
                as: 'patient',
                attributes: ['id', 'first_name', 'last_name'],
            }],
            order: [['payment_date', 'DESC']],
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

// ─── GET /api/accounting/chart — Données mensuelles recettes vs charges ───────
const getChart = async (req, res, next) => {
    try {
        const cabinet_id = req.user.cabinet_id;
        const months = parseInt(req.query.months) || 6;
        const data = [];

        for (let i = months - 1; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
            const dateFilter = { [Op.gte]: monthStart, [Op.lte]: monthEnd };

            const [income, expense] = await Promise.all([
                Payment.sum('amount', { where: { cabinet_id, payment_date: dateFilter } }),
                Expense.sum('amount', { where: { cabinet_id, expense_date: dateFilter } }),
            ]);

            data.push({
                month: monthStart.toLocaleDateString('fr-MA', { month: 'short', year: '2-digit' }),
                income: parseFloat(income || 0),
                expense: parseFloat(expense || 0),
                profit: parseFloat(income || 0) - parseFloat(expense || 0),
            });
        }

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/accounting/categories — Répartition des charges par catégorie ───
const getCategories = async (req, res, next) => {
    try {
        const cabinet_id = req.user.cabinet_id;
        const { period = 'this_month', date_from, date_to } = req.query;
        const { start, end } = getDateRange(period, date_from, date_to);

        const result = await Expense.findAll({
            where: {
                cabinet_id,
                expense_date: { [Op.gte]: start, [Op.lte]: end },
            },
            attributes: [
                'category',
                [fn('SUM', col('amount')), 'total'],
                [fn('COUNT', col('id')), 'count'],
            ],
            group: ['category'],
            order: [[literal('total'), 'DESC']],
            raw: true,
        });

        res.json({
            success: true,
            data: result.map(r => ({
                category: r.category,
                total: parseFloat(r.total),
                count: parseInt(r.count),
            })),
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

// ─── PUT /api/accounting/expenses/:id — Modifier une charge ────────────────────
const updateExpense = async (req, res, next) => {
    try {
        const cabinet_id = req.user.cabinet_id;
        const expense = await Expense.findOne({ where: { id: req.params.id, cabinet_id } });

        if (!expense) return res.status(404).json({ success: false, message: 'Dépense introuvable.' });

        const { category, description, amount, expense_date, frequency } = req.body;
        await expense.update({
            ...(category && { category }),
            ...(description !== undefined && { description }),
            ...(amount && { amount }),
            ...(expense_date && { expense_date }),
            ...(frequency && { frequency }),
        });

        res.json({ success: true, message: 'Dépense mise à jour.', data: expense });
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

module.exports = { getSummary, getExpenses, getRevenue, getChart, getCategories, createExpense, updateExpense, deleteExpense };
