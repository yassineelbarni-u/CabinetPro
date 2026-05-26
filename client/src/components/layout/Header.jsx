import { Menu, Bell, LogOut, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function Header({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();

  return (
    <header className="header header-glass">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg lg:hidden transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h2 className="header-title">{t('welcome')} {user?.last_name}</h2>
          <p className="header-subtitle">{t('subtitle')}</p>
        </div>
      </div>

      <div className="header-actions">
        {/* Language switcher */}
        <button 
          onClick={toggleLanguage}
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors uppercase font-semibold text-sm"
          title="Changer de langue"
        >
          {language === 'fr' ? 'AR' : 'FR'}
        </button>
        
        {/* Notifications */}
        <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Logout */}
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors ms-2"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{t('logout')}</span>
        </button>
      </div>
    </header>
  );
}
