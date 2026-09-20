import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User, Phone, MapPin, Activity, Calendar, ArrowLeft,
  Edit3, Save, X, AlertCircle, CheckCircle, CreditCard,
  Clock, Stethoscope, FileText, Shield
} from 'lucide-react';
import api from '../api/axios';
import { formatDate, formatDateTime, calculateAge, PATIENT_TYPE_LABELS } from '../utils/formatters';
import Odontogram from '../components/patients/Odontogram';
import { usePageTitle } from '../hooks/usePageTitle';

const PAYMENT_STATUS = {
  paid: { label: 'Payé', class: 'bg-emerald-100 text-emerald-700' },
  partial: { label: 'Partiel', class: 'bg-yellow-100 text-yellow-700' },
  unpaid: { label: 'Non payé', class: 'bg-red-100 text-red-700' },
};

export default function PatientDetailPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [odontogram, setOdontogram] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  usePageTitle(patient ? `${patient.first_name} ${patient.last_name}` : 'Dossier Patient');

  // Edit modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const fetchPatient = useCallback(async () => {
    try {
      const [patientRes, historyRes] = await Promise.all([
        api.get(`/patients/${id}`),
        api.get(`/sessions/patient/${id}`),
      ]);
      setPatient(patientRes.data.data);
      setOdontogram(historyRes.data.data?.odontogram || []);
    } catch (error) {
      console.error('Erreur chargement patient:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  const openEdit = () => {
    setEditForm({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      first_name_ar: patient.first_name_ar || '',
      last_name_ar: patient.last_name_ar || '',
      phone_primary: patient.phone_primary || '',
      phone_secondary: patient.phone_secondary || '',
      birth_date: patient.birth_date ? patient.birth_date.split('T')[0] : '',
      city: patient.city || '',
      quarter: patient.quarter || '',
      patient_type: patient.patient_type || 'particulier',
      insurance_number: patient.insurance_number || '',
      allergies: patient.allergies || '',
      medical_history: patient.medical_history || '',
    });
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      await api.put(`/patients/${id}`, editForm);
      await fetchPatient();
      setIsEditing(false);
      setSaveMsg({ type: 'success', text: 'Dossier mis à jour avec succès !' });
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.response?.data?.message || 'Erreur lors de la mise à jour.' });
      setSaving(false);
    }
  };

  // Determine the last treatment per tooth from the odontogram history
  const getToothSummary = () => {
    const byTooth = {};
    odontogram.forEach(record => {
      if (!byTooth[record.tooth_number] || new Date(record.created_at) > new Date(byTooth[record.tooth_number].created_at)) {
        byTooth[record.tooth_number] = record;
      }
    });
    return Object.values(byTooth).filter(t => t.treatment_type !== 'sain' || parseFloat(t.price) > 0 || t.notes);
  };

  if (loading) return <div className="py-12 flex justify-center"><div className="spinner"></div></div>;
  if (!patient) return <div className="p-6 text-gray-500">Patient non trouvé.</div>;

  const treatedTeeth = getToothSummary();

  return (
    <div className="space-y-6 pb-10">
      {/* Barre de navigation du haut */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/patients" className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              {patient.first_name} {patient.last_name}
              <span className={`badge ${patient.patient_type === 'particulier' ? 'badge-neutral' : 'badge-info'}`}>
                {PATIENT_TYPE_LABELS[patient.patient_type]}
              </span>
            </h1>
            <p className="text-gray-500 text-sm">ID: {patient.id.split('-')[0].toUpperCase()} · Inscrit le {formatDate(patient.created_at)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveMsg && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${saveMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {saveMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {saveMsg.text}
            </div>
          )}
          <button onClick={openEdit} className="btn btn-secondary">
            <Edit3 className="w-4 h-4" /> Modifier le dossier
          </button>
          <Link to={`/patients/${id}/sessions/new`} className="btn btn-primary">
            <Stethoscope className="w-4 h-4" /> Nouvelle séance
          </Link>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Séances totales', value: patient.session_count || 0, icon: <Calendar className="w-5 h-5" />, color: 'blue' },
          { label: 'Total facturé', value: `${parseFloat(patient.total_due || 0).toFixed(0)} DH`, icon: <FileText className="w-5 h-5" />, color: 'orange' },
          { label: 'Total payé', value: `${parseFloat(patient.total_paid || 0).toFixed(0)} DH`, icon: <CreditCard className="w-5 h-5" />, color: 'green' },
          { label: 'Reste à payer', value: `${(parseFloat(patient.total_due || 0) - parseFloat(patient.total_paid || 0)).toFixed(0)} DH`, icon: <Clock className="w-5 h-5" />, color: 'teal' },
        ].map(stat => (
          <div key={stat.label} className="card py-4 px-5 flex items-center gap-4">
            <div className={`stat-icon ${stat.color} shrink-0`}>{stat.icon}</div>
            <div>
              <div className="text-xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs font-semibold text-gray-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {['overview', 'sessions', 'odontogram', 'payments'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {{ overview: 'Profil', sessions: 'Séances', odontogram: 'Odontogramme', payments: 'Paiements' }[tab]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">

        {/* === TAB : OVERVIEW === */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Infos personnelles */}
            <div className="card space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                  {patient.first_name?.[0]}{patient.last_name?.[0]}
                </div>
                <div>
                  <div className="font-bold text-lg text-gray-900">{patient.first_name} {patient.last_name}</div>
                  {(patient.first_name_ar || patient.last_name_ar) && (
                    <div className="font-arabic text-gray-500 text-sm">{patient.first_name_ar} {patient.last_name_ar}</div>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <InfoRow icon={<Calendar />} label="Date de naissance" value={patient.birth_date ? `${formatDate(patient.birth_date)} — ${calculateAge(patient.birth_date)} ans` : '—'} />
                <InfoRow icon={<Phone />} label="Téléphone principal" value={patient.phone_primary || '—'} />
                {patient.phone_secondary && <InfoRow icon={<Phone />} label="Téléphone secondaire" value={patient.phone_secondary} />}
                <InfoRow icon={<MapPin />} label="Ville / Quartier" value={[patient.quarter, patient.city].filter(Boolean).join(', ') || '—'} />
                <InfoRow icon={<Shield />} label="Couverture" value={PATIENT_TYPE_LABELS[patient.patient_type] || '—'} />
                {patient.insurance_number && <InfoRow icon={<FileText />} label="N° Assurance" value={patient.insurance_number} />}
              </div>
            </div>

            {/* Antécédents médicaux */}
            <div className="lg:col-span-2 space-y-4">
              <div className="card">
                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-rose-500" /> Antécédents médicaux
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                    <span className="block text-sm font-semibold text-rose-800 mb-2">⚠️ Allergies</span>
                    <p className="text-sm text-rose-900/80">{patient.allergies || 'Aucune allergie signalée.'}</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <span className="block text-sm font-semibold text-orange-800 mb-2">📋 Maladies / Antécédents</span>
                    <p className="text-sm text-orange-900/80">{patient.medical_history || 'Aucun antécédent signalé.'}</p>
                  </div>
                </div>
              </div>

              {/* Résumé Odontogramme rapide */}
              {treatedTeeth.length > 0 && (
                <div className="card">
                  <h3 className="text-base font-bold text-gray-800 mb-4">🦷 Soins dentaires (résumé)</h3>
                  <div className="flex flex-wrap gap-2">
                    {treatedTeeth.map(t => (
                      <div key={t.tooth_number} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs font-semibold text-blue-800">
                        <span className="font-bold">#{t.tooth_number}</span>
                        <span className="text-blue-600 capitalize">{t.treatment_type}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setActiveTab('odontogram')} className="mt-4 text-sm text-blue-600 font-semibold hover:underline">
                    Voir l'odontogramme complet →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === TAB : SESSIONS === */}
        {activeTab === 'sessions' && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Historique des Séances</h3>
              <Link to={`/patients/${id}/sessions/new`} className="btn btn-primary btn-sm">
                + Nouvelle séance
              </Link>
            </div>
            {patient.sessions?.length > 0 ? (
              <div className="space-y-4">
                {patient.sessions.map(session => (
                  <div key={session.id} className="p-5 border border-gray-100 rounded-xl hover:bg-gray-50/60 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-gray-900 text-base">{session.care_type || 'Consultation'}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{formatDateTime(session.session_date)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-800">{parseFloat(session.total_price || 0).toFixed(0)} DH</span>
                        <span className={`badge text-xs ${PAYMENT_STATUS[session.payment_status]?.class || 'bg-gray-100 text-gray-600'}`}>
                          {PAYMENT_STATUS[session.payment_status]?.label || '—'}
                        </span>
                      </div>
                    </div>
                    {session.clinical_notes && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg line-clamp-2">
                        {session.clinical_notes}
                      </p>
                    )}
                    {session.tooth_records?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {session.tooth_records.map(tr => (
                          <span key={tr.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-lg text-xs font-semibold text-blue-800">
                            <span className="font-bold">🦷 Dent #{tr.tooth_number} :</span>
                            <span className="text-blue-600 capitalize">{tr.treatment_type}</span>
                            {parseFloat(tr.price) > 0 && <span className="text-gray-500">({parseFloat(tr.price).toFixed(0)} DH)</span>}
                            {tr.notes && <span className="text-gray-400 font-normal"> - {tr.notes}</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Calendar className="!w-12 !h-12" />
                <h3>Aucune séance enregistrée</h3>
                <p>Créez la première séance pour ce patient.</p>
                <Link to={`/patients/${id}/sessions/new`} className="btn btn-primary mt-4">Créer une séance</Link>
              </div>
            )}
          </div>
        )}

        {/* === TAB : ODONTOGRAMME (lecture seule) === */}
        {activeTab === 'odontogram' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Odontogram value={odontogram} readOnly={true} />
            </div>

            <div className="card lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Historique complet</h3>
                <Link to={`/patients/${id}/sessions/new`} className="btn btn-primary btn-sm">
                  + Ajouter des soins
                </Link>
              </div>
              {odontogram.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Dent (FDI)</th>
                        <th>Soin</th>
                        <th>Notes</th>
                        <th>Prix</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {odontogram.map((record, i) => (
                        <tr key={i}>
                          <td><span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">#{record.tooth_number}</span></td>
                          <td className="capitalize font-semibold text-gray-800">{record.treatment_type}</td>
                          <td className="text-gray-500 text-sm">{record.notes || '—'}</td>
                          <td className="font-semibold">{parseFloat(record.price || 0).toFixed(0)} DH</td>
                          <td className="text-gray-500 text-sm">
                            {record.session?.session_date
                              ? formatDateTime(record.session.session_date)
                              : record.createdAt
                                ? formatDateTime(record.createdAt)
                                : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="text-5xl mb-4">🦷</div>
                  <h3>Aucun soin dentaire enregistré</h3>
                  <p>Les soins apparaîtront ici après la création d'une séance avec l'odontogramme.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === TAB : PAIEMENTS === */}
        {activeTab === 'payments' && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Historique des Paiements</h3>
              <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                Solde : <span className="font-bold text-red-600">{(parseFloat(patient.total_due || 0) - parseFloat(patient.total_paid || 0)).toFixed(0)} DH</span> à régler
              </div>
            </div>
            {patient.payments?.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Montant</th>
                      <th>Méthode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.payments.map(p => (
                      <tr key={p.id}>
                        <td>{formatDateTime(p.payment_date || p.createdAt)}</td>
                        <td className="font-bold text-emerald-700">+{parseFloat(p.amount).toFixed(0)} DH</td>
                        <td className="capitalize text-gray-600">{p.payment_method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <CreditCard />
                <h3>Aucun paiement enregistré</h3>
              </div>
            )}
          </div>
        )}
      </div>

      {/* === MODAL D'ÉDITION — CENTRÉ === */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto overflow-hidden animate-slide-up">

            {/* Header gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Modifier le dossier patient</h3>
                  <p className="text-blue-200 text-sm mt-0.5">{patient.first_name} {patient.last_name}</p>
                </div>
                <button onClick={() => setIsEditing(false)} className="text-white/60 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors mt-0.5">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSave}>
              <div className="px-6 py-6 space-y-7 max-h-[70vh] overflow-y-auto">

                {/* Section 1 — Identité */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Identité</span>
                    <div className="flex-1 h-px bg-gray-100 ml-2"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Prénom" value={editForm.first_name} onChange={v => setEditForm({ ...editForm, first_name: v })} required placeholder="Ahmed" />
                    <FormField label="Nom" value={editForm.last_name} onChange={v => setEditForm({ ...editForm, last_name: v })} required placeholder="Benali" />
                    <FormField label="Prénom (Arabe)" value={editForm.first_name_ar} onChange={v => setEditForm({ ...editForm, first_name_ar: v })} dir="rtl" placeholder="أحمد" />
                    <FormField label="Nom (Arabe)" value={editForm.last_name_ar} onChange={v => setEditForm({ ...editForm, last_name_ar: v })} dir="rtl" placeholder="بنعلي" />
                    <div className="col-span-2 sm:col-span-1">
                      <FormField label="Date de naissance" value={editForm.birth_date} onChange={v => setEditForm({ ...editForm, birth_date: v })} type="date" />
                    </div>
                  </div>
                </div>

                {/* Section 2 — Contact */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contact & Adresse</span>
                    <div className="flex-1 h-px bg-gray-100 ml-2"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Tél. principal" value={editForm.phone_primary} onChange={v => setEditForm({ ...editForm, phone_primary: v })} placeholder="06 XX XX XX XX" />
                    <FormField label="Tél. secondaire" value={editForm.phone_secondary} onChange={v => setEditForm({ ...editForm, phone_secondary: v })} placeholder="Optionnel" />
                    <FormField label="Ville" value={editForm.city} onChange={v => setEditForm({ ...editForm, city: v })} placeholder="Casablanca" />
                    <FormField label="Quartier" value={editForm.quarter} onChange={v => setEditForm({ ...editForm, quarter: v })} placeholder="Maarif" />
                  </div>
                </div>

                {/* Section 3 — Couverture */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Couverture Médicale</span>
                    <div className="flex-1 h-px bg-gray-100 ml-2"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Type de patient</label>
                      <select
                        value={editForm.patient_type}
                        onChange={e => setEditForm({ ...editForm, patient_type: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl form-select-custom outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm text-gray-800"
                      >
                        <option value="particulier">👤  Particulier (Sans mutuelle)</option>
                        <option value="cnss">🏥  CNSS (AMO)</option>
                        <option value="cnops">🏛️  CNOPS</option>
                        <option value="mutuelle">🛡️  Mutuelle Privée</option>
                      </select>
                    </div>
                    <FormField label="N° d'assurance" value={editForm.insurance_number} onChange={v => setEditForm({ ...editForm, insurance_number: v })} placeholder="Si applicable" />
                  </div>
                </div>

                {/* Section 4 — Médical */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Antécédents Médicaux</span>
                    <div className="flex-1 h-px bg-gray-100 ml-2"></div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <TextArea label="⚠️ Allergies connues" value={editForm.allergies} onChange={v => setEditForm({ ...editForm, allergies: v })} placeholder="Ex: Pénicilline, latex, aspirine..." />
                    <TextArea label="📋 Maladies chroniques / Antécédents" value={editForm.medical_history} onChange={v => setEditForm({ ...editForm, medical_history: v })} placeholder="Ex: Diabète, HTA, Asthme, cardiopathie..." />
                  </div>
                </div>

              </div>

              {/* Footer fixe */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <p className="text-xs text-gray-400">Les champs marqués * sont obligatoires</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary px-5">
                    Annuler
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-primary px-7">
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enregistrement...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="w-4 h-4" /> Enregistrer les modifications
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}

// ---- Helpers UI ----
function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="text-gray-400 shrink-0 mt-0.5">{icon}</div>
      <div>
        <span className="block font-semibold text-gray-500 text-xs uppercase tracking-wide mb-0.5">{label}</span>
        <span className="text-gray-900 font-medium">{value}</span>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', required = false, placeholder = '', dir = 'ltr' }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}{required && ' *'}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        dir={dir}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-800"
      />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder = '' }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows="3"
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-800 resize-none"
      />
    </div>
  );
}
