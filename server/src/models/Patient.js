const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Patient = sequelize.define('patients', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    cabinet_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Le prénom est obligatoire.' },
        },
    },
    last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Le nom est obligatoire.' },
        },
    },
    first_name_ar: {
        type: DataTypes.STRING(100),
    },
    last_name_ar: {
        type: DataTypes.STRING(100),
    },
    birth_date: {
        type: DataTypes.DATEONLY,
    },
    phone_primary: {
        type: DataTypes.STRING(20),
    },
    phone_secondary: {
        type: DataTypes.STRING(20),
    },
    city: {
        type: DataTypes.STRING(100),
    },
    quarter: {
        type: DataTypes.STRING(100),
    },
    patient_type: {
        type: DataTypes.ENUM('particulier', 'cnss', 'cnops', 'mutuelle'),
        defaultValue: 'particulier',
    },
    insurance_number: {
        type: DataTypes.STRING(100),
    },
    allergies: {
        type: DataTypes.TEXT,
    },
    medical_history: {
        type: DataTypes.TEXT,
    },
    photo_url: {
        type: DataTypes.STRING(500),
    },
    first_visit: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW,
    },
    total_sessions: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
}, {
    // Getters virtuels (comme @Transient en JPA)
    getterMethods: {
        full_name() {
            return `${this.first_name} ${this.last_name}`;
        },
        full_name_ar() {
            if (this.first_name_ar && this.last_name_ar) {
                return `${this.first_name_ar} ${this.last_name_ar}`;
            }
            return null;
        },
        age() {
            if (!this.birth_date) return null;
            const today = new Date();
            const birth = new Date(this.birth_date);
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age;
        },
    },
});

module.exports = Patient;
