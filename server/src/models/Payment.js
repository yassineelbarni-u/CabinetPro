const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Payment = sequelize.define('payments', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    session_id: {
        type: DataTypes.UUID,
    },
    patient_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    cabinet_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: { args: [0], msg: 'Le montant ne peut pas être négatif.' },
        },
    },
    payment_method: {
        type: DataTypes.ENUM('especes', 'virement', 'cheque', 'assurance'),
        defaultValue: 'especes',
    },
    payer_type: {
        type: DataTypes.ENUM('patient', 'cnss', 'cnops', 'mutuelle'),
        defaultValue: 'patient',
    },
    notes: {
        type: DataTypes.TEXT,
    },
    payment_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    updatedAt: false,
});

module.exports = Payment;
