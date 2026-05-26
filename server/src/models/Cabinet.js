const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Cabinet = sequelize.define('cabinets', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Le nom du cabinet est obligatoire.' },
        },
    },
    type: {
        type: DataTypes.ENUM('dentiste', 'ophtalmologue', 'generaliste', 'clinique'),
        allowNull: false,
    },
    address: {
        type: DataTypes.TEXT,
    },
    city: {
        type: DataTypes.STRING(100),
    },
    phone: {
        type: DataTypes.STRING(20),
    },
    email: {
        type: DataTypes.STRING(255),
        validate: {
            isEmail: { msg: 'Email invalide.' },
        },
    },
    plan: {
        type: DataTypes.ENUM('starter', 'pro', 'clinique', 'sur_mesure'),
        defaultValue: 'starter',
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
});

module.exports = Cabinet;
