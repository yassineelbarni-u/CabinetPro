import { useState, useEffect } from 'react';
import {
  Users, TrendingUp, AlertCircle, Calendar as CalendarIcon,
  Clock, ArrowRight, ChevronRight, Banknote, Activity,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../api/axios';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { usePageTitle } from '../hooks/usePageTitle';

const KPI_CONFIG = [
  {
    key: 'patients_today',
    label: "Patients Aujourd'hui",
    icon: Users,
    iconClass: 'teal',
    gradientStart: '#06B6D4',
    gradientEnd: '#0891B2',
    format: v => v,
  },
  {
    key: 'revenue_today',
    label: 'Recette du Jour',
    icon: Banknote,
    iconClass: 'green',
    gradientStart: '#10B981',
    gradientEnd: '#059669',
    format: v => formatCurrency(v),
  },
  {
    key: 'unpaid_total',
    label: 'Restes à Payer',
    icon: AlertCircle,
    iconClass: 'orange',
    gradientStart: '#F59E0B',
    gradientEnd: '#D97706',
    format: v => formatCurrency(v),
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

/* ── Skeleton pour les KPI cards ── */
function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <div className="stat-info">
        <div className="skeleton skeleton-text-sm" style={{ width: 120, marginBottom: 10 }} />
        <div className="skeleton skeleton-text" style={{ width: 90, height: 32 }} />
        <div className="skeleton skeleton-text-sm" style={{ width: 70, marginTop: 8 }} />
      </div>
      <div className="skeleton skeleton-rect" style={{ width: 52, height: 52, flexShrink: 0 }} />
    </div>
  );
}

/* ── Skeleton pour les listes ── */
function ListItemSkeleton() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.875rem',
      padding: '0.75rem 0.875rem', borderRadius: 14,
      border: '1px solid #F1F5F9',
    }}>
      <div className="skeleton skeleton-rect" style={{ width: 46, height: 46, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 6 }} />
        <div className="skeleton skeleton-text-sm" style={{ width: '40%' }} />
      </div>
    </div>
  );
}

/* ── Tooltip Recharts personnalisé ── */
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.97)',
        border: '1px solid #A5F3FC',
        borderRadius: 10,
        padding: '0.625rem 0.875rem',
        boxShadow: '0 4px 16px rgba(6,182,212,0.15)',
      }}>
        <p style={{ fontSize: '0.75rem', color: '#8BA7BE', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0E7490' }}>
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  usePageTitle('Tableau de bord');

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

  /* ── Générer des données de graphique sur 7 jours ── */
  const revenueChartData = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        day: d.toLocaleDateString('fr-MA', { weekday: 'short', day: 'numeric' }),
        amount: i === 0 ? (parseFloat(data?.revenue_today) || 0) : 0,
      });
    }
    return days;
  })();

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

      {/* KPI Cards — Skeleton ou données réelles */}
      <div className="stat-cards">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          KPI_CONFIG.map(({ key, label, icon: Icon, iconClass, gradientStart, gradientEnd, format, trend }) => (
            <div
              key={key}
              className="stat-card"
              style={{ '--gradient-start': gradientStart, '--gradient-end': gradientEnd }}
            >
              <div className="stat-info">
                <div className="stat-label">{label}</div>
                <div className="stat-value">
                  {data?.[key] !== undefined ? format(data[key]) : '—'}
                </div>
                {trend && <div className="stat-trend">{trend}</div>}
              </div>
              <div className={`stat-icon ${iconClass}`}>
                <Icon style={{ width: 22, height: 22 }} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Graphique Recettes — Recharts */}
      {!loading && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #E0EEF2',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h3 className="card-title">
              <TrendingUp style={{ width: 18, height: 18, color: '#06B6D4' }} />
              Recettes — 7 derniers jours
            </h3>
            <span style={{
              fontSize: '0.75rem', fontWeight: 600,
              padding: '0.25rem 0.75rem', borderRadius: 99,
              background: '#CFFAFE', color: '#0E7490', border: '1px solid #A5F3FC',
            }}>
              MAD
            </span>
          </div>
          <div style={{ padding: '1.25rem 0.5rem 0.5rem' }}>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={revenueChartData} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0EEF2" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: '#8BA7BE', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#8BA7BE' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => v === 0 ? '0' : `${(v/1000).toFixed(0)}k`}
                  width={36}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#A5F3FC', strokeWidth: 1, strokeDasharray: '4 2' }} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#06B6D4"
                  strokeWidth={2.5}
                  fill="url(#tealGradient)"
                  dot={{ fill: '#06B6D4', strokeWidth: 0, r: 3 }}
                  activeDot={{ fill: '#0891B2', r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Section 2 colonnes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>

          {/* ── Prochains RDV ── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
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

            <div style={{ padding: '0.75rem 1rem' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <ListItemSkeleton />
                  <ListItemSkeleton />
                  <ListItemSkeleton />
                </div>
              ) : data?.next_appointments?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {data.next_appointments.map(apt => {
                    const aptDate = new Date(apt.appointment_date);
                    return (
                      <div
                        key={apt.id}
                        className="apt-item"
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
                          className="header-btn-icon"
                        >
                          <ChevronRight style={{ width: 14, height: 14 }} />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #F0FDFF, #ECFDF5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 8,
                  }}>
                    <CalendarIcon style={{ width: 24, height: 24, color: '#06B6D4' }} />
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#4A6580' }}>Aucun rendez-vous à venir.</p>
                  <Link to="/appointments" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', marginTop: 8 }}>
                    Planifier un RDV
                  </Link>
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
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <ListItemSkeleton />
                  <ListItemSkeleton />
                  <ListItemSkeleton />
                </div>
              ) : data?.recent_patients?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {data.recent_patients.map(patient => (
                    <div
                      key={patient.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem 0.875rem', borderRadius: 14,
                        border: '1px solid #F1F5F9', transition: 'all 0.2s',
                      }}
                      className="apt-item"
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
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 8,
                  }}>
                    <Users style={{ width: 24, height: 24, color: '#10B981' }} />
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#4A6580' }}>Aucun patient enregistré récemment.</p>
                  <Link to="/patients" className="btn btn-accent btn-sm" style={{ textDecoration: 'none', marginTop: 8 }}>
                    Ajouter un patient
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
