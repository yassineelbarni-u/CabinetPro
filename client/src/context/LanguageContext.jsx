import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const translations = {
  fr: {
    dashboard: 'Tableau de bord',
    patients: 'Patients',
    appointments: 'Rendez-vous',
    finance: 'Finance & Gestion',
    payments: 'Paiements',
    accounting: 'Comptabilité',
    settings: 'Paramètres',
    admin: 'Administration',
    logout: 'Déconnexion',
    search: 'Rechercher par nom, prénom, téléphone...',
    newPatient: 'Nouveau Patient',
    patientsToday: "Patients Aujourd'hui",
    revenueToday: 'Recette du Jour',
    unpaidTotal: 'Restes à Payer',
    netProfit: 'Bénéfice Net (Mois)',
    nextAppointments: 'Prochains Rendez-vous',
    recentPatients: 'Derniers Patients Inscrits',
    seeAll: 'Voir tout',
    welcome: 'Bonjour, Dr.',
    subtitle: "Voici l'état de votre cabinet aujourd'hui",
    menu: 'Menu Principal',
  },
  ar: {
    dashboard: 'لوحة القيادة',
    patients: 'المرضى',
    appointments: 'المواعيد',
    finance: 'المالية والإدارة',
    payments: 'المدفوعات',
    accounting: 'المحاسبة',
    settings: 'الإعدادات',
    admin: 'الإدارة',
    logout: 'تسجيل الخروج',
    search: 'البحث بالاسم، اللقب، الهاتف...',
    newPatient: 'مريض جديد',
    patientsToday: 'مرضى اليوم',
    revenueToday: 'دخل اليوم',
    unpaidTotal: 'الباقي للدفع',
    netProfit: 'الربح الصافي (الشهر)',
    nextAppointments: 'المواعيد القادمة',
    recentPatients: 'أحدث المرضى المسجلين',
    seeAll: 'عرض الكل',
    welcome: 'مرحباً دكتور',
    subtitle: 'إليك حالة عيادتك اليوم',
    menu: 'القائمة الرئيسية',
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem('cabinetpro_lang') || 'fr');

  useEffect(() => {
    localStorage.setItem('cabinetpro_lang', language);
    // Apply RTL for Arabic
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Add a class for specific font overriding if necessary
    if (language === 'ar') {
      document.body.classList.add('font-arabic');
    } else {
      document.body.classList.remove('font-arabic');
    }
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'fr' ? 'ar' : 'fr');
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage doit être utilisé dans un LanguageProvider');
  }
  return context;
};
