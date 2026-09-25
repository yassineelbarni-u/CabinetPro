import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, ExternalLink, Phone, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';

export default function NotificationPanel() {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [counts, setCounts] = useState({ high: 0, medium: 0, info: 0, low: 0 });
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const panelRef = useRef(null);

  const PRIORITY_CONFIG = {
    high:   { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: t('filterUrgent') },
    medium: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: t('filterMedium') },
    info:   { color: '#0891B2', bg: '#F0FDFF', border: '#A5F3FC', label: t('filterInfo') },
    low:    { color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0', label: t('filterInfo') },
  };

  const totalCount = counts.high + counts.medium + counts.info + counts.low;
  const urgentCount = counts.high + counts.medium;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
      setCounts(res.data.counts);
    } catch (err) {
      console.error('Erreur chargement notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filtered = activeFilter === 'all'
    ? notifications
    : notifications.filter(n => n.priority === activeFilter);

  const formatTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (language === 'ar') {
      if (mins < 60) return `منذ ${mins} دقيقة`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `منذ ${hours} ساعة`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `منذ ${days} يوم`;
      return `منذ ${Math.floor(days / 30)} شهر`;
    } else {
      if (mins < 60) return `il y a ${mins}min`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `il y a ${hours}h`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `il y a ${days}j`;
      return `il y a ${Math.floor(days / 30)} mois`;
    }
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* ── Bouton Bell ── */}
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}
        className="header-btn-icon"
        title={t('notificationsTitle')}
        aria-label={t('notificationsTitle')}
        style={{ position: 'relative' }}
      >
        <Bell style={{ width: 16, height: 16 }} />
        {urgentCount > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            minWidth: 18, height: 18, borderRadius: 99,
            background: 'linear-gradient(135deg, #EF4444, #DC2626)',
            color: '#fff', fontSize: '0.65rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid #fff',
            boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
            animation: urgentCount > 0 ? 'pulse-badge 2s ease-in-out infinite' : 'none',
          }}>
            {urgentCount > 99 ? '99+' : urgentCount}
          </span>
        )}
        {urgentCount === 0 && totalCount > 0 && <span className="notif-dot" />}
      </button>

      {/* ── Panneau déroulant ── */}
      {isOpen && (
        <div className="notification-panel animate-slide-down">
          {/* Header */}
          <div className="notification-panel-header">
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F2A3F' }}>
                {t('notificationsTitle')}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#8BA7BE', marginTop: 1 }}>
                {totalCount} {language === 'ar' ? 'تنبيه نشط' : `alerte${totalCount !== 1 ? 's' : ''} active${totalCount !== 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: 28, height: 28, borderRadius: 8, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                border: '1px solid #E0EEF2', background: '#F8FAFC',
                cursor: 'pointer', color: '#8BA7BE', transition: 'all 0.15s',
              }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* Filtres */}
          <div className="notification-filters">
            {[
              { key: 'all', label: t('filterAll'), count: totalCount },
              { key: 'high', label: `🔴 ${t('filterUrgent')}`, count: counts.high },
              { key: 'medium', label: `🟠 ${t('filterMedium')}`, count: counts.medium },
              { key: 'info', label: `🔵 ${t('filterInfo')}`, count: counts.info },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`notification-filter-btn ${activeFilter === f.key ? 'active' : ''}`}
              >
                {f.label}
                {f.count > 0 && (
                  <span className="notification-filter-count">{f.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Liste des notifications */}
          <div className="notification-list">
            {loading ? (
              <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                <div className="spinner" />
              </div>
            ) : filtered.length > 0 ? (
              filtered.map(notif => {
                const cfg = PRIORITY_CONFIG[notif.priority] || PRIORITY_CONFIG.info;
                return (
                  <Link
                    key={notif.id}
                    to={notif.link}
                    onClick={() => setIsOpen(false)}
                    className="notification-item"
                    style={{ '--notif-color': cfg.color, '--notif-bg': cfg.bg, '--notif-border': cfg.border }}
                  >
                    <div className="notification-item-icon">
                      <span style={{ fontSize: '1.25rem' }}>{notif.icon}</span>
                    </div>
                    <div className="notification-item-content">
                      <div className="notification-item-title">
                        {notif.title}
                        <span className="notification-priority-badge" style={{
                          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                        }}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="notification-item-message">{notif.message}</div>
                      <div className="notification-item-meta">
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock style={{ width: 10, height: 10 }} />
                          {formatTimeAgo(notif.date)}
                        </span>
                        {notif.phone && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Phone style={{ width: 10, height: 10 }} />
                            {notif.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <ExternalLink style={{ width: 14, height: 14, color: '#8BA7BE', flexShrink: 0 }} />
                  </Link>
                );
              })
            ) : (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F2A3F' }}>
                  {t('noNotifications')}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#8BA7BE', marginTop: 2 }}>
                  {t('allUpToDate')}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {totalCount > 0 && (
            <div className="notification-panel-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#8BA7BE' }}>
                <AlertTriangle style={{ width: 11, height: 11 }} />
                {language === 'ar' ? 'تحديث تلقائي كل 5 دقائق' : 'Actualisé automatiquement toutes les 5 min'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
