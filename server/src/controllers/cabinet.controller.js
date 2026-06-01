const { Cabinet } = require('../models');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// ─── GET /api/cabinet ──────────────────────────────────────────────────────────
const getCabinetInfo = async (req, res, next) => {
    try {
        const cabinet = await Cabinet.findByPk(req.user.cabinet_id);
        if (!cabinet) {
            return res.status(404).json({ success: false, message: 'Cabinet introuvable.' });
        }
        res.json({ success: true, data: cabinet });
    } catch (error) {
        next(error);
    }
};

// ─── PUT /api/cabinet ──────────────────────────────────────────────────────────
const updateCabinetInfo = async (req, res, next) => {
    try {
        const cabinet = await Cabinet.findByPk(req.user.cabinet_id);
        if (!cabinet) {
            return res.status(404).json({ success: false, message: 'Cabinet introuvable.' });
        }

        const allowedFields = ['name', 'address', 'city', 'phone', 'email'];
        const updates = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        await cabinet.update(updates);
        res.json({ success: true, message: 'Informations du cabinet mises à jour.', data: cabinet });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ success: false, message: error.errors.map(e => e.message).join(', ') });
        }
        next(error);
    }
};

// ─── GET /api/cabinet/backup ───────────────────────────────────────────────────
const downloadBackup = async (req, res, next) => {
    try {
        const DB_NAME = process.env.DB_NAME || 'cabinetpro';
        const DB_USER = process.env.DB_USER || 'cabinet_admin';
        const CONTAINER = 'cabinet_postgres';

        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `sauvegarde_cabinet_${timestamp}.sql`;

        // Check if Docker container is running
        const { stdout: containerCheck } = await execAsync(
            `docker inspect --format="{{.State.Running}}" ${CONTAINER}`
        ).catch(() => ({ stdout: 'false' }));

        if (containerCheck.trim() !== 'true') {
            return res.status(503).json({
                success: false,
                message: 'Le conteneur Docker PostgreSQL n\'est pas en cours d\'exécution. Assurez-vous que docker-compose est démarré.'
            });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/sql');

        const { stdout } = await execAsync(
            `docker exec ${CONTAINER} pg_dump -U ${DB_USER} -d ${DB_NAME} --no-password`
        );

        res.send(stdout);
    } catch (error) {
        console.error('Erreur backup:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération de la sauvegarde. Vérifiez que Docker est bien démarré.'
        });
    }
};

module.exports = { getCabinetInfo, updateCabinetInfo, downloadBackup };
