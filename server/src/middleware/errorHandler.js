const errorHandler = (err, req, res, next) => {
    console.error('❌ Erreur:', err.message);
    console.error(err.stack);

    // Erreurs de validation PostgreSQL
    if (err.code === '23505') {
        return res.status(409).json({
            success: false,
            message: 'Cette entrée existe déjà.',
            detail: err.detail
        });
    }

    if (err.code === '23503') {
        return res.status(400).json({
            success: false,
            message: 'Référence invalide. L\'élément référencé n\'existe pas.',
            detail: err.detail
        });
    }

    if (err.code === '23514') {
        return res.status(400).json({
            success: false,
            message: 'Valeur invalide.',
            detail: err.detail
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Erreur interne du serveur.',
    });
};

module.exports = errorHandler;
