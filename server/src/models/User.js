const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcrypt');

const User = sequelize.define('users', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    cabinet_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: {
            msg: 'Cet email est déjà utilisé.',
        },
        validate: {
            isEmail: { msg: 'Email invalide.' },
            notEmpty: { msg: 'L\'email est obligatoire.' },
        },
    },
    password_hash: {
        type: DataTypes.STRING(255),
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
    role: {
        type: DataTypes.ENUM('admin', 'medecin', 'secretaire'),
        allowNull: false,
        defaultValue: 'medecin',
    },
    phone: {
        type: DataTypes.STRING(20),
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    last_login: {
        type: DataTypes.DATE,
    },
}, {
    hooks: {
        // Hash du mot de passe avant sauvegarde (comme @PrePersist en JPA)
        beforeCreate: async (user) => {
            if (user.password_hash) {
                const salt = await bcrypt.genSalt(12);
                user.password_hash = await bcrypt.hash(user.password_hash, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password_hash')) {
                const salt = await bcrypt.genSalt(12);
                user.password_hash = await bcrypt.hash(user.password_hash, salt);
            }
        },
    },
});

// Méthode d'instance — vérifier le mot de passe (comme dans un @Entity)
User.prototype.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password_hash);
};

// Méthode d'instance — retourner le user sans le hash
User.prototype.toSafeJSON = function () {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
};

module.exports = User;
