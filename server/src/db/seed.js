const { User, Cabinet } = require('../models');

/**
 * Script de seed — Crée l'admin par défaut et le cabinet demo si pas encore créés
 * Admin: admin@cabinetpro.ma / admin123
 */
const seedAdmin = async () => {
    try {
        // Vérifier ou créer le cabinet de démonstration
        let cabinet = await Cabinet.findOne({ where: { plan: 'pro' } });
        
        if (!cabinet) {
            cabinet = await Cabinet.create({
                id: 'a0000000-0000-0000-0000-000000000001',
                name: 'Cabinet Dentaire Demo',
                type: 'dentiste',
                city: 'Casablanca',
                phone: '0522000000',
                plan: 'pro'
            });
            console.log('✅ Cabinet demo créé.');
        }

        // Vérifier si l'admin existe déjà
        const existingAdmin = await User.findOne({ where: { email: 'admin@cabinetpro.ma' } });
        if (existingAdmin) {
            console.log('👤 Admin existe déjà.');
            return;
        }

        // Créer l'admin (le mot de passe sera hashé par le hook beforeCreate du modèle User)
        await User.create({
            cabinet_id: cabinet.id,
            email: 'admin@cabinetpro.ma',
            password_hash: 'admin123',
            first_name: 'Admin',
            last_name: 'CabinetPro',
            first_name_ar: 'المسؤول',
            last_name_ar: 'كابينت برو',
            role: 'admin',
            phone: '0600000000'
        });

        console.log('✅ Admin créé: admin@cabinetpro.ma / admin123');
    } catch (error) {
        console.error('❌ Erreur seed admin:', error.message);
    }
};

module.exports = seedAdmin;
