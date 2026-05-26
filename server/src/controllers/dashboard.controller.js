const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { Session, Payment, Patient, Appointment, Expense } = require('../models');

// GET /api/dashboard — Données du tableau de bord
const getDashboard = async (req, res, next) => {
    try {
        const cabinet_id = req.user.cabinet_id;
        const { fn, col, literal } = sequelize;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Patients vus aujourd'hui
        const patientsToday = await Session.count({
            where: {
                cabinet_id,
                session_date: { [Op.gte]: today, [Op.lt]: tomorrow },
            },
            distinct: true,
            col: 'patient_id',
        });

        // Recette du jour
        const revenueToday = await Payment.sum('amount', {
            where: {
                cabinet_id,
                payment_date: { [Op.gte]: today, [Op.lt]: tomorrow },
            },
        }) || 0;

        // Recette du mois
        const revenueMonth = await Payment.sum('amount', {
            where: {
                cabinet_id,
                payment_date: { [Op.gte]: literal("DATE_TRUNC('month', NOW())") },
            },
        }) || 0;

        // Total des séances impayées
        const unpaidResult = await Session.findAll({
            where: {
                cabinet_id,
                payment_status: { [Op.ne]: 'paid' },
            },
            attributes: [[fn('COALESCE', fn('SUM', col('total_price')), 0), 'total']],
            raw: true,
        });
        const totalSessionsDue = parseFloat(unpaidResult[0]?.total || 0);

        // Paiements sur ces séances
        const paidOnUnpaid = await Payment.sum('amount', {
            where: {
                cabinet_id,
                session_id: {
                    [Op.in]: literal(`(SELECT id FROM sessions WHERE cabinet_id = '${cabinet_id}' AND payment_status != 'paid')`),
                },
            },
        }) || 0;

        const unpaidTotal = totalSessionsDue - paidOnUnpaid;

        // Charges du mois
        const expensesMonth = await Expense.sum('amount', {
            where: {
                cabinet_id,
                expense_date: { [Op.gte]: literal("DATE_TRUNC('month', NOW())") },
            },
        }) || 0;

        // Total patients
        const totalPatients = await Patient.count({ where: { cabinet_id } });

        // Nouveaux patients ce mois
        const newPatientsMonth = await Patient.count({
            where: {
                cabinet_id,
                created_at: { [Op.gte]: literal("DATE_TRUNC('month', NOW())") },
            },
        });

        // Prochains rendez-vous (eager loading)
        const nextAppointments = await Appointment.findAll({
            where: {
                cabinet_id,
                appointment_date: { [Op.gte]: new Date() },
                status: { [Op.ne]: 'cancelled' },
            },
            include: [{
                model: Patient,
                as: 'patient',
                attributes: ['id', 'first_name', 'last_name', 'phone_primary'],
            }],
            order: [['appointment_date', 'ASC']],
            limit: 5,
        });

        // Patients récents
        const recentPatients = await Patient.findAll({
            where: { cabinet_id },
            attributes: ['id', 'first_name', 'last_name', 'phone_primary', 'created_at'],
            order: [['created_at', 'DESC']],
            limit: 5,
        });

        const netProfit = revenueMonth - expensesMonth;

        res.json({
            success: true,
            data: {
                patients_today: patientsToday,
                revenue_today: parseFloat(revenueToday),
                revenue_month: parseFloat(revenueMonth),
                unpaid_total: parseFloat(unpaidTotal),
                expenses_month: parseFloat(expensesMonth),
                net_profit: parseFloat(netProfit),
                total_patients: totalPatients,
                new_patients_month: newPatientsMonth,
                next_appointments: nextAppointments,
                recent_patients: recentPatients,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboard };
