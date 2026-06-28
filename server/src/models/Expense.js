const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Expense = sequelize.define('expenses', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    cabinet_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    created_by: {
        type: DataTypes.UUID,
    },
    category: {
        type: DataTypes.ENUM(
            'loyer', 'salaires', 'fournitures_medicales', 'materiel',
            'electricite_eau', 'maintenance', 'loyer_materiel', 'autres'
        ),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: { args: [0], msg: 'Le montant ne peut pas être négatif.' },
        },
    },
    expense_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    frequency: {
        type: DataTypes.ENUM('mensuelle', 'ponctuelle', 'variable'),
        defaultValue: 'ponctuelle',
    },
}, {
    updatedAt: false,
});

module.exports = Expense;
