import { Menu, Bell, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const GREETING = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

export default function Header({ toggleSidebar }) {
  const { user } = useAuth();
  const { language, toggleLanguage } = useLanguage();

  const now = new Date().toLocaleDateString('fr-MA', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <header className="header" role="banner">
      {/* ── Gauche ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        {/* Hamburger mobile */}
        <button
          onClick={toggleSidebar}
          className="header-btn-icon lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu style={{ width: 18, height: 18 }} />
        </button>

        {/* Titre + date */}
        <div>
          <h2 className="header-title" style={{ textTransform: 'capitalize' }}>
            {GREETING()}, {user?.first_name} 👋
          </h2>
          <p className="header-subtitle" style={{ textTransform: 'capitalize' }}>{now}</p>
        </div>
      </div>

      {/* ── Droite ──────────────────────────────────── */}
      <div className="header-actions">

        {/* Switcher langue */}
        <button
          onClick={toggleLanguage}
          className="header-btn"
          title="Changer la langue"
          aria-label="Changer la langue"
        >
          <Globe style={{ width: 13, height: 13 }} />
          {language === 'fr' ? 'عربي' : 'FR'}
        </button>

        {/* Notifications */}
        <button
          className="header-btn-icon"
          title="Notifications"
          aria-label="Voir les notifications"
        >
          <Bell style={{ width: 16, height: 16 }} />
          <span className="notif-dot" />
        </button>

        {/* Séparateur */}
        <div style={{ width: 1, height: 28, background: '#E0EEF2', margin: '0 4px' }} />

        {/* Avatar utilisateur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #06B6D4, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '0.8125rem',
              boxShadow: '0 2px 8px rgba(6,182,212,0.30)',
              flexShrink: 0,
              border: '2px solid rgba(255,255,255,0.80)',
            }}
            aria-hidden="true"
          >
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div style={{ display: 'none' }} className="md:block">
            <div style={{
              fontSize: '0.8125rem', fontWeight: 700,
              color: '#0F2A3F', lineHeight: 1.25, letterSpacing: '-0.01em',
            }}>
              {user?.first_name} {user?.last_name}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#8BA7BE', marginTop: 1, textTransform: 'capitalize' }}>
              {user?.role}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
