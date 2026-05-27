import { Menu, Bell, Globe, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function Header({ toggleSidebar }) {
  const { user } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();

  const now = new Date().toLocaleDateString('fr-MA', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  return (
    <header className="header">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button
          onClick={toggleSidebar}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Title + date */}
        <div>
          <h2 className="header-title capitalize">
            {t('welcome')}, {user?.first_name} 👋
          </h2>
          <p className="header-subtitle capitalize">{now}</p>
        </div>
      </div>

      {/* Right side */}
      <div className="header-actions">

        {/* Language switcher */}
        <button
          onClick={toggleLanguage}
          title="Changer la langue"
          className="h-9 px-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all text-xs font-bold tracking-wider"
        >
          {language === 'fr' ? 'عربي' : 'FR'}
        </button>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* User avatar (desktop) */}
        <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-gray-200 ml-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-semibold text-gray-800 leading-none">{user?.first_name} {user?.last_name}</div>
            <div className="text-xs text-gray-500 mt-0.5 capitalize">{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
