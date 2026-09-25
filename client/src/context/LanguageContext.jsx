import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const translations = {
  fr: {
    // Navigation
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

    // Notifications
    notificationsTitle: 'Notifications',
    markAllRead: 'Tout marquer lu',
    noNotifications: 'Aucune notification',
    allUpToDate: 'Tout est à jour dans votre cabinet !',
    filterAll: 'Tout',
    filterUrgent: 'Urgent',
    filterMedium: 'Moyen',
    filterInfo: 'Info',
    callAction: 'Appeler',
    viewPatientAction: 'Voir patient',
    viewAppointmentAction: 'Voir RDV',
    viewPaymentsAction: 'Voir paiements',

    // Comptabilité Header & Actions
    accountingTitle: 'Comptabilité',
    accountingSubtitle: 'Suivez vos recettes, vos charges et calculez votre bénéfice net.',
    addExpense: 'Ajouter une charge',
    editExpense: 'Modifier la charge',
    exportReport: 'Exporter rapport',

    // Comptabilité Périodes & Tabs
    thisMonth: 'Ce mois',
    lastMonth: 'Mois dernier',
    thisQuarter: 'Ce trimestre',
    thisYear: 'Cette année',
    tabOverview: "Vue d'ensemble",
    tabExpenses: 'Charges',
    tabRevenue: 'Recettes',

    // Comptabilité KPIs
    kpiRevenue: 'RECETTES',
    kpiRevenueDesc: 'Encaissements période',
    kpiExpenses: 'CHARGES',
    kpiExpensesDesc: 'Dépenses période',
    kpiNetProfit: 'BÉNÉFICE NET',
    kpiMargin: 'Marge',
    kpiSessions: 'SÉANCES',
    kpiAvgTicket: 'Ticket moyen',
    kpiRecovery: 'RECOUVREMENT',
    kpiRecoveryDesc: 'Taux de paiement des séances',
    kpiExpenseRatio: 'TAUX DE CHARGES',

    // Comptabilité Graphiques
    chartRevenueVsExpenses: 'Recettes vs Charges — 6 mois',
    chartExpenseBreakdown: 'Répartition des charges',
    noExpenseForPeriod: 'Aucune charge pour cette période',

    // Comptabilité Tables
    expenseHistory: 'Historique des Charges',
    revenueHistory: 'Historique des Recettes (Paiements)',
    colDate: 'Date',
    colCategory: 'Catégorie',
    colDescription: 'Description',
    colFrequency: 'Fréquence',
    colAmount: 'Montant',
    colActions: 'Actions',
    colPatient: 'Patient',
    colMethod: 'Méthode',
    noExpensesFound: 'Aucune charge enregistrée',
    noExpensesPrompt: 'Ajoutez vos dépenses pour mieux suivre votre rentabilité.',
    pageInfo: 'Page {page} sur {totalPages}',
    btnPrev: 'Précédent',
    btnNext: 'Suivant',

    // Formulaire Charge (Modal)
    modalAddExpenseTitle: '📉 Ajouter une Charge',
    modalEditExpenseTitle: '✏️ Modifier la Charge',
    modalAddExpenseSubtitle: 'Enregistrez une nouvelle dépense du cabinet.',
    modalEditExpenseSubtitle: 'Modifier les informations de la dépense.',
    lblAmount: 'Montant (MAD) *',
    lblDate: 'Date *',
    lblCategory: 'Catégorie *',
    lblFrequency: 'Fréquence',
    lblDescription: 'Description (Optionnel)',
    phDescription: 'Détails de la dépense, fournisseur, référence...',
    btnCancel: 'Annuler',
    btnSaveExpense: 'Ajouter la charge',
    btnUpdateExpense: 'Mettre à jour',
    savingState: 'Enregistrement...',

    // Catégories de charges
    catConsumables: 'Consommables',
    catRent: 'Loyer & Charges',
    catSalaries: 'Salaires',
    catEquipment: 'Équipement',
    catLab: 'Labo / Prothèse',
    catServices: 'Services & Rempl.',
    catOther: 'Autre',

    // Fréquences
    freqOnce: 'Ponctuelle',
    freqOnceDesc: 'Unique',
    freqMonthly: 'Mensuelle',
    freqMonthlyDesc: 'Chaque mois',
    freqYearly: 'Annuelle',
    freqYearlyDesc: 'Chaque année',

    // Common
    edit: 'Modifier',
    delete: 'Supprimer',
    confirm: 'Confirmer',
    close: 'Fermer',
  },
  ar: {
    // Navigation
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

    // Notifications
    notificationsTitle: 'الإشعارات',
    markAllRead: 'تحديد الكل كمقروء',
    noNotifications: 'لا توجد إشعارات',
    allUpToDate: 'كل شيء محدث في عيادتك !',
    filterAll: 'الكل',
    filterUrgent: 'عاجل',
    filterMedium: 'متوسط',
    filterInfo: 'معلومات',
    callAction: 'اتصال',
    viewPatientAction: 'عرض المريض',
    viewAppointmentAction: 'عرض الموعد',
    viewPaymentsAction: 'عرض المدفوعات',

    // Comptabilité Header & Actions
    accountingTitle: 'المحاسبة',
    accountingSubtitle: 'تابع إيراداتك ومصاريفك واحتسب صافي ربح عيادتك.',
    addExpense: 'إضافة مصروف',
    editExpense: 'تعديل المصروف',
    exportReport: 'تصدير التقرير',

    // Comptabilité Périodes & Tabs
    thisMonth: 'هذا الشهر',
    lastMonth: 'الشهر الماضي',
    thisQuarter: 'هذا الربع',
    thisYear: 'هذه السنة',
    tabOverview: 'نظرة عامة',
    tabExpenses: 'المصاريف',
    tabRevenue: 'الإيرادات',

    // Comptabilité KPIs
    kpiRevenue: 'الإيرادات',
    kpiRevenueDesc: 'تحصيلات الفترة',
    kpiExpenses: 'المصاريف',
    kpiExpensesDesc: 'نفقات الفترة',
    kpiNetProfit: 'صافي الربح',
    kpiMargin: 'الهامش',
    kpiSessions: 'الجلسات',
    kpiAvgTicket: 'متوسط الجلسة',
    kpiRecovery: 'نسبة التحصيل',
    kpiRecoveryDesc: 'نسبة دفع الجلسات',
    kpiExpenseRatio: 'نسبة المصاريف',

    // Comptabilité Graphiques
    chartRevenueVsExpenses: 'الإيرادات مقابل المصاريف — 6 أشهر',
    chartExpenseBreakdown: 'توزيع المصاريف',
    noExpenseForPeriod: 'لا توجد مصاريف لهذه الفترة',

    // Comptabilité Tables
    expenseHistory: 'سجل المصاريف',
    revenueHistory: 'سجل الإيرادات (المدفوعات)',
    colDate: 'التاريخ',
    colCategory: 'الفئة',
    colDescription: 'الوصف',
    colFrequency: 'التكرار',
    colAmount: 'المبلغ',
    colActions: 'الإجراءات',
    colPatient: 'المريض',
    colMethod: 'طريقة الدفع',
    noExpensesFound: 'لم يتم تسجيل أي مصروف',
    noExpensesPrompt: 'أضف مصاريفك لمتابعة ربحية عيادتك بشكل أفضل.',
    pageInfo: 'صفحة {page} من {totalPages}',
    btnPrev: 'السابق',
    btnNext: 'التالي',

    // Formulaire Charge (Modal)
    modalAddExpenseTitle: '📉 إضافة مصروف جديد',
    modalEditExpenseTitle: '✏️ تعديل المصروف',
    modalAddExpenseSubtitle: 'سجل نفقة جديدة خاصة بالعيادة.',
    modalEditExpenseSubtitle: 'تعديل تفاصيل المصروف المسجل.',
    lblAmount: 'المبلغ (درهم) *',
    lblDate: 'التاريخ *',
    lblCategory: 'الفئة *',
    lblFrequency: 'التكرار',
    lblDescription: 'الوصف (اختياري)',
    phDescription: 'تفاصيل المصروف، المورد، المرجع...',
    btnCancel: 'إلغاء',
    btnSaveExpense: 'إضافة المصروف',
    btnUpdateExpense: 'تحديث البيانات',
    savingState: 'جاري الحفظ...',

    // Catégories de charges
    catConsumables: 'المستلزمات الطبية',
    catRent: 'الكراء والرسوم',
    catSalaries: 'الرواتب والأجور',
    catEquipment: 'المعدات والصيانة',
    catLab: 'المختبر / البدائل',
    catServices: 'الخدمات والاستشارة',
    catOther: 'مصاريف أخرى',

    // Fréquences
    freqOnce: 'استثنائية',
    freqOnceDesc: 'مرة واحدة',
    freqMonthly: 'شهرياً',
    freqMonthlyDesc: 'كل شهر',
    freqYearly: 'سنوياً',
    freqYearlyDesc: 'كل سنة',

    // Common
    edit: 'تعديل',
    delete: 'حذف',
    confirm: 'تأكيد',
    close: 'إغلاق',
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

  const t = (key, params = {}) => {
    let str = translations[language]?.[key] || translations['fr']?.[key] || key;
    Object.keys(params).forEach(param => {
      str = str.replace(`{${param}}`, params[param]);
    });
    return str;
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
