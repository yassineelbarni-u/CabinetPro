const { verifyToken } = require('../config/jwt');
const { User } = require('../models');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Accès refusé. Token manquant.' 
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        // Vérifier que l'utilisateur existe toujours et est actif
        const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'cabinet_id', 'email', 'first_name', 'last_name', 'role', 'is_active']
        });

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Utilisateur non trouvé.' 
            });
        }

        if (!user.is_active) {
            return res.status(403).json({ 
                success: false, 
                message: 'Compte désactivé.' 
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expiré. Veuillez vous reconnecter.' 
            });
        }
        return res.status(401).json({ 
            success: false, 
            message: 'Token invalide.' 
        });
    }
};

module.exports = auth;
