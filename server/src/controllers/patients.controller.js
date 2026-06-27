const { Op } = require('sequelize');
const { Patient, Session, Payment } = require('../models');

// GET /api/patients — Liste des patients du cabinet
const getAll = async (req, res, next) => {
    try {
        const { search, type, sort, page = 1, limit = 20 } = req.query;
        const cabinet_id = req.user.cabinet_id;

        // Construire les conditions (comme Criteria API en Hibernate)
        const where = { cabinet_id };

        // Recherche par nom, prénom ou téléphone
        if (search) {
            where[Op.or] = [
                { first_name: { [Op.iLike]: `%${search}%` } },
                { last_name: { [Op.iLike]: `%${search}%` } },
                { first_name_ar: { [Op.like]: `%${search}%` } },
                { last_name_ar: { [Op.like]: `%${search}%` } },
                { phone_primary: { [Op.like]: `%${search}%` } },
            ];
        }

        // Filtre par type de patient
        if (type) {
            where.patient_type = type;
        }

        // Tri
        let order = [['updated_at', 'DESC']];
        if (sort === 'recent') {
            order = [['created_at', 'DESC']];
        } else if (sort === 'name') {
            order = [['last_name', 'ASC'], ['first_name', 'ASC']];
        }

        // Requête avec pagination (comme Pageable en Spring)
        const { count, rows } = await Patient.findAndCountAll({
            where,
            order,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            attributes: {
                include: [
                    // Sous-requêtes calculées
                    [
                        Patient.sequelize.literal(
                            `(SELECT COUNT(*) FROM sessions WHERE sessions.patient_id = patients.id)`
                        ),
                        'session_count',
                    ],
                    [
                        Patient.sequelize.literal(
                            `(SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payments.patient_id = patients.id)`
                        ),
                        'total_paid',
                    ],
                ],
            },
        });

        res.json({
            success: true,
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / parseInt(limit)),
            },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/patients/:id — Détail d'un patient
const getById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const cabinet_id = req.user.cabinet_id;

        const patient = await Patient.findOne({
            where: { id, cabinet_id },
            include: [
                {
                    model: Session,
                    as: 'sessions',
                    limit: 10,
                    order: [['session_date', 'DESC']],
                    attributes: ['id', 'session_date', 'care_type', 'total_price', 'payment_status', 'clinical_notes'],
                },
                {
                    model: Payment,
                    as: 'payments',
                    limit: 10,
                    order: [['payment_date', 'DESC']],
                    attributes: ['id', 'amount', 'payment_method', 'payment_date', 'payer_type'],
                },
            ],
            attributes: {
                include: [
                    [
                        Patient.sequelize.literal(
                            `(SELECT COUNT(*) FROM sessions WHERE sessions.patient_id = patients.id)`
                        ),
                        'session_count',
                    ],
                    [
                        Patient.sequelize.literal(
                            `(SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payments.patient_id = patients.id)`
                        ),
                        'total_paid',
                    ],
                    [
                        Patient.sequelize.literal(
                            `(SELECT COALESCE(SUM(total_price), 0) FROM sessions WHERE sessions.patient_id = patients.id)`
                        ),
                        'total_due',
                    ],
                ],
            },
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient non trouvé.',
            });
        }

        res.json({
            success: true,
            data: patient,
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/patients — Créer un patient
const create = async (req, res, next) => {
    try {
        const cabinet_id = req.user.cabinet_id;

        const patient = await Patient.create({
            cabinet_id,
            ...req.body,
        });

        res.status(201).json({
            success: true,
            message: 'Patient créé avec succès.',
            data: patient,
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

// PUT /api/patients/:id — Modifier un patient
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const cabinet_id = req.user.cabinet_id;

        const patient = await Patient.findOne({ where: { id, cabinet_id } });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient non trouvé.',
            });
        }

        // Mise à jour partielle (comme merge() en Hibernate)
        await patient.update(req.body);

        res.json({
            success: true,
            message: 'Patient modifié avec succès.',
            data: patient,
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

// DELETE /api/patients/:id — Supprimer un patient
const remove = async (req, res, next) => {
    try {
        const { id } = req.params;
        const cabinet_id = req.user.cabinet_id;

        const patient = await Patient.findOne({ where: { id, cabinet_id } });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient non trouvé.',
            });
        }

        await patient.destroy(); // CASCADE supprime les séances/paiements liés

        res.json({
            success: true,
            message: 'Patient supprimé avec succès.',
            data: { id: patient.id, first_name: patient.first_name, last_name: patient.last_name },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/patients/stats — Statistiques patients
const getStats = async (req, res, next) => {
    try {
        const cabinet_id = req.user.cabinet_id;
        const { fn, col, literal } = Patient.sequelize;

        const total = await Patient.count({ where: { cabinet_id } });
        const newThisMonth = await Patient.count({
            where: {
                cabinet_id,
                created_at: { [Op.gte]: literal("DATE_TRUNC('month', NOW())") },
            },
        });

        const byType = await Patient.findAll({
            where: { cabinet_id },
            attributes: [
                'patient_type',
                [fn('COUNT', col('id')), 'count'],
            ],
            group: ['patient_type'],
            raw: true,
        });

        const typeStats = {};
        byType.forEach(row => {
            typeStats[row.patient_type] = parseInt(row.count);
        });

        res.json({
            success: true,
            data: {
                total_patients: total,
                new_this_month: newThisMonth,
                ...typeStats,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAll, getById, create, update, remove, getStats };
