/**
 * Middleware RBAC — Contrôle d'accès par rôle
 * Utilisation: rbac('admin', 'medecin') → autorise admin et médecin
 */
const rbac = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Non authentifié.' 
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Accès interdit. Permissions insuffisantes.',
                required: allowedRoles,
                current: req.user.role
            });
        }

        next();
    };
};

module.exports = rbac;
