import { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertCircle, Calendar as CalendarIcon, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data.data);
      } catch (err) {
        setError('Impossible de charger les données du tableau de bord.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="spinner-container"><div className="spinner"></div></div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-6 h-6" />
        <span className="font-medium">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-description">Aperçu en temps réel de votre activité.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stat-cards">
        <div className="stat-card stat-card-gradient" style={{ '--gradient-start': '#3A7BD5', '--gradient-end': '#00BFA6' }}>
          <div className="stat-info">
            <div className="stat-label">Patients Aujourd'hui</div>
            <div className="stat-value">{data.patients_today}</div>
          </div>
          <div className="stat-icon blue">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="stat-card stat-card-gradient" style={{ '--gradient-start': '#10B981', '--gradient-end': '#059669' }}>
          <div className="stat-info">
            <div className="stat-label">Recette du Jour</div>
            <div className="stat-value text-emerald-600">{formatCurrency(data.revenue_today)}</div>
          </div>
          <div className="stat-icon green">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="stat-card stat-card-gradient" style={{ '--gradient-start': '#F5A623', '--gradient-end': '#F59E0B' }}>
          <div className="stat-info">
            <div className="stat-label">Restes à Payer</div>
            <div className="stat-value text-orange-600">{formatCurrency(data.unpaid_total)}</div>
          </div>
          <div className="stat-icon orange">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="stat-card stat-card-gradient" style={{ '--gradient-start': '#1B4D89', '--gradient-end': '#3A7BD5' }}>
          <div className="stat-info">
            <div className="stat-label">Bénéfice Net (Mois)</div>
            <div className="stat-value">{formatCurrency(data.net_profit)}</div>
            <div className="stat-change positive">Mois en cours</div>
          </div>
          <div className="stat-icon teal">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prochains RDV */}
        <div className="card">
          <div className="card-header border-b border-gray-100 pb-4 mb-4">
            <h3 className="card-title flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              Prochains Rendez-vous
            </h3>
            <Link to="/appointments" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {data.next_appointments?.length > 0 ? (
              data.next_appointments.map(apt => (
                <div key={apt.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex flex-col items-center justify-center shrink-0">
                      <span className="text-sm font-bold leading-none">{new Date(apt.appointment_date).getDate()}</span>
                      <span className="text-[10px] font-semibold uppercase">{new Date(apt.appointment_date).toLocaleString('fr', { month: 'short' })}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{apt.patient?.first_name} {apt.patient?.last_name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(apt.appointment_date).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}
                        {apt.care_type && <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs">{apt.care_type}</span>}
                      </div>
                    </div>
                  </div>
                  <Link to={`/patients/${apt.patient_id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="empty-state py-8">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Aucun rendez-vous à venir.</p>
              </div>
            )}
          </div>
        </div>

        {/* Nouveaux patients */}
        <div className="card">
          <div className="card-header border-b border-gray-100 pb-4 mb-4">
            <h3 className="card-title flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Derniers Patients Inscrits
            </h3>
            <Link to="/patients" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {data.recent_patients?.length > 0 ? (
              data.recent_patients.map(patient => (
                <div key={patient.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {patient.first_name[0]}{patient.last_name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{patient.first_name} {patient.last_name}</div>
                      <div className="text-xs text-gray-500">Ajouté le {formatDateTime(patient.created_at)}</div>
                    </div>
                  </div>
                  <Link to={`/patients/${patient.id}`} className="btn-secondary btn-sm">
                    Dossier
                  </Link>
                </div>
              ))
            ) : (
              <div className="empty-state py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Aucun patient enregistré récemment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
