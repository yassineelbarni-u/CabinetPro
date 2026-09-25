const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { Appointment, Session, Patient, Payment } = require('../models');

// GET /api/notifications — Calculer dynamiquement les alertes du cabinet
const getNotifications = async (req, res, next) => {
    try {
        const cabinet_id = req.user.cabinet_id;
        const notifications = [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // ─── 1. RDV du jour non confirmés ───────────────────────────
        const unconfirmedToday = await Appointment.findAll({
            where: {
                cabinet_id,
                appointment_date: { [Op.gte]: today, [Op.lt]: tomorrow },
                status: 'pending',
            },
            include: [{
                model: Patient,
                as: 'patient',
                attributes: ['id', 'first_name', 'last_name'],
            }],
            order: [['appointment_date', 'ASC']],
        });

        unconfirmedToday.forEach(apt => {
            const time = new Date(apt.appointment_date).toLocaleTimeString('fr-MA', {
                hour: '2-digit', minute: '2-digit',
            });
            notifications.push({
                id: `rdv-pending-${apt.id}`,
                type: 'rdv_pending',
                priority: 'info',
                icon: '📅',
                title: 'RDV non confirmé',
                message: `${apt.patient?.first_name} ${apt.patient?.last_name} — ${time} (${apt.care_type || 'Consultation'})`,
                link: '/appointments',
                date: apt.appointment_date,
            });
        });

        // ─── 2. Patients absents aujourd'hui ────────────────────────
        const absentToday = await Appointment.findAll({
            where: {
                cabinet_id,
                appointment_date: { [Op.gte]: today, [Op.lt]: tomorrow },
                status: 'absent',
            },
            include: [{
                model: Patient,
                as: 'patient',
                attributes: ['id', 'first_name', 'last_name', 'phone_primary'],
            }],
        });

        absentToday.forEach(apt => {
            notifications.push({
                id: `absent-${apt.id}`,
                type: 'absent',
                priority: 'high',
                icon: '🚫',
                title: 'Patient absent',
                message: `${apt.patient?.first_name} ${apt.patient?.last_name} ne s'est pas présenté(e) au rendez-vous.`,
                link: `/patients/${apt.patient_id}`,
                date: apt.appointment_date,
                phone: apt.patient?.phone_primary,
            });
        });

        // ─── 3. Paiements en retard (séances impayées > 7 jours) ──
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const unpaidSessions = await Session.findAll({
            where: {
                cabinet_id,
                payment_status: { [Op.in]: ['unpaid', 'partial'] },
                session_date: { [Op.lte]: sevenDaysAgo },
            },
            include: [{
                model: Patient,
                as: 'patient',
                attributes: ['id', 'first_name', 'last_name', 'phone_primary'],
            }],
            order: [['session_date', 'ASC']],
            limit: 20,
        });

        for (const session of unpaidSessions) {
            // Calculer le montant restant
            const totalPaid = await Payment.sum('amount', {
                where: { session_id: session.id },
            }) || 0;
            const remaining = parseFloat(session.total_price) - parseFloat(totalPaid);

            if (remaining > 0) {
                const daysSince = Math.floor((Date.now() - new Date(session.session_date).getTime()) / (1000 * 60 * 60 * 24));
                notifications.push({
                    id: `unpaid-${session.id}`,
                    type: 'payment_overdue',
                    priority: daysSince > 30 ? 'high' : 'medium',
                    icon: '💰',
                    title: 'Paiement en retard',
                    message: `${session.patient?.first_name} ${session.patient?.last_name} — ${remaining.toFixed(0)} MAD restant (${daysSince}j)`,
                    link: `/patients/${session.patient_id}`,
                    date: session.session_date,
                    amount: remaining,
                    phone: session.patient?.phone_primary,
                });
            }
        }

        // ─── 4. Patients sans visite depuis > 6 mois ────────────────
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Trouver les patients dont la dernière séance est > 6 mois
        const inactivePatients = await Patient.findAll({
            where: { cabinet_id },
            attributes: ['id', 'first_name', 'last_name', 'phone_primary'],
            include: [{
                model: Session,
                as: 'sessions',
                attributes: ['session_date'],
                required: false,
            }],
        });

        inactivePatients.forEach(patient => {
            const sessions = patient.sessions || [];
            if (sessions.length === 0) return; // Nouveau patient, pas encore de séance

            const lastSession = sessions.reduce((latest, s) =>
                new Date(s.session_date) > new Date(latest.session_date) ? s : latest
            );

            if (new Date(lastSession.session_date) < sixMonthsAgo) {
                const monthsSince = Math.floor(
                    (Date.now() - new Date(lastSession.session_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
                );
                notifications.push({
                    id: `inactive-${patient.id}`,
                    type: 'inactive_patient',
                    priority: 'low',
                    icon: '👤',
                    title: 'Patient sans visite',
                    message: `${patient.first_name} ${patient.last_name} — dernière visite il y a ${monthsSince} mois`,
                    link: `/patients/${patient.id}`,
                    date: lastSession.session_date,
                    phone: patient.phone_primary,
                });
            }
        });

        // ─── Trier par priorité ─────────────────────────────────────
        const priorityOrder = { high: 0, medium: 1, info: 2, low: 3 };
        notifications.sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));

        res.json({
            success: true,
            data: notifications,
            count: notifications.length,
            counts: {
                high: notifications.filter(n => n.priority === 'high').length,
                medium: notifications.filter(n => n.priority === 'medium').length,
                info: notifications.filter(n => n.priority === 'info').length,
                low: notifications.filter(n => n.priority === 'low').length,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getNotifications };
