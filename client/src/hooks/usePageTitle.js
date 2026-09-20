/**
 * Hook pour mettre à jour le titre de l'onglet navigateur dynamiquement.
 * Usage : usePageTitle('Tableau de bord') → "Tableau de bord — CabinetPro"
 */
import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} — CabinetPro`;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
