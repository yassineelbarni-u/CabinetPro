import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Wallet,
  Plus, Trash2, X, AlertCircle, ChevronLeft, ChevronRight,
  Check, PieChart, Banknote,
} from 'lucide-react';
import api from '../api/axios';
import { usePageTitle } from '../hooks/usePageTitle';

/* ───────── Catégories — chips avec émojis ───────── */
const CATEGORY_CHIPS = [
  { value: 'loyer',                emoji: '🏠', label: 'Loyer',               badge: 'badge-info'    },
  { value: 'salaires',             emoji: '👥', label: 'Salaires',            badge: 'badge-danger'  },
  { value: 'materiel',             emoji: '🔬', label: 'Matériel médical',    badge: 'badge-purple'  },
  { value: 'fournitures_medicales',emoji: '🩺', label: 'Fournitures',         badge: 'badge-primary' },
  { value: 'electricite_eau',      emoji: '⚡', label: 'Électricité / Eau',   badge: 'badge-warning' },
  { value: 'maintenance',          emoji: '🔧', label: 'Maintenance',         badge: 'badge-neutral' },
  { value: 'loyer_materiel',       emoji: '📦', label: 'Location Matériel',   badge: 'badge-teal'    },
  { value: 'autres',               emoji: '📝', label: 'Autres frais',        badge: 'badge-neutral' },
];

/* ───────── Fréquence — mini chips ───────── */
const FREQ_OPTIONS = [
  { value: 'ponctuelle', label: 'Ponctuelle', desc: 'Une seule fois' },
  { value: 'mensuelle',  label: 'Mensuelle',  desc: 'Chaque mois'    },
  { value: 'variable',   label: 'Variable',   desc: 'Irrégulière'    },
];

const fmtMAD = (v) =>
  `${parseFloat(v || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD`;

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' });

const getCatChip = (val) => CATEGORY_CHIPS.find(c => c.value === val);

const EMPTY_FORM = {
  category: 'autres',
  description: '',
  amount: '',
  expense_date: new Date().toISOString().split('T')[0],
  frequency: 'ponctuelle',
};

export default function AccountingPage() {
  usePageTitle('Comptabilité');
  const [summary, setSummary] = useState({ income: 0, expense: 0, net_profit: 0 });
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, expRes] = await Promise.all([
        api.get('/accounting/summary'),
        api.get(`/accounting/expenses?page=${page}&limit=15`),
      ]);
      setSummary(sumRes.data.data);
      setExpenses(expRes.data.data);
      setTotalPages(expRes.data.pagination.pages);
    } catch (err) {
      console.error('Erreur chargement comptabilité:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) { setError('Veuillez remplir les champs obligatoires.'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/accounting/expenses', formData);
      setIsModalOpen(false); resetModal(); fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette dépense ?')) return;
    try { await api.delete(`/accounting/expenses/${id}`); fetchData(); }
    catch (err) { alert('Erreur lors de la suppression.'); }
  };

  const resetModal = () => { setFormData(EMPTY_FORM); setError(''); };

  const isProfit = summary.net_profit >= 0;
  const profitPct = summary.income > 0
    ? Math.round((summary.net_profit / summary.income) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Comptabilité</h1>
          <p className="page-description">Suivez vos recettes, vos charges et calculez votre bénéfice net.</p>
        </div>
        <button onClick={() => { resetModal(); setIsModalOpen(true); }} className="btn btn-primary">
          <Plus style={{ width: 16, height: 16 }} /> Ajouter une charge
        </button>
      </div>

      {/* ── Cartes KPI ── */}
      <div className="stat-cards">
        {/* Recettes */}
        <div className="stat-card" style={{ '--gradient-start': '#10B981', '--gradient-end': '#059669' }}>
          <div className="stat-info">
            <span className="stat-label">Recettes (Mois)</span>
            <span className="stat-value" style={{ fontSize: '1.375rem', color: '#059669' }}>
              {fmtMAD(summary.income)}
            </span>
            <span className="stat-trend">Encaissements du mois</span>
          </div>
          <div className="stat-icon green"><TrendingUp style={{ width: 22, height: 22 }} /></div>
        </div>

        {/* Charges */}
        <div className="stat-card" style={{ '--gradient-start': '#F43F5E', '--gradient-end': '#DC2626' }}>
          <div className="stat-info">
            <span className="stat-label">Charges (Mois)</span>
            <span className="stat-value" style={{ fontSize: '1.375rem', color: '#DC2626' }}>
              {fmtMAD(summary.expense)}
            </span>
            <span className="stat-trend" style={{ color: '#DC2626' }}>Dépenses du mois</span>
          </div>
          <div className="stat-icon rose"><TrendingDown style={{ width: 22, height: 22 }} /></div>
        </div>

        {/* Bénéfice net */}
        <div
          className="stat-card"
          style={{
            '--gradient-start': isProfit ? '#3B82F6' : '#EF4444',
            '--gradient-end':   isProfit ? '#1D4ED8' : '#DC2626',
          }}
        >
          <div className="stat-info">
            <span className="stat-label">Bénéfice Net</span>
            <span className="stat-value" style={{
              fontSize: '1.375rem',
              color: isProfit ? '#0891B2' : '#DC2626',
            }}>
              {isProfit ? '+' : ''}{fmtMAD(summary.net_profit)}
            </span>
            <span className="stat-trend" style={{ color: isProfit ? '#059669' : '#DC2626' }}>
              Marge : {profitPct}%
            </span>
          </div>
          <div className={`stat-icon ${isProfit ? 'blue' : 'rose'}`}>
            <Wallet style={{ width: 22, height: 22 }} />
          </div>
        </div>

        {/* Ratio visuel */}
        <div className="stat-card" style={{ '--gradient-start': '#8B5CF6', '--gradient-end': '#6D28D9' }}>
          <div className="stat-info" style={{ width: '100%' }}>
            <span className="stat-label">Taux de charges</span>
            <span className="stat-value" style={{ fontSize: '1.875rem', color: '#7C3AED' }}>
              {summary.income > 0
                ? `${Math.round((summary.expense / summary.income) * 100)}%`
                : '—'}
            </span>
            {/* Barre de progression */}
            {summary.income > 0 && (
              <div style={{ marginTop: '0.625rem', width: '100%' }}>
                <div style={{
                  height: 6, borderRadius: 99, background: '#EDE9FE',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    width: `${Math.min(100, Math.round((summary.expense / summary.income) * 100))}%`,
                    background: 'linear-gradient(90deg, #8B5CF6, #6D28D9)',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            )}
          </div>
          <div className="stat-icon purple"><PieChart style={{ width: 22, height: 22 }} /></div>
        </div>
      </div>

      {/* ── Table des charges ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '1rem 1.5rem', borderBottom: '1px solid #E0EEF2',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#F8FAFC',
        }}>
          <span style={{ fontWeight: 700, color: '#0F2A3F', fontSize: '0.9375rem' }}>
            Historique des Charges
          </span>
          {!loading && (
            <span style={{ fontSize: '0.75rem', color: '#8BA7BE', fontWeight: 500 }}>
              {expenses.length} entrée{expenses.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading && expenses.length === 0 ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        ) : expenses.length > 0 ? (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Catégorie</th>
                    <th>Description</th>
                    <th>Fréquence</th>
                    <th>Montant</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => {
                    const cat = getCatChip(expense.category);
                    const freq = FREQ_OPTIONS.find(f => f.value === expense.frequency);
                    return (
                      <tr key={expense.id}>
                        {/* Date */}
                        <td>
                          <div style={{ fontWeight: 700, color: '#0F2A3F', fontSize: '0.875rem' }}>
                            {fmtDate(expense.expense_date)}
                          </div>
                        </td>

                        {/* Catégorie */}
                        <td>
                          <span className={`badge ${cat?.badge || 'badge-neutral'}`}>
                            {cat?.emoji} {cat?.label || expense.category}
                          </span>
                        </td>

                        {/* Description */}
                        <td>
                          <span style={{
                            fontSize: '0.8125rem', color: '#4A6580',
                            fontStyle: expense.description ? 'normal' : 'italic',
                          }}>
                            {expense.description || '—'}
                          </span>
                        </td>

                        {/* Fréquence */}
                        <td>
                          <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#8BA7BE' }}>
                            {freq?.label || expense.frequency}
                          </span>
                        </td>

                        {/* Montant */}
                        <td>
                          <span style={{
                            fontWeight: 800, fontSize: '0.9375rem', color: '#DC2626',
                            letterSpacing: '-0.02em',
                          }}>
                            -{fmtMAD(expense.amount)}
                          </span>
                        </td>

                        {/* Action */}
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleDelete(expense.id)}
                              title="Supprimer"
                              style={{
                                width: 32, height: 32, borderRadius: 8,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1.5px solid #E0EEF2', background: '#F8FAFC',
                                color: '#8BA7BE', cursor: 'pointer', transition: 'all 0.18s',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.borderColor = '#DC2626';
                                e.currentTarget.style.background = '#FEF2F2';
                                e.currentTarget.style.color = '#DC2626';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.borderColor = '#E0EEF2';
                                e.currentTarget.style.background = '#F8FAFC';
                                e.currentTarget.style.color = '#8BA7BE';
                              }}
                            >
                              <Trash2 style={{ width: 15, height: 15 }} />
                            </button>
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
            <Banknote />
            <h3>Aucune charge enregistrée</h3>
            <p>Ajoutez vos dépenses pour mieux suivre votre rentabilité.</p>
            <button onClick={() => { resetModal(); setIsModalOpen(true); }} className="btn btn-primary" style={{ marginTop: '0.75rem' }}>
              <Plus style={{ width: 16, height: 16 }} /> Ajouter une charge
            </button>
          </div>
        )}
      </div>

      {/* ===== MODAL AJOUT CHARGE ===== */}
      {isModalOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container animate-slide-up" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>

            {/* Header gradient teal → rose pour distinguer des paiements */}
            <div style={{
              background: 'linear-gradient(135deg, #0F2A3F 0%, #1E3A5F 50%, #DC2626 100%)',
              padding: '1.375rem 1.5rem',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                  📉 Ajouter une Charge
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
                  Enregistrez une nouvelle dépense du cabinet.
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
              <form id="exp-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {error && (
                  <div className="alert alert-danger">
                    <AlertCircle style={{ width: 17, height: 17, flexShrink: 0 }} /> {error}
                  </div>
                )}

                {/* ── Montant + Date ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div className="form-group">
                    <label className="form-label">Montant (MAD) *</label>
                    <div style={{ position: 'relative' }}>
                      <TrendingDown style={{
                        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                        width: 16, height: 16, color: '#DC2626',
                      }} />
                      <input
                        type="number" required min="0" step="0.01"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                        className="form-input"
                        style={{ paddingLeft: '2.25rem', fontWeight: 800, fontSize: '1rem', color: '#DC2626' }}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date" required
                      value={formData.expense_date}
                      onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* ── Catégorie — chips ── */}
                <div>
                  <div className="form-section-header">
                    <div className="form-section-icon rose"><PieChart style={{ width: 13, height: 13 }} /></div>
                    <span className="form-section-label">Catégorie *</span>
                    <div className="form-section-line" />
                  </div>
                  <div className="care-chips-grid">
                    {CATEGORY_CHIPS.map(cat => (
                      <button
                        key={cat.value} type="button"
                        onClick={() => setFormData(f => ({ ...f, category: cat.value }))}
                        className={`care-chip ${formData.category === cat.value ? 'selected' : ''}`}
                        title={cat.label}
                      >
                        <div className="care-chip-check">
                          <Check style={{ width: 10, height: 10, color: '#fff' }} />
                        </div>
                        <span className="care-chip-emoji">{cat.emoji}</span>
                        <span className="care-chip-label">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Fréquence ── */}
                <div>
                  <div className="form-section-header">
                    <div className="form-section-icon orange">
                      <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>Hz</span>
                    </div>
                    <span className="form-section-label">Fréquence</span>
                    <div className="form-section-line" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {FREQ_OPTIONS.map(f => (
                      <button
                        key={f.value} type="button"
                        onClick={() => setFormData(fd => ({ ...fd, frequency: f.value }))}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          padding: '0.75rem 0.5rem', borderRadius: 12, cursor: 'pointer',
                          border: formData.frequency === f.value ? '1.5px solid #06B6D4' : '1.5px solid #E0EEF2',
                          background: formData.frequency === f.value
                            ? 'linear-gradient(135deg, #F0FDFF, #ECFDF5)' : '#F8FAFC',
                          boxShadow: formData.frequency === f.value ? '0 0 0 3px rgba(6,182,212,0.12)' : 'none',
                          transition: 'all 0.2s', fontFamily: 'var(--font-sans)',
                          gap: '0.25rem',
                        }}
                      >
                        <span style={{
                          fontSize: '0.875rem', fontWeight: 700,
                          color: formData.frequency === f.value ? '#0891B2' : '#0F2A3F',
                        }}>{f.label}</span>
                        <span style={{ fontSize: '0.7rem', color: '#8BA7BE' }}>{f.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Description ── */}
                <div className="form-group">
                  <label className="form-label">Description (Optionnel)</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder="Détails de la dépense, fournisseur, référence..."
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
              <button type="submit" form="exp-form" disabled={saving} className="btn btn-danger" style={{ minWidth: 170 }}>
                {saving ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="spinner spinner-sm" /> Enregistrement...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingDown style={{ width: 16, height: 16 }} /> Ajouter la charge
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
