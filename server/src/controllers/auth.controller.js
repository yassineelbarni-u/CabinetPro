const { User, Cabinet } = require('../models');
const { generateToken } = require('../config/jwt');

// POST /api/auth/register
const register = async (req, res, next) => {
    try {
        const { email, password, first_name, last_name, first_name_ar, last_name_ar, role, phone, cabinet_id } = req.body;

        // Vérifier que le cabinet existe
        const cabinet = await Cabinet.findByPk(cabinet_id);
        if (!cabinet) {
            return res.status(404).json({
                success: false,
                message: 'Cabinet non trouvé.'
            });
        }

        // Créer l'utilisateur (le hook beforeCreate hash le mot de passe)
        const user = await User.create({
            email,
            password_hash: password, // sera hashé par le hook
            first_name,
            last_name,
            first_name_ar,
            last_name_ar,
            role: role || 'medecin',
            phone,
            cabinet_id,
        });

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            cabinet_id: user.cabinet_id,
        });

        res.status(201).json({
            success: true,
            message: 'Compte créé avec succès.',
            data: { user: user.toSafeJSON(), token },
        });
    } catch (error) {
        // Gestion des erreurs de validation Sequelize
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: error.errors?.map(e => e.message).join(', ') || error.message,
            });
        }
        next(error);
    }
};

// POST /api/auth/login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email et mot de passe requis.'
            });
        }

        // Chercher l'utilisateur avec son cabinet (eager loading comme Hibernate)
        const user = await User.findOne({
            where: { email },
            include: [{
                model: Cabinet,
                as: 'cabinet',
                attributes: ['id', 'name', 'type', 'plan'],
            }],
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect.'
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Compte désactivé. Contactez l\'administrateur.'
            });
        }

        // Vérifier le mot de passe (méthode d'instance)
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect.'
            });
        }

        // Mettre à jour last_login
        await user.update({ last_login: new Date() });

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            cabinet_id: user.cabinet_id,
        });

        res.json({
            success: true,
            message: 'Connexion réussie.',
            data: { user: user.toSafeJSON(), token },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password_hash'] },
            include: [{
                model: Cabinet,
                as: 'cabinet',
                attributes: ['id', 'name', 'type', 'plan'],
            }],
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé.'
            });
        }

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, getMe };
