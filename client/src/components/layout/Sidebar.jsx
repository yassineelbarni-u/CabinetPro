import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  PieChart,
  Settings,
  Stethoscope,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';

const NAV_ITEMS = [
  { to: '/',            icon: LayoutDashboard, label: 'dashboard', end: true },
  { to: '/patients',    icon: Users,            label: 'patients' },
  { to: '/appointments',icon: Calendar,         label: 'appointments' },
];

const FINANCE_ITEMS = [
  { to: '/payments',   icon: CreditCard, label: 'payments' },
  { to: '/accounting', icon: PieChart,   label: 'accounting' },
];

export default function Sidebar({ isOpen }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>

      {/* ── Logo ─────────────────────────────────── */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1>CabinetPro</h1>
          <span>{user?.cabinet?.name || 'Cabinet Médical'}</span>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────── */}
      <nav className="sidebar-nav">

        {/* Main section */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">{t('menu')}</div>
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

        {/* Finance section */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">{t('finance')}</div>
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

        {/* Admin section */}
        {user?.role === 'admin' && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">{t('admin')}</div>
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

      {/* ── User Footer ──────────────────────────── */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {getInitials(user?.first_name, user?.last_name)}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.first_name} {user?.last_name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
          <button
            onClick={logout}
            title="Déconnexion"
            className="ml-auto p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
