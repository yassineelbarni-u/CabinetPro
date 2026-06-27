const { Op } = require('sequelize');
const { Appointment, Patient, User } = require('../models');

// GET /api/appointments
const getAppointments = async (req, res, next) => {
    try {
        const { start_date, end_date, status, doctor_id } = req.query;
        const cabinet_id = req.user.cabinet_id;

        const where = { cabinet_id };

        if (start_date && end_date) {
            where.appointment_date = {
                [Op.gte]: new Date(start_date),
                [Op.lte]: new Date(end_date),
            };
        } else if (start_date) {
            where.appointment_date = { [Op.gte]: new Date(start_date) };
        }

        if (status) {
            where.status = status;
        }

        if (doctor_id) {
            where.doctor_id = doctor_id;
        }

        const appointments = await Appointment.findAll({
            where,
            include: [
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'first_name', 'last_name', 'first_name_ar', 'last_name_ar', 'phone_primary', 'patient_type'],
                },
                {
                    model: User,
                    as: 'doctor',
                    attributes: ['id', 'first_name', 'last_name'],
                }
            ],
            order: [['appointment_date', 'ASC']],
        });

        res.json({
            success: true,
            data: appointments,
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/appointments/queue (File d'attente)
const getQueue = async (req, res, next) => {
    try {
        const cabinet_id = req.user.cabinet_id;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const queue = await Appointment.findAll({
            where: {
                cabinet_id,
                appointment_date: {
                    [Op.gte]: today,
                    [Op.lt]: tomorrow,
                },
                status: 'present', // Seuls les patients présents en salle d'attente
            },
            include: [
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'first_name', 'last_name', 'photo_url'],
                }
            ],
            order: [['updated_at', 'ASC']], // Ordonné par ordre d'arrivée (passage en statut "présent")
        });

        res.json({
            success: true,
            data: queue,
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/appointments
const createAppointment = async (req, res, next) => {
    try {
        const cabinet_id = req.user.cabinet_id;
        
        const appointment = await Appointment.create({
            cabinet_id,
            ...req.body,
        });

        const created = await Appointment.findByPk(appointment.id, {
            include: [{ model: Patient, as: 'patient', attributes: ['id', 'first_name', 'last_name'] }]
        });

        res.status(201).json({
            success: true,
            message: 'Rendez-vous créé avec succès.',
            data: created,
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

// PUT /api/appointments/:id
const updateAppointment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const cabinet_id = req.user.cabinet_id;

        const appointment = await Appointment.findOne({ where: { id, cabinet_id } });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Rendez-vous non trouvé.' });
        }

        await appointment.update(req.body);

        res.json({
            success: true,
            message: 'Rendez-vous mis à jour.',
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/appointments/:id/status
const updateStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const cabinet_id = req.user.cabinet_id;

        if (!['confirmed', 'pending', 'present', 'absent', 'cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Statut invalide.' });
        }

        const appointment = await Appointment.findOne({ where: { id, cabinet_id } });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Rendez-vous non trouvé.' });
        }

        await appointment.update({ status });

        res.json({
            success: true,
            message: `Statut mis à jour : ${status}`,
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAppointments, getQueue, createAppointment, updateAppointment, updateStatus };
