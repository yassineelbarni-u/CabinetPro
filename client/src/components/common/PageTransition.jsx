/**
 * Composant wrapper qui anime l'apparition d'une page avec un fade-in.
 * Utilise la classe .animate-fade-in déjà définie dans index.css.
 */
export function PageTransition({ children }) {
  return (
    <div
      className="animate-fade-in"
      style={{ animationDuration: '0.22s', animationFillMode: 'both' }}
    >
      {children}
    </div>
  );
}
