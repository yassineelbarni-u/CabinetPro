import { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon, Clock, Users, Plus, Check, X,
  User, ChevronLeft, ChevronRight, Search, Phone, AlertCircle
} from 'lucide-react';
import api from '../api/axios';
import { formatDate } from '../utils/formatters';

const STATUS_CONFIG = {
  pending:   { label: "En attente",        bg: "bg-yellow-100 text-yellow-800",   dot: "bg-yellow-400" },
  confirmed: { label: "Confirmé",           bg: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  present:   { label: "En salle d'attente", bg: "bg-blue-100 text-blue-800",      dot: "bg-blue-500 animate-pulse" },
  absent:    { label: "Absent",             bg: "bg-gray-100 text-gray-600",      dot: "bg-gray-400" },
  cancelled: { label: "Annulé",             bg: "bg-red-100 text-red-700",        dot: "bg-red-400" },
};

const CARE_TYPES = [
  "Consultation générale",
  "Détartrage",
  "Carie / Obturation",
  "Extraction",
  "Couronne / Prothèse",
  "Dévitalisation (Canal)",
  "Implant",
  "Orthodontie / Bagues",
  "Blanchiment",
  "Contrôle / Suivi",
];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('agenda');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Create modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allPatients, setAllPatients] = useState([]);
  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '09:00',
    care_type: 'Consultation générale',
    duration_minutes: 30,
    notes: '',
    status: 'confirmed',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [aptRes, queueRes, patRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/appointments/queue'),
        api.get('/patients?limit=1000')
      ]);
      setAppointments(aptRes.data.data);
      setQueue(queueRes.data.data);
      setAllPatients(patRes.data.data);
    } catch (err) {
      console.error('Erreur chargement rendez-vous', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      fetchData();
    } catch (err) {
      console.error('Erreur MAJ statut', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.patient_id) { setError('Veuillez sélectionner un patient.'); return; }
    setSaving(true);
    setError('');
    try {
      const dateTime = `${formData.appointment_date}T${formData.appointment_time}:00`;
      await api.post('/appointments', {
        patient_id: formData.patient_id,
        appointment_date: dateTime,
        care_type: formData.care_type,
        duration_minutes: parseInt(formData.duration_minutes),
        notes: formData.notes,
        status: formData.status,
      });
      setIsModalOpen(false);
      resetModal();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création.');
      setSaving(false);
    }
  };

  const resetModal = () => {
    setFormData({
      patient_id: '',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '09:00',
      care_type: 'Consultation générale',
      duration_minutes: 30,
      notes: '',
      status: 'confirmed',
    });
    setSaving(false);
    setError('');
  };

  const isToday = new Date().toDateString() === currentDate.toDateString();
  const todayStr = currentDate.toLocaleDateString('fr-MA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Rendez-vous</h1>
          <p className="page-description">Planifiez et gérez les consultations de votre cabinet.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Nouveau Rendez-vous
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'agenda' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <CalendarIcon className="w-4 h-4" /> Agenda
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'queue' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Users className="w-4 h-4" />
          Salle d'attente
          {queue.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold">{queue.length}</span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><div className="spinner"></div></div>
      ) : activeTab === 'agenda' ? (

        /* ===== AGENDA ===== */
        <div className="card">
          {/* Date Navigation */}
          <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d); }}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div>
                <div className="font-bold text-gray-900 capitalize">{todayStr}</div>
                {isToday && <div className="text-xs text-blue-600 font-semibold">Aujourd'hui</div>}
              </div>
              <button
                onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d); }}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            {!isToday && (
              <button onClick={() => setCurrentDate(new Date())} className="btn btn-secondary btn-sm">
                Aujourd'hui
              </button>
            )}
          </div>

          {appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.map(apt => {
                const s = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
                const time = new Date(apt.appointment_date).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={apt.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-colors group">
                    <div className="text-center min-w-[56px]">
                      <div className="text-base font-bold text-gray-900">{time}</div>
                      <div className="text-xs text-gray-500">{apt.duration_minutes}min</div>
                    </div>
                    <div className={`w-1 h-12 rounded-full shrink-0 ${s.dot.replace('animate-pulse', '')}`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900">{apt.patient?.first_name} {apt.patient?.last_name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                        <span>{apt.care_type || 'Consultation'}</span>
                        {apt.patient?.phone_primary && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />{apt.patient.phone_primary}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`badge text-xs font-semibold ${s.bg}`}>{s.label}</span>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {apt.status === 'pending' && (
                        <button onClick={() => updateStatus(apt.id, 'confirmed')} className="btn btn-secondary btn-sm text-xs">
                          Confirmer
                        </button>
                      )}
                      {apt.status === 'confirmed' && (
                        <button onClick={() => updateStatus(apt.id, 'present')} className="btn btn-secondary btn-sm text-xs text-blue-700">
                          <Check className="w-3.5 h-3.5" /> Présent
                        </button>
                      )}
                      {(apt.status === 'confirmed' || apt.status === 'present') && (
                        <button
                          onClick={() => { window.location.href = `/patients/${apt.patient_id}/sessions/new`; }}
                          className="btn btn-primary btn-sm text-xs"
                        >
                          Ouvrir séance
                        </button>
                      )}
                      {apt.status !== 'cancelled' && apt.status !== 'absent' && (
                        <button
                          onClick={() => updateStatus(apt.id, 'cancelled')}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                          title="Annuler"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state py-16">
              <CalendarIcon className="!w-12 !h-12" />
              <h3>Aucun rendez-vous planifié</h3>
              <p>Cliquez sur "Nouveau Rendez-vous" pour planifier une consultation.</p>
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary mt-4">
                <Plus className="w-4 h-4" /> Planifier un rendez-vous
              </button>
            </div>
          )}
        </div>

      ) : (

        /* ===== SALLE D'ATTENTE ===== */
        <div>
          {queue.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {queue.map((apt, index) => (
                <div key={apt.id} className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="text-white font-semibold text-sm">En attente</span>
                    </div>
                    <div className="text-blue-200 text-xs font-semibold">
                      {new Date(apt.updated_at).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base shrink-0">
                        {apt.patient?.first_name?.[0]}{apt.patient?.last_name?.[0]}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{apt.patient?.first_name} {apt.patient?.last_name}</div>
                        <div className="text-sm text-gray-500">{apt.care_type || 'Consultation'}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => { window.location.href = `/patients/${apt.patient_id}/sessions/new`; }}
                      className="w-full btn btn-primary justify-center"
                    >
                      <User className="w-4 h-4" /> Démarrer la séance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
              <Users className="!w-14 !h-14" />
              <h3>La salle d'attente est vide</h3>
              <p>Marquez un rendez-vous comme "Présent" dans l'agenda pour qu'il apparaisse ici.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== MODAL NOUVEAU RENDEZ-VOUS ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Nouveau Rendez-vous</h3>
                  <p className="text-blue-200 text-sm mt-0.5">Planifiez une consultation pour un patient</p>
                </div>
                <button
                  onClick={() => { setIsModalOpen(false); resetModal(); }}
                  className="text-white/60 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreate} className="px-6 py-5 space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              {/* Patient */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <User className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Patient *</span>
                  <div className="flex-1 h-px bg-gray-100 ml-1"></div>
                </div>
                <select
                  required
                  value={formData.patient_id}
                  onChange={e => setFormData({...formData, patient_id: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl form-select-custom outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm"
                >
                  <option value="">-- Sélectionnez un patient --</option>
                  {allPatients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} {p.phone_primary ? `(${p.phone_primary})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Heure */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CalendarIcon className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Date &amp; Heure</span>
                  <div className="flex-1 h-px bg-gray-100 ml-1"></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.appointment_date}
                      onChange={e => setFormData({...formData, appointment_date: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Heure *</label>
                    <input
                      type="time"
                      required
                      value={formData.appointment_time}
                      onChange={e => setFormData({...formData, appointment_time: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Soin & Durée */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <Clock className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Type de Soin</span>
                  <div className="flex-1 h-px bg-gray-100 ml-1"></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Soin prévu</label>
                    <select
                      value={formData.care_type}
                      onChange={e => setFormData({...formData, care_type: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl form-select-custom outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm"
                    >
                      {CARE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Durée estimée</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[15, 30, 45, 60].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setFormData({...formData, duration_minutes: d})}
                          className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            formData.duration_minutes === d
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {d}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statut */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5">Statut initial</label>
                <div className="grid grid-cols-2 gap-2">
                  {['pending', 'confirmed'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({...formData, status: s})}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
                        formData.status === s
                          ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_CONFIG[s].dot}`}></span>
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Notes (Optionnel)</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  rows="2"
                  placeholder="Informations supplémentaires pour ce rendez-vous..."
                  className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none text-sm"
                />
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetModal(); }}
                  className="btn btn-secondary px-5"
                >
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary px-7">
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Planification...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" /> Planifier le rendez-vous
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
