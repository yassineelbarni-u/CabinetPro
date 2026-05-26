import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  PieChart, 
  Settings,
  Stethoscope 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';

export default function Sidebar({ isOpen }) {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Stethoscope className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1>CabinetPro</h1>
          <span>{user?.cabinet?.name || 'Cabinet Médical'}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">{t('menu')}</div>
          <ul>
            <li>
              <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} end>
                <LayoutDashboard />
                <span>{t('dashboard')}</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/patients" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Users />
                <span>{t('patients')}</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/appointments" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Calendar />
                <span>{t('appointments')}</span>
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">{t('finance')}</div>
          <ul>
            <li>
              <NavLink to="/payments" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <CreditCard />
                <span>{t('payments')}</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/accounting" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <PieChart />
                <span>{t('accounting')}</span>
              </NavLink>
            </li>
          </ul>
        </div>

        {user?.role === 'admin' && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">{t('admin')}</div>
            <ul>
              <li>
                <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  <Settings />
                  <span>{t('settings')}</span>
                </NavLink>
              </li>
            </ul>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {getInitials(user?.first_name, user?.last_name)}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.first_name} {user?.last_name}</div>
            <div className="sidebar-user-role capitalize text-[#00BFA6]">{user?.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
