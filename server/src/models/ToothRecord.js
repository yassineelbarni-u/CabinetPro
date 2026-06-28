const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ToothRecord = sequelize.define('tooth_records', {
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
    tooth_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [11], msg: 'Numéro de dent invalide (min: 11).' },
            max: { args: [48], msg: 'Numéro de dent invalide (max: 48).' },
        },
    },
    treatment_type: {
        type: DataTypes.ENUM(
            'carie', 'couronne', 'extraction', 'devitalisation',
            'detartrage', 'implant', 'facette', 'blanchiment',
            'orthodontie', 'pont', 'sain'
        ),
        allowNull: false,
    },
    notes: {
        type: DataTypes.TEXT,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
    },
}, {
    updatedAt: false,
});

module.exports = ToothRecord;
