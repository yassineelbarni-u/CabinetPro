import { useState, useEffect } from 'react';
import {
  Users, TrendingUp, AlertCircle, Calendar as CalendarIcon,
  Clock, ArrowRight, ChevronRight, Banknote, Activity,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { formatCurrency, formatDateTime } from '../utils/formatters';

const KPI_CONFIG = [
  {
    key: 'patients_today',
    label: "Patients Aujourd'hui",
    icon: Users,
    iconClass: 'teal',
    gradientStart: '#06B6D4',
    gradientEnd: '#0891B2',
    format: v => v,
    unit: '',
  },
  {
    key: 'revenue_today',
    label: 'Recette du Jour',
    icon: Banknote,
    iconClass: 'green',
    gradientStart: '#10B981',
    gradientEnd: '#059669',
    format: v => formatCurrency(v),
    unit: '',
  },
  {
    key: 'unpaid_total',
    label: 'Restes à Payer',
    icon: AlertCircle,
    iconClass: 'orange',
    gradientStart: '#F59E0B',
    gradientEnd: '#D97706',
    format: v => formatCurrency(v),
    unit: '',
  },
  {
    key: 'net_profit',
    label: 'Bénéfice Net (Mois)',
    icon: TrendingUp,
    iconClass: 'blue',
    gradientStart: '#3B82F6',
    gradientEnd: '#1D4ED8',
    format: v => formatCurrency(v),
    trend: 'Mois en cours',
  },
];

const STATUS_DOT = {
  pending:   '#F59E0B',
  confirmed: '#10B981',
  present:   '#06B6D4',
  absent:    '#94A3B8',
  cancelled: '#EF4444',
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setData(res.data.data))
      .catch(err => {
        setError('Impossible de charger les données du tableau de bord.');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 'calc(100vh - 120px)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '0.875rem', color: '#8BA7BE' }}>Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" style={{ margin: '2rem 0' }}>
        <AlertCircle style={{ width: 20, height: 20, flexShrink: 0 }} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-description">Aperçu en temps réel de l'activité de votre cabinet.</p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 0.875rem',
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: 10,
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: '#065F46',
        }}>
          <Activity style={{ width: 14, height: 14 }} />
          Cabinet actif
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stat-cards">
        {KPI_CONFIG.map(({ key, label, icon: Icon, iconClass, gradientStart, gradientEnd, format, trend }) => (
          <div
            key={key}
            className="stat-card"
            style={{ '--gradient-start': gradientStart, '--gradient-end': gradientEnd }}
          >
            <div className="stat-info">
              <div className="stat-label">{label}</div>
              <div className="stat-value">
                {data[key] !== undefined ? format(data[key]) : '—'}
              </div>
              {trend && <div className="stat-trend">{trend}</div>}
            </div>
            <div className={`stat-icon ${iconClass}`}>
              <Icon style={{ width: 22, height: 22 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Section 2 colonnes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>

          {/* ── Prochains RDV ── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header de card */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #E0EEF2',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <h3 className="card-title">
                <CalendarIcon style={{ width: 18, height: 18, color: '#06B6D4' }} />
                Prochains Rendez-vous
              </h3>
              <Link
                to="/appointments"
                style={{
                  fontSize: '0.8125rem', fontWeight: 600, color: '#0891B2',
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3,
                }}
              >
                Voir tout <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>

            {/* Items */}
            <div style={{ padding: '0.75rem 1rem' }}>
              {data.next_appointments?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {data.next_appointments.map(apt => {
                    const aptDate = new Date(apt.appointment_date);
                    return (
                      <div
                        key={apt.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.875rem',
                          padding: '0.75rem 0.875rem', borderRadius: 14,
                          border: '1px solid #F1F5F9', transition: 'all 0.2s',
                          cursor: 'default',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#F0FDFF';
                          e.currentTarget.style.borderColor = '#A5F3FC';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = '#F1F5F9';
                        }}
                      >
                        {/* Date block */}
                        <div style={{
                          width: 46, height: 46, borderRadius: 12,
                          background: 'linear-gradient(135deg, #CFFAFE, #A5F3FC)',
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0891B2', lineHeight: 1 }}>
                            {aptDate.getDate()}
                          </span>
                          <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#0E7490', textTransform: 'uppercase' }}>
                            {aptDate.toLocaleString('fr', { month: 'short' })}
                          </span>
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: '#0F2A3F', fontSize: '0.9rem' }}>
                            {apt.patient?.first_name} {apt.patient?.last_name}
                          </div>
                          <div style={{
                            fontSize: '0.75rem', color: '#4A6580',
                            display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: 2,
                          }}>
                            <Clock style={{ width: 11, height: 11 }} />
                            {aptDate.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}
                            {apt.care_type && (
                              <span style={{
                                padding: '1px 6px', borderRadius: 6,
                                background: '#F1F5F9', fontSize: '0.7rem', fontWeight: 600, color: '#4A6580',
                              }}>
                                {apt.care_type}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status dot */}
                        {apt.status && (
                          <span style={{
                            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                            background: STATUS_DOT[apt.status] || '#94A3B8',
                          }} title={apt.status} />
                        )}

                        {/* Lien vers patient */}
                        <Link
                          to={`/patients/${apt.patient_id}`}
                          style={{
                            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#8BA7BE', transition: 'all 0.2s', textDecoration: 'none',
                            border: '1px solid #E0EEF2',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background='#CFFAFE'; e.currentTarget.style.color='#0891B2'; e.currentTarget.style.borderColor='#A5F3FC'; }}
                          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#8BA7BE'; e.currentTarget.style.borderColor='#E0EEF2'; }}
                        >
                          <ChevronRight style={{ width: 14, height: 14 }} />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <CalendarIcon />
                  <p style={{ fontSize: '0.875rem' }}>Aucun rendez-vous à venir.</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Derniers Patients ── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #E0EEF2',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <h3 className="card-title">
                <Users style={{ width: 18, height: 18, color: '#10B981' }} />
                Derniers Patients
              </h3>
              <Link
                to="/patients"
                style={{
                  fontSize: '0.8125rem', fontWeight: 600, color: '#059669',
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3,
                }}
              >
                Voir tout <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>

            <div style={{ padding: '0.75rem 1rem' }}>
              {data.recent_patients?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {data.recent_patients.map(patient => (
                    <div
                      key={patient.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem 0.875rem', borderRadius: 14,
                        border: '1px solid #F1F5F9', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background='#ECFDF5'; e.currentTarget.style.borderColor='#A7F3D0'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='#F1F5F9'; }}
                    >
                      <div className="patient-avatar" style={{
                        background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                        color: '#065F46', borderColor: '#A7F3D0',
                      }}>
                        {patient.first_name[0]}{patient.last_name[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: '#0F2A3F', fontSize: '0.9rem' }}>
                          {patient.first_name} {patient.last_name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#8BA7BE', marginTop: 1 }}>
                          Ajouté le {formatDateTime(patient.created_at)}
                        </div>
                      </div>
                      <Link
                        to={`/patients/${patient.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ flexShrink: 0, textDecoration: 'none' }}
                      >
                        Dossier
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <Users />
                  <p style={{ fontSize: '0.875rem' }}>Aucun patient enregistré récemment.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
