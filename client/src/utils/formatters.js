/**
 * Formater un montant en Dirhams marocains
 */
export const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return `${num.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`;
};

/**
 * Formater une date
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-MA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formater une date avec heure
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-MA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Calculer l'âge à partir de la date de naissance
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

/**
 * Obtenir les initiales d'un nom
 */
export const getInitials = (firstName, lastName) => {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
};

/**
 * Labels des types de patients
 */
export const PATIENT_TYPE_LABELS = {
  particulier: 'Particulier',
  cnss: 'CNSS',
  cnops: 'CNOPS',
  mutuelle: 'Mutuelle'
};

/**
 * Labels des statuts de paiement
 */
export const PAYMENT_STATUS_LABELS = {
  paid: 'Soldé',
  partial: 'Partiel',
  unpaid: 'Impayé'
};

/**
 * Labels des méthodes de paiement
 */
export const PAYMENT_METHOD_LABELS = {
  especes: 'Espèces',
  virement: 'Virement',
  cheque: 'Chèque',
  assurance: 'Assurance'
};
