const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const sequelize = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const seedAdmin = require('./db/seed');

// Import des routes
const authRoutes = require('./routes/auth.routes');
const patientsRoutes = require('./routes/patients.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const appointmentsRoutes = require('./routes/appointments.routes');
const sessionsRoutes = require('./routes/sessions.routes');
const paymentsRoutes = require('./routes/payments.routes');
const accountingRoutes = require('./routes/accounting.routes');
const cabinetRoutes = require('./routes/cabinet.routes');

const app = express();
const PORT = process.env.PORT || 4000;

// ============================================
// Middlewares globaux
// ============================================
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ============================================
// Routes API
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/cabinet', cabinetRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'CabinetPro API',
        timestamp: new Date().toISOString()
    });
});

// Route 404
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: `Route ${req.method} ${req.originalUrl} non trouvée.` 
    });
});

// Gestionnaire d'erreurs global
app.use(errorHandler);

// ============================================
// Démarrage du serveur
// ============================================
const start = async () => {
    try {
        // Tester la connexion à la base de données
        await sequelize.authenticate();
        console.log('✅ Base de données PostgreSQL connectée via Sequelize');

        // Synchroniser les modèles
        await sequelize.sync();
        console.log('✅ Modèles Sequelize synchronisés');

        // Seed admin par défaut
        await seedAdmin();

        app.listen(PORT, () => {
            console.log(`
╔══════════════════════════════════════════╗
║                                          ║
║   🏥 CabinetPro API                     ║
║   Serveur démarré sur le port ${PORT}       ║
║   http://localhost:${PORT}                  ║
║                                          ║
╚══════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('❌ Impossible de démarrer le serveur:', error.message);
        process.exit(1);
    }
};

start();
