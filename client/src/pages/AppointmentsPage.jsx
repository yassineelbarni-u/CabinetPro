import { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon, Clock, Users, Plus, Check, X,
  User, ChevronLeft, ChevronRight, Phone, AlertCircle
} from 'lucide-react';
import api from '../api/axios';
import { formatDate } from '../utils/formatters';
import { usePageTitle } from '../hooks/usePageTitle';

/* ───────── Statut config ───────── */
const STATUS_CONFIG = {
  pending:   { label: 'En attente',        bg: 'badge-warning', color: '#D97706', dot: '#F59E0B' },
  confirmed: { label: 'Confirmé',           bg: 'badge-success', color: '#059669', dot: '#10B981' },
  present:   { label: "Salle d'attente",    bg: 'badge-primary', color: '#0891B2', dot: '#06B6D4' },
  absent:    { label: 'Absent',             bg: 'badge-neutral', color: '#64748B', dot: '#94A3B8' },
  cancelled: { label: 'Annulé',             bg: 'badge-danger',  color: '#DC2626', dot: '#EF4444' },
};

/* ───────── Care chips — Soins dentaires ───────── */
const CARE_CHIPS = [
  { value: 'Consultation générale', emoji: '🔍', label: 'Consultation' },
  { value: 'Détartrage',            emoji: '🪥', label: 'Détartrage' },
  { value: 'Carie / Obturation',    emoji: '🦷', label: 'Carie / Obturation' },
  { value: 'Extraction',            emoji: '⚙️', label: 'Extraction' },
  { value: 'Couronne / Prothèse',   emoji: '👑', label: 'Couronne / Prothèse' },
  { value: 'Dévitalisation (Canal)',emoji: '🔩', label: 'Dévitalisation' },
  { value: 'Implant',               emoji: '🔬', label: 'Implant' },
  { value: 'Orthodontie / Bagues',  emoji: '🔗', label: 'Orthodontie' },
  { value: 'Blanchiment',           emoji: '✨', label: 'Blanchiment' },
  { value: 'Contrôle / Suivi',      emoji: '📋', label: 'Contrôle' },
  { value: 'Urgence Douloureuse',   emoji: '🚨', label: 'Urgence' },
  { value: 'Radiographie',          emoji: '📸', label: 'Radio' },
];

/* ───────── Créneaux horaires ───────── */
const generateTimeSlots = () => {
  const slots = [];
  for (let h = 8; h <= 18; h++) {
    slots.push(`${String(h).padStart(2,'0')}:00`);
    if (h < 18) slots.push(`${String(h).padStart(2,'0')}:30`);
  }
  return slots;
};
const TIME_SLOTS = generateTimeSlots();
const DURATIONS = [15, 30, 45, 60];

export default function AppointmentsPage() {
  usePageTitle('Rendez-vous');
  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('agenda');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal
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
    is_urgent: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [patientSearch, setPatientSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [aptRes, queueRes, patRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/appointments/queue'),
        api.get('/patients?limit=1000'),
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
        care_type: formData.is_urgent ? 'Urgence Douloureuse' : formData.care_type,
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
      patient_id: '', appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '09:00', care_type: 'Consultation générale',
      duration_minutes: 30, notes: '', status: 'confirmed', is_urgent: false,
    });
    setPatientSearch('');
    setSaving(false);
    setError('');
  };

  const isToday = new Date().toDateString() === currentDate.toDateString();
  const todayStr = currentDate.toLocaleDateString('fr-MA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const filteredPatients = allPatients.filter(p =>
    `${p.first_name} ${p.last_name} ${p.phone_primary}`.toLowerCase()
      .includes(patientSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Rendez-vous</h1>
          <p className="page-description">Planifiez et gérez les consultations de votre cabinet.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus style={{ width: 16, height: 16 }} />
          Nouveau Rendez-vous
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          onClick={() => setActiveTab('agenda')}
          className={`tab-btn ${activeTab === 'agenda' ? 'active' : ''}`}
        >
          <CalendarIcon style={{ width: 16, height: 16 }} /> Agenda
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
        >
          <Users style={{ width: 16, height: 16 }} />
          Salle d'attente
          {queue.length > 0 && (
            <span style={{
              padding: '1px 7px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700,
              background: 'linear-gradient(135deg,#06B6D4,#0891B2)', color: '#fff',
              marginLeft: 2,
            }}>{queue.length}</span>
          )}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      ) : activeTab === 'agenda' ? (

        /* ===== AGENDA ===== */
        <div className="card">
          {/* Navigation de date */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid #E0EEF2',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d); }}
                style={{
                  width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', border: '1.5px solid #E0EEF2', background: '#F8FAFC',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='#06B6D4'; e.currentTarget.style.background='#F0FDFF'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='#E0EEF2'; e.currentTarget.style.background='#F8FAFC'; }}
              >
                <ChevronLeft style={{ width: 16, height: 16, color: '#4A6580' }} />
              </button>

              <div>
                <div style={{ fontWeight: 700, color: '#0F2A3F', textTransform: 'capitalize', fontSize: '0.9375rem' }}>
                  {todayStr}
                </div>
                {isToday && (
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#06B6D4', marginTop: 1 }}>
                    • Aujourd'hui
                  </div>
                )}
              </div>

              <button
                onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d); }}
                style={{
                  width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', border: '1.5px solid #E0EEF2', background: '#F8FAFC',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='#06B6D4'; e.currentTarget.style.background='#F0FDFF'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='#E0EEF2'; e.currentTarget.style.background='#F8FAFC'; }}
              >
                <ChevronRight style={{ width: 16, height: 16, color: '#4A6580' }} />
              </button>
            </div>

            {!isToday && (
              <button onClick={() => setCurrentDate(new Date())} className="btn btn-secondary btn-sm">
                Aujourd'hui
              </button>
            )}
          </div>

          {/* Liste RDV */}
          {appointments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {appointments.map(apt => {
                const s = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
                const time = new Date(apt.appointment_date).toLocaleTimeString('fr-MA', {
                  hour: '2-digit', minute: '2-digit',
                });
                return (
                  <div key={apt.id} className="apt-item" style={{ position: 'relative' }}>
                    {/* Heure */}
                    <div className="apt-time-block">
                      <div className="apt-time">{time}</div>
                      <div className="apt-duration">{apt.duration_minutes}min</div>
                    </div>

                    {/* Barre couleur statut */}
                    <div className="apt-color-bar" style={{ background: s.dot }} />

                    {/* Info patient */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#0F2A3F', fontSize: '0.9375rem' }}>
                        {apt.patient?.first_name} {apt.patient?.last_name}
                      </div>
                      <div style={{
                        fontSize: '0.8125rem', color: '#4A6580',
                        display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 2,
                      }}>
                        <span>{apt.care_type || 'Consultation'}</span>
                        {apt.patient?.phone_primary && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Phone style={{ width: 11, height: 11 }} />
                            {apt.patient.phone_primary}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badge statut */}
                    <span className={`badge ${s.bg}`}>
                      <span className="badge-dot" style={{ background: s.dot }} />
                      {s.label}
                    </span>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {apt.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(apt.id, 'confirmed')}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem' }}
                        >
                          <Check style={{ width: 13, height: 13, color: '#059669' }} /> Confirmer
                        </button>
                      )}
                      {apt.status === 'confirmed' && (
                        <button
                          onClick={() => updateStatus(apt.id, 'present')}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', color: '#0891B2' }}
                        >
                          <Check style={{ width: 13, height: 13 }} /> Présent
                        </button>
                      )}
                      {(apt.status === 'confirmed' || apt.status === 'present') && (
                        <button
                          onClick={() => { window.location.href = `/patients/${apt.patient_id}/sessions/new`; }}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem' }}
                        >
                          Ouvrir séance
                        </button>
                      )}
                      {apt.status !== 'cancelled' && apt.status !== 'absent' && (
                        <button
                          onClick={() => updateStatus(apt.id, 'cancelled')}
                          title="Annuler"
                          style={{
                            width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', border: '1.5px solid #E0EEF2', background: '#F8FAFC',
                            cursor: 'pointer', color: '#8BA7BE', transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor='#FECACA'; e.currentTarget.style.background='#FEF2F2'; e.currentTarget.style.color='#DC2626'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor='#E0EEF2'; e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.color='#8BA7BE'; }}
                        >
                          <X style={{ width: 14, height: 14 }} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <CalendarIcon style={{ width: 52, height: 52 }} />
              <h3>Aucun rendez-vous ce jour</h3>
              <p>Cliquez sur "Nouveau Rendez-vous" pour planifier une consultation.</p>
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ marginTop: '0.75rem' }}>
                <Plus style={{ width: 16, height: 16 }} /> Planifier un rendez-vous
              </button>
            </div>
          )}
        </div>

      ) : (
        /* ===== SALLE D'ATTENTE ===== */
        <div>
          {queue.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {queue.map((apt, index) => (
                <div key={apt.id} className="queue-card">
                  <div className="queue-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div className="queue-number">{index + 1}</div>
                      <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '0.875rem' }}>
                        En attente
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
                      {new Date(apt.updated_at).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div className="patient-avatar large">
                        {apt.patient?.first_name?.[0]}{apt.patient?.last_name?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0F2A3F', fontSize: '0.9375rem' }}>
                          {apt.patient?.first_name} {apt.patient?.last_name}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#4A6580', marginTop: 2 }}>
                          {apt.care_type || 'Consultation'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => { window.location.href = `/patients/${apt.patient_id}/sessions/new`; }}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', borderRadius: 12 }}
                    >
                      <User style={{ width: 16, height: 16 }} /> Démarrer la séance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{
              background: '#fff', borderRadius: 20, border: '1.5px dashed #A5F3FC', minHeight: 300,
            }}>
              <Users style={{ width: 52, height: 52 }} />
              <h3>La salle d'attente est vide</h3>
              <p>Marquez un rendez-vous comme "Présent" dans l'agenda pour l'ajouter ici.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== MODAL NOUVEAU RENDEZ-VOUS ===== */}
      {isModalOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container animate-slide-up" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>

            {/* Header gradient teal */}
            <div className="modal-header-teal">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                  🗓️ Nouveau Rendez-vous
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
                  Planifiez une consultation pour un patient
                </p>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); resetModal(); }}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.20)',
                  borderRadius: 10, padding: 8, cursor: 'pointer', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}
                aria-label="Fermer"
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            {/* Corps du formulaire avec scroll */}
            <div style={{ maxHeight: '72vh', overflowY: 'auto', padding: '1.5rem' }}>
              <form id="apt-form" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.375rem' }}>
                {error && (
                  <div className="alert alert-danger">
                    <AlertCircle style={{ width: 17, height: 17, flexShrink: 0 }} /> {error}
                  </div>
                )}

                {/* ── Section Patient ── */}
                <div>
                  <div className="form-section-header">
                    <div className="form-section-icon teal"><User style={{ width: 13, height: 13 }} /></div>
                    <span className="form-section-label">Patient *</span>
                    <div className="form-section-line" />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Rechercher par nom ou téléphone..."
                      value={patientSearch}
                      onChange={e => setPatientSearch(e.target.value)}
                      className="form-input"
                      style={{ marginBottom: 8 }}
                    />
                    {patientSearch && (
                      <div style={{
                        border: '1px solid #E0EEF2', borderRadius: 12,
                        background: '#fff', boxShadow: '0 8px 20px rgba(14,116,144,0.12)',
                        maxHeight: 180, overflowY: 'auto',
                      }}>
                        {filteredPatients.slice(0, 8).map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setFormData(f => ({ ...f, patient_id: p.id }));
                              setPatientSearch(`${p.first_name} ${p.last_name}`);
                            }}
                            style={{
                              width: '100%', textAlign: 'left', padding: '0.625rem 1rem',
                              background: formData.patient_id === p.id ? '#F0FDFF' : 'transparent',
                              border: 'none', cursor: 'pointer', fontSize: '0.875rem',
                              borderBottom: '1px solid #F1F5F9',
                              display: 'flex', alignItems: 'center', gap: '0.625rem',
                              fontFamily: 'var(--font-sans)',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background='#F0FDFF'}
                            onMouseLeave={e => e.currentTarget.style.background = formData.patient_id === p.id ? '#F0FDFF' : 'transparent'}
                          >
                            <div className="patient-avatar" style={{ width: 32, height: 32, borderRadius: 8, fontSize: '0.75rem' }}>
                              {p.first_name[0]}{p.last_name[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#0F2A3F' }}>{p.first_name} {p.last_name}</div>
                              {p.phone_primary && <div style={{ fontSize: '0.75rem', color: '#8BA7BE' }}>{p.phone_primary}</div>}
                            </div>
                            {formData.patient_id === p.id && <Check style={{ width: 15, height: 15, color: '#06B6D4', marginLeft: 'auto' }} />}
                          </button>
                        ))}
                        {filteredPatients.length === 0 && (
                          <div style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#8BA7BE', textAlign: 'center' }}>
                            Aucun patient trouvé
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Section Urgence ── */}
                <div>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    border: formData.is_urgent ? '1.5px solid #EF4444' : '1.5px solid #E0EEF2',
                    borderRadius: 12,
                    background: formData.is_urgent ? '#FEF2F2' : '#F8FAFC',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.is_urgent}
                      onChange={e => setFormData(f => ({ ...f, is_urgent: e.target.checked, care_type: e.target.checked ? 'Urgence Douloureuse' : 'Consultation générale' }))}
                      style={{ accentColor: '#EF4444', width: 16, height: 16 }}
                    />
                    <span style={{ fontSize: '1.125rem' }}>🚨</span>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: formData.is_urgent ? '#DC2626' : '#0F2A3F' }}>
                        Urgence Douloureuse
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#8BA7BE', marginTop: 1 }}>
                        Patient en douleur, priorité immédiate
                      </div>
                    </div>
                  </label>
                </div>

                {/* ── Section Type de Soin ── */}
                {!formData.is_urgent && (
                  <div>
                    <div className="form-section-header">
                      <div className="form-section-icon purple">
                        <Clock style={{ width: 13, height: 13 }} />
                      </div>
                      <span className="form-section-label">Type de Soin</span>
                      <div className="form-section-line" />
                    </div>
                    <div className="care-chips-grid">
                      {CARE_CHIPS.filter(c => c.value !== 'Urgence Douloureuse').map(chip => (
                        <button
                          key={chip.value}
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, care_type: chip.value }))}
                          className={`care-chip ${formData.care_type === chip.value ? 'selected' : ''}`}
                          title={chip.value}
                        >
                          <div className="care-chip-check">
                            <Check style={{ width: 10, height: 10, color: '#fff' }} />
                          </div>
                          <span className="care-chip-emoji">{chip.emoji}</span>
                          <span className="care-chip-label">{chip.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Section Date ── */}
                <div>
                  <div className="form-section-header">
                    <div className="form-section-icon green">
                      <CalendarIcon style={{ width: 13, height: 13 }} />
                    </div>
                    <span className="form-section-label">Date & Heure</span>
                    <div className="form-section-line" />
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.appointment_date}
                    onChange={e => setFormData(f => ({ ...f, appointment_date: e.target.value }))}
                    className="form-input"
                    style={{ marginBottom: '0.875rem' }}
                  />
                  {/* Grille créneaux */}
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#8BA7BE', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Choisir un créneau
                  </div>
                  <div className="time-slots-grid">
                    {TIME_SLOTS.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setFormData(f => ({ ...f, appointment_time: slot }))}
                        className={`time-slot ${formData.appointment_time === slot ? 'selected' : ''}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Section Durée ── */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8BA7BE', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.625rem' }}>
                    Durée estimée
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                    {DURATIONS.map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setFormData(f => ({ ...f, duration_minutes: d }))}
                        className={`duration-btn ${formData.duration_minutes === d ? 'selected' : ''}`}
                      >
                        {d}min
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Statut initial ── */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8BA7BE', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.625rem' }}>
                    Statut initial
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                    {['pending', 'confirmed'].map(s => {
                      const cfg = STATUS_CONFIG[s];
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, status: s }))}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.625rem',
                            padding: '0.75rem 1rem', borderRadius: 12, cursor: 'pointer',
                            border: formData.status === s ? '1.5px solid #06B6D4' : '1.5px solid #E0EEF2',
                            background: formData.status === s ? '#F0FDFF' : '#F8FAFC',
                            boxShadow: formData.status === s ? '0 0 0 3px rgba(6,182,212,0.12)' : 'none',
                            transition: 'all 0.2s',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: formData.status === s ? '#0891B2' : '#4A6580' }}>
                            {cfg.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Notes ── */}
                <div className="form-group">
                  <label className="form-label">Notes (Optionnel)</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    placeholder="Informations supplémentaires pour ce rendez-vous..."
                    className="form-input"
                    style={{ resize: 'none' }}
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button type="button" onClick={() => { setIsModalOpen(false); resetModal(); }} className="btn btn-secondary">
                Annuler
              </button>
              <button type="submit" form="apt-form" disabled={saving} className="btn btn-primary" style={{ minWidth: 160 }}>
                {saving ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="spinner spinner-sm" /> Planification...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CalendarIcon style={{ width: 16, height: 16 }} /> Planifier le RDV
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
