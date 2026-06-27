const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/db');
const { Payment, Patient, Session } = require('../models');

// ─── GET /api/payments ────────────────────────────────────────────────────────
// Liste paginée avec filtres : search (nom patient), method, dateFrom, dateTo
const getAll = async (req, res, next) => {
    try {
        const cabinet_id = req.user.cabinet_id;
        const {
            search,
            method,
            payer_type,
            date_from,
            date_to,
            page  = 1,
            limit = 20,
        } = req.query;

        const where = { cabinet_id };

        if (method)      where.payment_method = method;
        if (payer_type)  where.payer_type = payer_type;
        if (date_from || date_to) {
            where.payment_date = {};
            if (date_from) where.payment_date[Op.gte] = new Date(date_from);
            if (date_to) {
                const end = new Date(date_to);
                end.setHours(23, 59, 59, 999);
                where.payment_date[Op.lte] = end;
            }
        }

        // Include patient pour le search
        const patientWhere = search
            ? {
                [Op.or]: [
                    { first_name: { [Op.iLike]: `%${search}%` } },
                    { last_name:  { [Op.iLike]: `%${search}%` } },
                ],
            }
            : undefined;

        const { count, rows } = await Payment.findAndCountAll({
            where,
            include: [
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'first_name', 'last_name', 'phone_primary'],
                    where: patientWhere,
                    required: !!search,
                },
                {
                    model: Session,
                    as: 'session',
                    attributes: ['id', 'care_type', 'total_price', 'payment_status'],
                    required: false,
                },
            ],
            order: [['payment_date', 'DESC']],
            limit:  parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
        });

        res.json({
            success: true,
            data: rows,
            pagination: {
                page:  parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / parseInt(limit)),
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/payments/stats ──────────────────────────────────────────────────
// Statistiques rapides : recettes du jour, mois, répartition par méthode
const getStats = async (req, res, next) => {
    try {
        const cabinet_id = req.user.cabinet_id;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const [revenueToday, revenueMonth, revenueYear, byMethod, recentPayments] =
            await Promise.all([
                // Recette du jour
                Payment.sum('amount', {
                    where: {
                        cabinet_id,
                        payment_date: { [Op.between]: [todayStart, todayEnd] },
                    },
                }),
                // Recette du mois
                Payment.sum('amount', {
                    where: {
                        cabinet_id,
                        payment_date: { [Op.gte]: literal("DATE_TRUNC('month', NOW())") },
                    },
                }),
                // Recette de l'année
                Payment.sum('amount', {
                    where: {
                        cabinet_id,
                        payment_date: { [Op.gte]: literal("DATE_TRUNC('year', NOW())") },
                    },
                }),
                // Répartition par méthode de paiement (ce mois)
                Payment.findAll({
                    where: {
                        cabinet_id,
                        payment_date: { [Op.gte]: literal("DATE_TRUNC('month', NOW())") },
                    },
                    attributes: [
                        'payment_method',
                        [fn('SUM', col('amount')), 'total'],
                        [fn('COUNT', col('id')), 'count'],
                    ],
                    group: ['payment_method'],
                    raw: true,
                }),
                // 5 derniers paiements
                Payment.findAll({
                    where: { cabinet_id },
                    include: [{
                        model: Patient,
                        as: 'patient',
                        attributes: ['id', 'first_name', 'last_name'],
                    }],
                    order: [['payment_date', 'DESC']],
                    limit: 5,
                }),
            ]);

        res.json({
            success: true,
            data: {
                revenue_today:  parseFloat(revenueToday  || 0),
                revenue_month:  parseFloat(revenueMonth  || 0),
                revenue_year:   parseFloat(revenueYear   || 0),
                by_method:      byMethod,
                recent_payments: recentPayments,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── POST /api/payments ───────────────────────────────────────────────────────
const create = async (req, res, next) => {
    try {
        const cabinet_id = req.user.cabinet_id;
        const { patient_id, session_id, amount, payment_method, payer_type, notes, payment_date } = req.body;

        if (!patient_id || !amount) {
            return res.status(400).json({
                success: false,
                message: 'patient_id et amount sont requis.',
            });
        }

        const payment = await Payment.create({
            cabinet_id,
            patient_id,
            session_id: session_id || null,
            amount: parseFloat(amount),
            payment_method: payment_method || 'especes',
            payer_type:     payer_type     || 'patient',
            notes:          notes          || null,
            payment_date:   payment_date   ? new Date(payment_date) : new Date(),
        });

        // Si lié à une session, mettre à jour le statut de paiement
        if (session_id) {
            const session = await Session.findByPk(session_id);
            if (session) {
                const totalPaid = await Payment.sum('amount', {
                    where: { session_id, cabinet_id },
                });
                const totalDue = parseFloat(session.total_price);
                const paid     = parseFloat(totalPaid || 0);

                if (paid >= totalDue) {
                    await session.update({ payment_status: 'paid' });
                } else if (paid > 0) {
                    await session.update({ payment_status: 'partial' });
                }
            }
        }

        // Rechargement avec associations
        const full = await Payment.findByPk(payment.id, {
            include: [{ model: Patient, as: 'patient', attributes: ['id', 'first_name', 'last_name'] }],
        });

        res.status(201).json({
            success: true,
            message: 'Paiement enregistré avec succès.',
            data: full,
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: error.errors.map(e => e.message).join(', '),
            });
        }
        next(error);
    }
};

// ─── DELETE /api/payments/:id ─────────────────────────────────────────────────
const remove = async (req, res, next) => {
    try {
        const cabinet_id = req.user.cabinet_id;
        const payment = await Payment.findOne({ where: { id: req.params.id, cabinet_id } });

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Paiement introuvable.' });
        }

        const { session_id } = payment;
        await payment.destroy();

        // Recalcul du statut de la session si applicable
        if (session_id) {
            const session = await Session.findByPk(session_id);
            if (session) {
                const totalPaid = await Payment.sum('amount', { where: { session_id, cabinet_id } });
                const totalDue  = parseFloat(session.total_price);
                const paid      = parseFloat(totalPaid || 0);

                if (paid >= totalDue)       await session.update({ payment_status: 'paid' });
                else if (paid > 0)          await session.update({ payment_status: 'partial' });
                else                        await session.update({ payment_status: 'unpaid' });
            }
        }

        res.json({ success: true, message: 'Paiement supprimé.' });
    } catch (error) {
        next(error);
    }
};

// ─── PUT /api/payments/:id ────────────────────────────────────────────────────
const update = async (req, res, next) => {
    try {
        const cabinet_id = req.user.cabinet_id;
        const { amount, payment_method, payer_type, notes, payment_date } = req.body;

        const payment = await Payment.findOne({ where: { id: req.params.id, cabinet_id } });

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Paiement introuvable.' });
        }

        const oldAmount = parseFloat(payment.amount);
        const newAmount = amount ? parseFloat(amount) : oldAmount;
        
        await payment.update({
            amount: newAmount,
            payment_method: payment_method || payment.payment_method,
            payer_type: payer_type || payment.payer_type,
            notes: notes !== undefined ? notes : payment.notes,
            payment_date: payment_date ? new Date(payment_date) : payment.payment_date,
        });

        // Recalcul du statut de la session si applicable et si le montant a changé
        if (payment.session_id && oldAmount !== newAmount) {
            const session = await Session.findByPk(payment.session_id);
            if (session) {
                const totalPaid = await Payment.sum('amount', { where: { session_id: payment.session_id, cabinet_id } });
                const totalDue  = parseFloat(session.total_price);
                const paid      = parseFloat(totalPaid || 0);

                if (paid >= totalDue)       await session.update({ payment_status: 'paid' });
                else if (paid > 0)          await session.update({ payment_status: 'partial' });
                else                        await session.update({ payment_status: 'unpaid' });
            }
        }

        const full = await Payment.findByPk(payment.id, {
            include: [{ model: Patient, as: 'patient', attributes: ['id', 'first_name', 'last_name'] }],
        });

        res.json({ success: true, message: 'Paiement mis à jour.', data: full });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ success: false, message: error.errors.map(e => e.message).join(', ') });
        }
        next(error);
    }
};

module.exports = { getAll, getStats, create, remove, update };
