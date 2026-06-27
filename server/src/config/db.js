const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'cabinetpro',
    process.env.DB_USER || 'cabinet_admin',
    process.env.DB_PASSWORD || 'cabinet_secure_2026',
    {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5433,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 20,
            min: 5,
            acquire: 30000,
            idle: 10000,
        },
        define: {
            timestamps: true,
            underscored: true, // snake_case pour les colonnes
            freezeTableName: true,
        },
    }
);

module.exports = sequelize;
