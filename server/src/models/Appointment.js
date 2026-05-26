const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Appointment = sequelize.define('appointments', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    cabinet_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    patient_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    doctor_id: {
        type: DataTypes.UUID,
    },
    appointment_date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: { msg: 'Date de rendez-vous invalide.' },
        },
    },
    duration_minutes: {
        type: DataTypes.INTEGER,
        defaultValue: 30,
        validate: {
            min: { args: [5], msg: 'Durée minimum : 5 minutes.' },
            max: { args: [480], msg: 'Durée maximum : 8 heures.' },
        },
    },
    care_type: {
        type: DataTypes.STRING(100),
    },
    status: {
        type: DataTypes.ENUM('confirmed', 'pending', 'present', 'absent', 'cancelled'),
        defaultValue: 'pending',
    },
    notes: {
        type: DataTypes.TEXT,
    },
});

module.exports = Appointment;
