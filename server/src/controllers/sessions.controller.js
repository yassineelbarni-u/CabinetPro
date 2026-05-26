const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { Session, ToothRecord, Payment, Patient, User } = require('../models');

// POST /api/sessions — Créer une nouvelle séance avec soins dentaires et paiement
const createSession = async (req, res, next) => {
    // On utilise une transaction pour s'assurer que Séance, Dents et Paiement sont tous insérés ou tous annulés
    const transaction = await sequelize.transaction();
    
    try {
        const cabinet_id = req.user.cabinet_id;
        const { 
            patient_id, 
            doctor_id, 
            session_date, 
            care_type, 
            clinical_notes, 
            prescription, 
            tooth_records, 
            payment_amount, 
            payment_method 
        } = req.body;

        // 1. Créer la séance
        let total_price = 0;
        if (tooth_records && tooth_records.length > 0) {
            total_price = tooth_records.reduce((sum, tr) => sum + parseFloat(tr.price || 0), 0);
        }

        const session = await Session.create({
            cabinet_id,
            patient_id,
            doctor_id: doctor_id || req.user.id,
            session_date: session_date || new Date(),
            care_type,
            clinical_notes,
            prescription,
            total_price,
            payment_status: payment_amount >= total_price ? 'paid' : (payment_amount > 0 ? 'partial' : 'unpaid'),
        }, { transaction });

        // 2. Enregistrer l'odontogramme (soins par dent)
        if (tooth_records && tooth_records.length > 0) {
            const recordsToInsert = tooth_records.map(tr => ({
                session_id: session.id,
                patient_id,
                cabinet_id,
                tooth_number: tr.tooth_number,
                treatment_type: tr.treatment_type,
                notes: tr.notes,
                price: tr.price || 0
            }));
            await ToothRecord.bulkCreate(recordsToInsert, { transaction });
        }

        // 3. Enregistrer le paiement (si applicable)
        if (payment_amount > 0) {
            await Payment.create({
                session_id: session.id,
                patient_id,
                cabinet_id,
                amount: payment_amount,
                payment_method: payment_method || 'especes',
                payment_date: new Date(),
            }, { transaction });
        }

        // 4. Mettre à jour le statut "présent" du rendez-vous (optionnel, on pourrait chercher s'il y a un RDV aujourd'hui et le marquer "done")
        // ...

        await transaction.commit();

        res.status(201).json({
            success: true,
            message: 'Séance enregistrée avec succès.',
            data: session,
        });

    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// GET /api/sessions/patient/:patient_id — Historique médical complet + Odontogramme
const getPatientHistory = async (req, res, next) => {
    try {
        const { patient_id } = req.params;
        const cabinet_id = req.user.cabinet_id;

        // Récupérer toutes les séances
        const sessions = await Session.findAll({
            where: { patient_id, cabinet_id },
            include: [
                {
                    model: User,
                    as: 'doctor',
                    attributes: ['id', 'first_name', 'last_name'],
                }
            ],
            order: [['session_date', 'DESC']],
        });

        // Récupérer tout l'historique dentaire pour l'odontogramme
        const toothRecords = await ToothRecord.findAll({
            where: { patient_id, cabinet_id },
            order: [['created_at', 'DESC']],
        });

        res.json({
            success: true,
            data: {
                sessions,
                odontogram: toothRecords
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createSession, getPatientHistory };
