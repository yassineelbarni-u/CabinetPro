const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Session = sequelize.define('sessions', {
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
    session_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    care_type: {
        type: DataTypes.STRING(100),
    },
    clinical_notes: {
        type: DataTypes.TEXT,
    },
    prescription: {
        type: DataTypes.TEXT,
    },
    total_price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: 'Le prix ne peut pas être négatif.' },
        },
    },
    payment_status: {
        type: DataTypes.ENUM('paid', 'partial', 'unpaid'),
        defaultValue: 'unpaid',
    },
    next_appointment_id: {
        type: DataTypes.UUID,
    },
});

module.exports = Session;
