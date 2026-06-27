import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  PieChart,
  Settings,
  LogOut,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';

const NAV_ITEMS = [
  { to: '/',             icon: LayoutDashboard, label: 'dashboard',    end: true },
  { to: '/patients',     icon: Users,           label: 'patients' },
  { to: '/appointments', icon: Calendar,        label: 'appointments' },
];

const FINANCE_ITEMS = [
  { to: '/payments',   icon: CreditCard, label: 'payments' },
  { to: '/accounting', icon: PieChart,   label: 'accounting' },
];

const ROLE_FR = {
  admin:      'Administrateur',
  medecin:    'Médecin',
  secretaire: 'Secrétaire',
};

export default function Sidebar({ isOpen }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Navigation principale">

      {/* ── Logo ──────────────────────────────────────── */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Stethoscope style={{ width: 22, height: 22, color: '#fff' }} />
        </div>
        <div>
          <h1>CabinetPro</h1>
          <span>{user?.cabinet?.name || 'Cabinet Dentaire'}</span>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────── */}
      <nav className="sidebar-nav" aria-label="Menu principal">

        {/* Section principale */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">{t('menu') || 'Navigation'}</div>
          <ul>
            {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon />
                  <span>{t(label)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Section Finance */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">{t('finance') || 'Finance'}</div>
          <ul>
            {FINANCE_ITEMS.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon />
                  <span>{t(label)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Section Admin */}
        {user?.role === 'admin' && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">{t('admin') || 'Administration'}</div>
            <ul>
              <li>
                <NavLink
                  to="/settings"
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Settings />
                  <span>{t('settings')}</span>
                </NavLink>
              </li>
            </ul>
          </div>
        )}
      </nav>

      {/* ── User Footer ───────────────────────────────── */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar" aria-hidden="true">
            {getInitials(user?.first_name, user?.last_name)}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.first_name} {user?.last_name}</div>
            <div className="sidebar-user-role">{ROLE_FR[user?.role] || user?.role}</div>
          </div>
          <button
            onClick={logout}
            title="Déconnexion"
            aria-label="Se déconnecter"
            style={{
              marginLeft: 'auto',
              width: 30, height: 30,
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.40)',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.30)';
              e.currentTarget.style.color = '#FCA5A5';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.40)';
            }}
          >
            <LogOut style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>
    </aside>
  );
}
