import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, Plus, Search, Calendar as CalendarIcon,
  Trash2, FileText, User, DollarSign, TrendingUp,
  Pencil, X, AlertCircle, Check, ChevronLeft, ChevronRight,
  Banknote, Building2, Shield, Wallet,
} from 'lucide-react';
import api from '../api/axios';
import { generateInvoicePDF } from '../utils/invoiceGenerator';

/* ───────── Méthode de paiement — chips ───────── */
const METHOD_CHIPS = [
  { value: 'especes',   emoji: '💵', label: 'Espèces',           badge: 'badge-success' },
  { value: 'virement',  emoji: '🏦', label: 'Virement',          badge: 'badge-primary' },
  { value: 'cheque',    emoji: '📄', label: 'Chèque',            badge: 'badge-purple'  },
  { value: 'assurance', emoji: '🛡️', label: 'Assurance',         badge: 'badge-warning' },
];

/* ───────── Type payeur — chips ───────── */
const PAYER_CHIPS = [
  { value: 'patient',  emoji: '👤', label: 'Patient',       desc: 'Paiement direct' },
  { value: 'cnss',     emoji: '🏥', label: 'CNSS',          desc: 'AMO' },
  { value: 'cnops',    emoji: '🏛️', label: 'CNOPS',         desc: 'Fonction publique' },
  { value: 'mutuelle', emoji: '🛡️', label: 'Mutuelle',      desc: 'Privée' },
];

const fmtMAD = (v) =>
  `${parseFloat(v || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD`;

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' });

const EMPTY_FORM = {
  patient_id: '', amount: '', payment_method: 'especes',
  payer_type: 'patient', payment_date: new Date().toISOString().split('T')[0], notes: '',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cabinetInfo, setCabinetInfo] = useState({});

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [allPatients, setAllPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, ...(search && { search }), ...(filterMethod && { method: filterMethod }) });
      const [payRes, statRes, patRes] = await Promise.all([
        api.get(`/payments?${params}`),
        api.get('/payments/stats'),
        api.get('/patients?limit=1000'),
      ]);
      setPayments(payRes.data.data);
      setTotalPages(payRes.data.pagination.pages);
      setStats(statRes.data.data);
      setAllPatients(patRes.data.data);
      if (!cabinetInfo.name) {
        try { const r = await api.get('/cabinet'); setCabinetInfo(r.data.data); } catch (_) {}
      }
    } catch (err) {
      console.error('Erreur chargement paiements:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterMethod]);

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.amount) { setError('Veuillez remplir les champs obligatoires.'); return; }
    setSaving(true); setError('');
    try {
      if (isEditMode) await api.put(`/payments/${editId}`, formData);
      else await api.post('/payments', formData);
      setIsModalOpen(false); resetModal(); fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally { setSaving(false); }
  };

  const handleEdit = (p) => {
    setIsEditMode(true); setEditId(p.id);
    setFormData({
      patient_id: p.patient_id, amount: p.amount,
      payment_method: p.payment_method, payer_type: p.payer_type,
      payment_date: new Date(p.payment_date).toISOString().split('T')[0],
      notes: p.notes || '',
    });
    const found = allPatients.find(pt => pt.id === p.patient_id);
    if (found) setPatientSearch(`${found.first_name} ${found.last_name}`);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce paiement ?')) return;
    try { await api.delete(`/payments/${id}`); fetchData(); }
    catch (err) { alert('Erreur lors de la suppression.'); }
  };

  const resetModal = () => {
    setFormData(EMPTY_FORM); setIsEditMode(false);
    setEditId(null); setError(''); setPatientSearch('');
  };

  const filteredPatients = allPatients.filter(p =>
    `${p.first_name} ${p.last_name} ${p.phone_primary}`.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const statsCards = stats ? [
    { label: 'Recettes du Jour',  value: fmtMAD(stats.revenue_today), icon: TrendingUp, cls: 'green',  gs: '#10B981', ge: '#059669' },
    { label: 'Recettes du Mois',  value: fmtMAD(stats.revenue_month), icon: Banknote,   cls: 'teal',   gs: '#06B6D4', ge: '#0891B2' },
    { label: 'Total Annuel',      value: fmtMAD(stats.revenue_year),  icon: CalendarIcon,cls:'blue',   gs: '#3B82F6', ge: '#1D4ED8' },
    { label: 'Espèces (Mois)',    value: fmtMAD(stats.by_method?.find(m => m.payment_method === 'especes')?.total || 0), icon: CreditCard, cls: 'orange', gs: '#F59E0B', ge: '#D97706' },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Paiements & Encaissements</h1>
          <p className="page-description">Gérez les recettes, suivez les encaissements et les méthodes de paiement.</p>
        </div>
        <button onClick={() => { resetModal(); setIsModalOpen(true); }} className="btn btn-primary">
          <Plus style={{ width: 16, height: 16 }} /> Nouveau Paiement
        </button>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="stat-cards">
          {statsCards.map(({ label, value, icon: Icon, cls, gs, ge }) => (
            <div key={label} className="stat-card" style={{ '--gradient-start': gs, '--gradient-end': ge }}>
              <div className="stat-info">
                <span className="stat-label">{label}</span>
                <span className="stat-value" style={{ fontSize: '1.375rem' }}>{value}</span>
              </div>
              <div className={`stat-icon ${cls}`}><Icon style={{ width: 22, height: 22 }} /></div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center',
        background: '#fff', padding: '1rem 1.25rem', borderRadius: 16,
        border: '1px solid #E0EEF2', boxShadow: '0 2px 8px rgba(14,116,144,0.06)',
      }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 220 }}>
          <Search />
          <input
            type="text" placeholder="Rechercher un patient..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Filtre méthode — mini chips */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[{ value: '', label: 'Tous' }, ...METHOD_CHIPS].map(m => (
            <button
              key={m.value}
              onClick={() => { setFilterMethod(m.value); setPage(1); }}
              style={{
                padding: '0.4rem 0.875rem', borderRadius: 99, fontSize: '0.775rem', fontWeight: 700,
                cursor: 'pointer', border: 'none', transition: 'all 0.2s', fontFamily: 'var(--font-sans)',
                background: filterMethod === m.value ? 'linear-gradient(135deg,#06B6D4,#0891B2)' : '#F0F7FA',
                color: filterMethod === m.value ? '#fff' : '#4A6580',
                boxShadow: filterMethod === m.value ? '0 2px 8px rgba(6,182,212,0.30)' : 'none',
              }}
            >
              {m.emoji && <span style={{ marginRight: 4 }}>{m.emoji}</span>}
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header table */}
        <div style={{
          padding: '1rem 1.5rem', borderBottom: '1px solid #E0EEF2',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#F8FAFC',
        }}>
          <span style={{ fontWeight: 700, color: '#0F2A3F', fontSize: '0.9375rem' }}>
            Historique des Paiements
          </span>
          {!loading && (
            <span style={{ fontSize: '0.75rem', color: '#8BA7BE', fontWeight: 500 }}>
              {payments.length} résultat{payments.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading && payments.length === 0 ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        ) : payments.length > 0 ? (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Patient</th>
                    <th>Montant</th>
                    <th>Méthode</th>
                    <th>Payeur</th>
                    <th style={{ textAlign: 'center' }}>Séance</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const method = METHOD_CHIPS.find(m => m.value === payment.payment_method);
                    const payer = PAYER_CHIPS.find(p => p.value === payment.payer_type);
                    return (
                      <tr key={payment.id}>
                        {/* Date */}
                        <td>
                          <div style={{ fontWeight: 700, color: '#0F2A3F', fontSize: '0.875rem' }}>
                            {fmtDate(payment.payment_date)}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#8BA7BE', marginTop: 2 }}>
                            {fmtTime(payment.payment_date)}
                          </div>
                        </td>

                        {/* Patient */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <div className="patient-avatar" style={{ width: 34, height: 34, borderRadius: 10, fontSize: '0.75rem' }}>
                              {payment.patient?.first_name?.[0]}{payment.patient?.last_name?.[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0F2A3F', fontSize: '0.875rem' }}>
                                {payment.patient?.first_name} {payment.patient?.last_name}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#8BA7BE' }}>
                                {payment.patient?.phone_primary}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Montant */}
                        <td>
                          <span style={{
                            fontWeight: 800, fontSize: '1rem', color: '#059669',
                            letterSpacing: '-0.02em',
                          }}>
                            +{fmtMAD(payment.amount)}
                          </span>
                        </td>

                        {/* Méthode */}
                        <td>
                          <span className={`badge ${method?.badge || 'badge-neutral'}`}>
                            {method?.emoji} {method?.label || payment.payment_method}
                          </span>
                        </td>

                        {/* Payeur */}
                        <td>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4A6580' }}>
                            {payer?.emoji} {payer?.label || payment.payer_type}
                          </span>
                        </td>

                        {/* Séance */}
                        <td style={{ textAlign: 'center' }}>
                          {payment.session_id
                            ? <span className="badge badge-primary"><Check style={{ width: 11, height: 11 }} /> Oui</span>
                            : <span style={{ color: '#CBD5E1', fontSize: '0.875rem' }}>—</span>}
                        </td>

                        {/* Actions */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.375rem' }}>
                            <ActionBtn
                              title="Imprimer le reçu PDF"
                              onClick={() => generateInvoicePDF(payment, cabinetInfo)}
                              hoverColor="#0891B2" hoverBg="#F0FDFF"
                            >
                              <FileText style={{ width: 15, height: 15 }} />
                            </ActionBtn>
                            <ActionBtn
                              title="Modifier"
                              onClick={() => handleEdit(payment)}
                              hoverColor="#0891B2" hoverBg="#F0FDFF"
                            >
                              <Pencil style={{ width: 15, height: 15 }} />
                            </ActionBtn>
                            <ActionBtn
                              title="Supprimer"
                              onClick={() => handleDelete(payment.id)}
                              hoverColor="#DC2626" hoverBg="#FEF2F2"
                            >
                              <Trash2 style={{ width: 15, height: 15 }} />
                            </ActionBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                padding: '1rem 1.5rem', borderTop: '1px solid #E0EEF2',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#F8FAFC',
              }}>
                <span style={{ fontSize: '0.8125rem', color: '#8BA7BE', fontWeight: 500 }}>
                  Page {page} sur {totalPages}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary btn-sm">
                    <ChevronLeft style={{ width: 14, height: 14 }} /> Précédent
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-secondary btn-sm">
                    Suivant <ChevronRight style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state" style={{ padding: '4rem 2rem' }}>
            <CreditCard />
            <h3>Aucun paiement trouvé</h3>
            <p>Commencez par ajouter un encaissement pour qu'il apparaisse ici.</p>
            <button onClick={() => { resetModal(); setIsModalOpen(true); }} className="btn btn-primary" style={{ marginTop: '0.75rem' }}>
              <Plus style={{ width: 16, height: 16 }} /> Enregistrer un paiement
            </button>
          </div>
        )}
      </div>

      {/* ===== MODAL PAIEMENT ===== */}
      {isModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-container animate-slide-up" style={{ maxWidth: 540 }}>

            {/* Header gradient teal */}
            <div className="modal-header-teal">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                  {isEditMode ? '✏️ Modifier le Paiement' : '💳 Enregistrer un Paiement'}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
                  {isEditMode ? 'Modifiez les informations de cet encaissement.' : 'Ajoutez un encaissement manuel pour un patient.'}
                </p>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); resetModal(); }}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.20)',
                  borderRadius: 10, padding: 8, cursor: 'pointer', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                aria-label="Fermer"
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            {/* Corps formulaire */}
            <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1.5rem' }}>
              <form id="pay-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {error && (
                  <div className="alert alert-danger">
                    <AlertCircle style={{ width: 17, height: 17, flexShrink: 0 }} /> {error}
                  </div>
                )}

                {/* ── Patient ── */}
                <div>
                  <div className="form-section-header">
                    <div className="form-section-icon teal"><User style={{ width: 13, height: 13 }} /></div>
                    <span className="form-section-label">Patient *</span>
                    <div className="form-section-line" />
                  </div>
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou téléphone..."
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    className="form-input"
                    style={{ marginBottom: patientSearch ? 8 : 0 }}
                  />
                  {patientSearch && (
                    <div style={{
                      border: '1px solid #E0EEF2', borderRadius: 12,
                      background: '#fff', boxShadow: '0 8px 20px rgba(14,116,144,0.12)',
                      maxHeight: 180, overflowY: 'auto',
                    }}>
                      {filteredPatients.slice(0, 8).map(p => (
                        <button
                          key={p.id} type="button"
                          onClick={() => { setFormData(f => ({ ...f, patient_id: p.id })); setPatientSearch(`${p.first_name} ${p.last_name}`); }}
                          style={{
                            width: '100%', textAlign: 'left', padding: '0.625rem 1rem',
                            background: formData.patient_id === p.id ? '#F0FDFF' : 'transparent',
                            border: 'none', borderBottom: '1px solid #F1F5F9',
                            cursor: 'pointer', fontSize: '0.875rem',
                            display: 'flex', alignItems: 'center', gap: '0.625rem',
                            fontFamily: 'var(--font-sans)', transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F0FDFF'}
                          onMouseLeave={e => e.currentTarget.style.background = formData.patient_id === p.id ? '#F0FDFF' : 'transparent'}
                        >
                          <div className="patient-avatar" style={{ width: 30, height: 30, borderRadius: 8, fontSize: '0.72rem' }}>
                            {p.first_name[0]}{p.last_name[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0F2A3F' }}>{p.first_name} {p.last_name}</div>
                            {p.phone_primary && <div style={{ fontSize: '0.72rem', color: '#8BA7BE' }}>{p.phone_primary}</div>}
                          </div>
                          {formData.patient_id === p.id && <Check style={{ width: 14, height: 14, color: '#06B6D4', marginLeft: 'auto' }} />}
                        </button>
                      ))}
                      {filteredPatients.length === 0 && (
                        <div style={{ padding: '0.875rem', textAlign: 'center', fontSize: '0.875rem', color: '#8BA7BE' }}>
                          Aucun patient trouvé
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Montant + Date ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div className="form-group">
                    <label className="form-label">Montant (MAD) *</label>
                    <div style={{ position: 'relative' }}>
                      <DollarSign style={{
                        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                        width: 16, height: 16, color: '#06B6D4',
                      }} />
                      <input
                        type="number" required min="0" step="0.01"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                        className="form-input"
                        style={{ paddingLeft: '2.25rem', fontWeight: 800, fontSize: '1rem', color: '#059669' }}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date" required
                      value={formData.payment_date}
                      onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* ── Méthode de paiement — chips ── */}
                <div>
                  <div className="form-section-header">
                    <div className="form-section-icon green"><Banknote style={{ width: 13, height: 13 }} /></div>
                    <span className="form-section-label">Méthode de Paiement</span>
                    <div className="form-section-line" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                    {METHOD_CHIPS.map(m => (
                      <button
                        key={m.value} type="button"
                        onClick={() => setFormData(f => ({ ...f, payment_method: m.value }))}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.625rem',
                          padding: '0.75rem 1rem', borderRadius: 12, cursor: 'pointer',
                          border: formData.payment_method === m.value ? '1.5px solid #06B6D4' : '1.5px solid #E0EEF2',
                          background: formData.payment_method === m.value
                            ? 'linear-gradient(135deg, #F0FDFF, #ECFDF5)'
                            : '#F8FAFC',
                          boxShadow: formData.payment_method === m.value ? '0 0 0 3px rgba(6,182,212,0.12)' : 'none',
                          transition: 'all 0.2s', fontFamily: 'var(--font-sans)',
                        }}
                      >
                        <span style={{ fontSize: '1.125rem' }}>{m.emoji}</span>
                        <span style={{
                          fontSize: '0.875rem', fontWeight: 600,
                          color: formData.payment_method === m.value ? '#0891B2' : '#4A6580',
                        }}>{m.label}</span>
                        {formData.payment_method === m.value && (
                          <Check style={{ width: 14, height: 14, color: '#06B6D4', marginLeft: 'auto' }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Type de payeur — chips ── */}
                <div>
                  <div className="form-section-header">
                    <div className="form-section-icon purple"><Shield style={{ width: 13, height: 13 }} /></div>
                    <span className="form-section-label">Type de Payeur</span>
                    <div className="form-section-line" />
                  </div>
                  <div className="coverage-chips">
                    {PAYER_CHIPS.map(p => (
                      <button
                        key={p.value} type="button"
                        onClick={() => setFormData(f => ({ ...f, payer_type: p.value }))}
                        className={`coverage-chip ${formData.payer_type === p.value ? 'selected' : ''}`}
                      >
                        <span className="coverage-chip-emoji">{p.emoji}</span>
                        <div className="coverage-chip-info">
                          <span className="coverage-chip-label">{p.label}</span>
                          <span className="coverage-chip-desc">{p.desc}</span>
                        </div>
                        {formData.payer_type === p.value && (
                          <Check style={{ width: 14, height: 14, color: '#06B6D4', marginLeft: 'auto', flexShrink: 0 }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Notes ── */}
                <div className="form-group">
                  <label className="form-label">Notes / Référence (Optionnel)</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    placeholder="Numéro de chèque, référence virement..."
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
              <button type="submit" form="pay-form" disabled={saving} className="btn btn-accent" style={{ minWidth: 175 }}>
                {saving ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="spinner spinner-sm" /> Enregistrement...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard style={{ width: 16, height: 16 }} />
                    {isEditMode ? 'Sauvegarder' : 'Enregistrer le paiement'}
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

/* Composant bouton action tableau */
function ActionBtn({ children, title, onClick, hoverColor, hoverBg }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 32, height: 32, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1.5px solid #E0EEF2', background: '#F8FAFC',
        color: '#8BA7BE', cursor: 'pointer', transition: 'all 0.18s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = hoverColor;
        e.currentTarget.style.background = hoverBg;
        e.currentTarget.style.color = hoverColor;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#E0EEF2';
        e.currentTarget.style.background = '#F8FAFC';
        e.currentTarget.style.color = '#8BA7BE';
      }}
    >
      {children}
    </button>
  );
}
