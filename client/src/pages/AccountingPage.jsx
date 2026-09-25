import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Wallet,
  Plus, Trash2, X, AlertCircle, ChevronLeft, ChevronRight,
  Check, PieChart, Banknote, BarChart3, Pencil, Activity, CreditCard,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart as RechartsPie, Pie, Cell,
} from 'recharts';
import api from '../api/axios';
import { usePageTitle } from '../hooks/usePageTitle';
import { useLanguage } from '../context/LanguageContext';

const PIE_COLORS = ['#0891B2', '#059669', '#D97706', '#DC2626', '#8B5CF6', '#EC4899', '#F59E0B', '#64748B'];

export default function AccountingPage() {
  const { t, language } = useLanguage();
  usePageTitle(t('accountingTitle'));

  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('this_month');

  // Data
  const [summary, setSummary] = useState({ income: 0, expense: 0, net_profit: 0, session_count: 0, avg_ticket: 0, recovery_rate: 0 });
  const [expenses, setExpenses] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [expPage, setExpPage] = useState(1);
  const [expTotalPages, setExpTotalPages] = useState(1);
  const [revPage, setRevPage] = useState(1);
  const [revTotalPages, setRevTotalPages] = useState(1);

  // Form options translated dynamically
  const CATEGORY_CHIPS = [
    { value: 'loyer',                emoji: '🏠', label: t('catRent'),        badge: 'badge-info'    },
    { value: 'salaires',             emoji: '👥', label: t('catSalaries'),    badge: 'badge-danger'  },
    { value: 'materiel',             emoji: '🔬', label: t('catEquipment'),   badge: 'badge-purple'  },
    { value: 'fournitures_medicales',emoji: '🩺', label: t('catConsumables'), badge: 'badge-primary' },
    { value: 'electricite_eau',      emoji: '⚡', label: t('catServices'),    badge: 'badge-warning' },
    { value: 'maintenance',          emoji: '🔧', label: t('catEquipment'),   badge: 'badge-neutral' },
    { value: 'labo_prothese',        emoji: '🦷', label: t('catLab'),         badge: 'badge-teal'    },
    { value: 'autres',               emoji: '📝', label: t('catOther'),       badge: 'badge-neutral' },
  ];

  const FREQ_OPTIONS = [
    { value: 'ponctuelle', label: t('freqOnce'),    desc: t('freqOnceDesc') },
    { value: 'mensuelle',  label: t('freqMonthly'), desc: t('freqMonthlyDesc') },
    { value: 'annuelle',   label: t('freqYearly'),  desc: t('freqYearlyDesc') },
  ];

  const PERIOD_OPTIONS = [
    { value: 'this_month',   label: t('thisMonth') },
    { value: 'last_month',   label: t('lastMonth') },
    { value: 'this_quarter', label: t('thisQuarter') },
    { value: 'this_year',    label: t('thisYear') },
  ];

  const METHOD_LABELS = {
    especes: language === 'ar' ? '💵 نقداً' : '💵 Espèces',
    virement: language === 'ar' ? '🏦 تحويل بنكي' : '🏦 Virement',
    cheque: language === 'ar' ? '📄 شيك' : '📄 Chèque',
    assurance: language === 'ar' ? '🛡️ تأمين' : '🛡️ Assurance',
  };

  const fmtMAD = (v) => {
    const val = parseFloat(v || 0);
    if (language === 'ar') {
      return `${val.toLocaleString('ar-MA', { minimumFractionDigits: 2 })} د.م.`;
    }
    return `${val.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD`;
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-MA', { day: '2-digit', month: 'short', year: 'numeric' });

  const getCatChip = (val) => CATEGORY_CHIPS.find(c => c.value === val);

  const EMPTY_FORM = {
    category: 'autres',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    frequency: 'ponctuelle',
  };

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, expRes, revRes, chartRes, catRes] = await Promise.all([
        api.get(`/accounting/summary?period=${period}`),
        api.get(`/accounting/expenses?page=${expPage}&limit=15&period=${period}`),
        api.get(`/accounting/revenue?page=${revPage}&limit=15&period=${period}`),
        api.get('/accounting/chart?months=6'),
        api.get(`/accounting/categories?period=${period}`),
      ]);
      setSummary(sumRes.data.data);
      setExpenses(expRes.data.data);
      setExpTotalPages(expRes.data.pagination.pages);
      setRevenue(revRes.data.data);
      setRevTotalPages(revRes.data.pagination.pages);
      setChartData(chartRes.data.data);
      setCategories(catRes.data.data);
    } catch (err) {
      console.error('Erreur chargement comptabilité:', err);
    } finally {
      setLoading(false);
    }
  }, [period, expPage, revPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) {
      setError(language === 'ar' ? 'الرجاء ملء الحقول الإجبارية.' : 'Veuillez remplir les champs obligatoires.');
      return;
    }
    setSaving(true); setError('');
    try {
      if (isEditMode && editId) {
        await api.put(`/accounting/expenses/${editId}`, formData);
      } else {
        await api.post('/accounting/expenses', formData);
      }
      setIsModalOpen(false); resetModal(); fetchData();
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'حدث خطأ أثناء الحفظ.' : "Erreur lors de l'enregistrement."));
    } finally { setSaving(false); }
  };

  const handleEdit = (expense) => {
    setFormData({
      category: expense.category,
      description: expense.description || '',
      amount: expense.amount,
      expense_date: expense.expense_date?.split('T')[0] || '',
      frequency: expense.frequency || 'ponctuelle',
    });
    setEditId(expense.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const confirmMsg = language === 'ar' ? 'هل أنت تأكد من حذف هذا المصروف؟' : 'Voulez-vous vraiment supprimer cette dépense ?';
    if (!window.confirm(confirmMsg)) return;
    try {
      await api.delete(`/accounting/expenses/${id}`);
      fetchData();
    } catch (err) {
      alert(language === 'ar' ? 'خطأ أثناء الحذف.' : 'Erreur lors de la suppression.');
    }
  };

  const resetModal = () => { setFormData(EMPTY_FORM); setError(''); setIsEditMode(false); setEditId(null); };

  const isProfit = summary.net_profit >= 0;
  const profitPct = summary.income > 0 ? Math.round((summary.net_profit / summary.income) * 100) : 0;
  const totalExpenseCategories = categories.reduce((sum, c) => sum + c.total, 0);

  /* Tooltip Recharts */
  function ChartTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(255,255,255,0.97)', border: '1px solid #A5F3FC',
          borderRadius: 10, padding: '0.625rem 0.875rem',
          boxShadow: '0 4px 16px rgba(6,182,212,0.15)',
        }}>
          <p style={{ fontSize: '0.75rem', color: '#8BA7BE', marginBottom: 4 }}>{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ fontSize: '0.8125rem', fontWeight: 700, color: p.color }}>
              {p.name} : {fmtMAD(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('accountingTitle')}</h1>
          <p className="page-description">{t('accountingSubtitle')}</p>
        </div>
        <button onClick={() => { resetModal(); setIsModalOpen(true); }} className="btn btn-primary">
          <Plus style={{ width: 16, height: 16 }} /> {t('addExpense')}
        </button>
      </div>

      {/* Filtre par période */}
      <div className="period-selector">
        {PERIOD_OPTIONS.map(p => (
          <button
            key={p.value}
            onClick={() => { setPeriod(p.value); setExpPage(1); setRevPage(1); }}
            className={`period-btn ${period === p.value ? 'active' : ''}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Onglets */}
      <div className="tabs-container">
        {[
          { key: 'overview', icon: <BarChart3 style={{ width: 16, height: 16 }} />, label: t('tabOverview') },
          { key: 'expenses', icon: <TrendingDown style={{ width: 16, height: 16 }} />, label: t('tabExpenses') },
          { key: 'revenue',  icon: <TrendingUp style={{ width: 16, height: 16 }} />, label: t('tabRevenue') },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── KPI Cards ── */}
      <div className="stat-cards">
        <div className="stat-card" style={{ '--gradient-start': '#10B981', '--gradient-end': '#059669' }}>
          <div className="stat-info">
            <span className="stat-label">{t('kpiRevenue')}</span>
            <span className="stat-value" style={{ fontSize: '1.375rem', color: '#059669' }}>{fmtMAD(summary.income)}</span>
            <span className="stat-trend">{t('kpiRevenueDesc')}</span>
          </div>
          <div className="stat-icon green"><TrendingUp style={{ width: 22, height: 22 }} /></div>
        </div>

        <div className="stat-card" style={{ '--gradient-start': '#F43F5E', '--gradient-end': '#DC2626' }}>
          <div className="stat-info">
            <span className="stat-label">{t('kpiExpenses')}</span>
            <span className="stat-value" style={{ fontSize: '1.375rem', color: 'var(--color-danger)' }}>{fmtMAD(summary.expense)}</span>
            <span className="stat-trend" style={{ color: 'var(--color-danger)' }}>{t('kpiExpensesDesc')}</span>
          </div>
          <div className="stat-icon rose"><TrendingDown style={{ width: 22, height: 22 }} /></div>
        </div>

        <div className="stat-card" style={{ '--gradient-start': isProfit ? '#3B82F6' : '#EF4444', '--gradient-end': isProfit ? '#1D4ED8' : '#DC2626' }}>
          <div className="stat-info">
            <span className="stat-label">{t('kpiNetProfit')}</span>
            <span className="stat-value" style={{ fontSize: '1.375rem', color: isProfit ? 'var(--color-info)' : 'var(--color-danger)' }}>
              {isProfit ? '+' : ''}{fmtMAD(summary.net_profit)}
            </span>
            <span className="stat-trend" style={{ color: isProfit ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {t('kpiMargin')} : {profitPct}%
            </span>
          </div>
          <div className={`stat-icon ${isProfit ? 'blue' : 'rose'}`}><Wallet style={{ width: 22, height: 22 }} /></div>
        </div>

        <div className="stat-card" style={{ '--gradient-start': '#06B6D4', '--gradient-end': '#0891B2' }}>
          <div className="stat-info">
            <span className="stat-label">{t('kpiSessions')}</span>
            <span className="stat-value" style={{ fontSize: '1.875rem', color: 'var(--color-info)' }}>{summary.session_count}</span>
            <span className="stat-trend">{t('kpiAvgTicket')} : {fmtMAD(summary.avg_ticket)}</span>
          </div>
          <div className="stat-icon teal"><Activity style={{ width: 22, height: 22 }} /></div>
        </div>

        <div className="stat-card" style={{ '--gradient-start': '#8B5CF6', '--gradient-end': '#6D28D9' }}>
          <div className="stat-info">
            <span className="stat-label">{t('kpiExpenseRatio')}</span>
            <span className="stat-value" style={{ fontSize: '1.875rem', color: '#7C3AED' }}>
              {summary.income > 0 ? `${Math.round((summary.expense / summary.income) * 100)}%` : '—'}
            </span>
            {summary.income > 0 && (
              <div style={{ marginTop: '0.5rem', width: '100%' }}>
                <div style={{ height: 6, borderRadius: 99, background: '#EDE9FE', overflow: 'hidden' }}>
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

        <div className="stat-card" style={{ '--gradient-start': '#F59E0B', '--gradient-end': '#D97706' }}>
          <div className="stat-info">
            <span className="stat-label">{t('kpiRecovery')}</span>
            <span className="stat-value" style={{ fontSize: '1.875rem', color: 'var(--color-warning)' }}>{summary.recovery_rate}%</span>
            <span className="stat-trend">{t('kpiRecoveryDesc')}</span>
          </div>
          <div className="stat-icon orange"><CreditCard style={{ width: 22, height: 22 }} /></div>
        </div>
      </div>

      {/* === TAB : VUE D'ENSEMBLE === */}
      {activeTab === 'overview' && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {/* Graphique Barres : Recettes vs Charges */}
          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="card-title">
                <BarChart3 style={{ width: 18, height: 18, color: 'var(--color-primary-500)' }} />
                {t('chartRevenueVsExpenses')}
              </h3>
            </div>
            <div className="chart-card-body">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0EEF2" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8BA7BE', fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8BA7BE' }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? '0' : `${(v/1000).toFixed(0)}k`} width={36} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem', fontWeight: 600 }} />
                  <Bar dataKey="income" name={t('tabRevenue')} fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name={t('tabExpenses')} fill="#DC2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Camembert : Répartition des charges */}
          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="card-title">
                <PieChart style={{ width: 18, height: 18, color: '#8B5CF6' }} />
                {t('chartExpenseBreakdown')}
              </h3>
            </div>
            <div className="chart-card-body" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {categories.length > 0 ? (
                <>
                  <ResponsiveContainer width="50%" height={220}>
                    <RechartsPie>
                      <Pie
                        data={categories}
                        dataKey="total"
                        nameKey="category"
                        cx="50%" cy="50%"
                        outerRadius={85}
                        innerRadius={45}
                        paddingAngle={2}
                      >
                        {categories.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={v => fmtMAD(v)} />
                    </RechartsPie>
                  </ResponsiveContainer>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {categories.map((cat, i) => {
                      const chip = getCatChip(cat.category);
                      const pct = totalExpenseCategories > 0 ? Math.round((cat.total / totalExpenseCategories) * 100) : 0;
                      return (
                        <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0F2A3F', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {chip?.emoji} {chip?.label || cat.category}
                          </span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8BA7BE' }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="empty-state" style={{ width: '100%', padding: '2rem' }}>
                  <PieChart style={{ width: 40, height: 40 }} />
                  <p>{t('noExpenseForPeriod')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === TAB : CHARGES === */}
      {activeTab === 'expenses' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--color-surface-2)',
          }}>
            <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.9375rem' }}>
              {t('expenseHistory')}
            </span>
            {!loading && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                {expenses.length} {language === 'ar' ? 'عنصر' : `entrée${expenses.length !== 1 ? 's' : ''}`}
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
                      <th>{t('colDate')}</th>
                      <th>{t('colCategory')}</th>
                      <th>{t('colDescription')}</th>
                      <th>{t('colFrequency')}</th>
                      <th>{t('colAmount')}</th>
                      <th style={{ textAlign: language === 'ar' ? 'left' : 'right' }}>{t('colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => {
                      const cat = getCatChip(expense.category);
                      const freq = FREQ_OPTIONS.find(f => f.value === expense.frequency);
                      return (
                        <tr key={expense.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                              {fmtDate(expense.expense_date)}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${cat?.badge || 'badge-neutral'}`}>
                              {cat?.emoji} {cat?.label || expense.category}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.8125rem', color: 'var(--color-text-secondary)',
                              fontStyle: expense.description ? 'normal' : 'italic',
                            }}>
                              {expense.description || '—'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                              {freq?.label || expense.frequency}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              fontWeight: 800, fontSize: '0.9375rem', color: 'var(--color-danger)',
                              letterSpacing: '-0.02em',
                            }}>
                              -{fmtMAD(expense.amount)}
                            </span>
                          </td>
                          <td style={{ textAlign: language === 'ar' ? 'left' : 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: language === 'ar' ? 'flex-start' : 'flex-end', gap: '0.375rem' }}>
                              <button
                                onClick={() => handleEdit(expense)}
                                className="btn btn-secondary btn-sm"
                                title={t('edit')}
                              >
                                <Pencil style={{ width: 13, height: 13 }} />
                              </button>
                              <button
                                onClick={() => handleDelete(expense.id)}
                                className="btn btn-danger btn-sm"
                                title={t('delete')}
                              >
                                <Trash2 style={{ width: 13, height: 13 }} />
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
              {expTotalPages > 1 && (
                <div style={{
                  padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--color-surface-2)',
                }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    {t('pageInfo', { page: expPage, totalPages: expTotalPages })}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setExpPage(p => Math.max(1, p - 1))} disabled={expPage === 1} className="btn btn-secondary btn-sm">
                      <ChevronLeft style={{ width: 14, height: 14 }} /> {t('btnPrev')}
                    </button>
                    <button onClick={() => setExpPage(p => Math.min(expTotalPages, p + 1))} disabled={expPage === expTotalPages} className="btn btn-secondary btn-sm">
                      {t('btnNext')} <ChevronRight style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state" style={{ padding: '4rem 2rem' }}>
              <Banknote />
              <h3>{t('noExpensesFound')}</h3>
              <p>{t('noExpensesPrompt')}</p>
              <button onClick={() => { resetModal(); setIsModalOpen(true); }} className="btn btn-primary" style={{ marginTop: '0.75rem' }}>
                <Plus style={{ width: 16, height: 16 }} /> {t('addExpense')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* === TAB : RECETTES === */}
      {activeTab === 'revenue' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--color-surface-2)',
          }}>
            <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.9375rem' }}>
              {t('revenueHistory')}
            </span>
            {!loading && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                {revenue.length} {language === 'ar' ? 'عملية دفع' : `paiement${revenue.length !== 1 ? 's' : ''}`}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
              <div className="spinner" />
            </div>
          ) : revenue.length > 0 ? (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('colDate')}</th>
                      <th>{t('colPatient')}</th>
                      <th>{t('colMethod')}</th>
                      <th>{t('colAmount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenue.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                            {fmtDate(p.payment_date)}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {p.patient ? `${p.patient.first_name} ${p.patient.last_name}` : '—'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                            {METHOD_LABELS[p.payment_method] || p.payment_method}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontWeight: 800, fontSize: '0.9375rem', color: 'var(--color-success)',
                            letterSpacing: '-0.02em',
                          }}>
                            +{fmtMAD(p.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {revTotalPages > 1 && (
                <div style={{
                  padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--color-surface-2)',
                }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    {t('pageInfo', { page: revPage, totalPages: revTotalPages })}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setRevPage(p => Math.max(1, p - 1))} disabled={revPage === 1} className="btn btn-secondary btn-sm">
                      <ChevronLeft style={{ width: 14, height: 14 }} /> {t('btnPrev')}
                    </button>
                    <button onClick={() => setRevPage(p => Math.min(revTotalPages, p + 1))} disabled={revPage === revTotalPages} className="btn btn-secondary btn-sm">
                      {t('btnNext')} <ChevronRight style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state" style={{ padding: '4rem 2rem' }}>
              <Banknote />
              <h3>{language === 'ar' ? 'لا توجد إيرادات مسجلة' : 'Aucune recette enregistrée'}</h3>
            </div>
          )}
        </div>
      )}

      {/* ===== MODAL AJOUT / ÉDITION CHARGE ===== */}
      {isModalOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container animate-slide-up" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>

            {/* Header gradient */}
            <div style={{
              background: 'linear-gradient(135deg, #0F2A3F 0%, #1E3A5F 50%, #DC2626 100%)',
              padding: '1.375rem 1.5rem',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                  {isEditMode ? t('modalEditExpenseTitle') : t('modalAddExpenseTitle')}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
                  {isEditMode ? t('modalEditExpenseSubtitle') : t('modalAddExpenseSubtitle')}
                </p>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); resetModal(); }}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.20)',
                  borderRadius: 10, padding: 8, cursor: 'pointer', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                aria-label={t('close')}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            {/* Corps formulaire */}
            <div className="modal-body">
              <form id="exp-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {error && (
                  <div className="alert alert-danger">
                    <AlertCircle style={{ width: 17, height: 17, flexShrink: 0 }} /> {error}
                  </div>
                )}

                {/* Montant + Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div className="form-group">
                    <label className="form-label">{t('lblAmount')}</label>
                    <div style={{ position: 'relative' }}>
                      <TrendingDown style={{
                        position: 'absolute', left: language === 'ar' ? 'auto' : 12, right: language === 'ar' ? 12 : 'auto', top: '50%', transform: 'translateY(-50%)',
                        width: 16, height: 16, color: 'var(--color-danger)',
                      }} />
                      <input
                        type="number" required min="0" step="0.01"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                        className="form-input"
                        style={{ paddingLeft: language === 'ar' ? '1rem' : '2.25rem', paddingRight: language === 'ar' ? '2.25rem' : '1rem', fontWeight: 800, fontSize: '1rem', color: 'var(--color-danger)' }}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('lblDate')}</label>
                    <input
                      type="date" required
                      value={formData.expense_date}
                      onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Catégorie — chips */}
                <div>
                  <div className="form-section-header">
                    <div className="form-section-icon rose"><PieChart style={{ width: 13, height: 13 }} /></div>
                    <span className="form-section-label">{t('lblCategory')}</span>
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

                {/* Fréquence */}
                <div>
                  <div className="form-section-header">
                    <div className="form-section-icon orange">
                      <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>Hz</span>
                    </div>
                    <span className="form-section-label">{t('lblFrequency')}</span>
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
                          border: formData.frequency === f.value ? '1.5px solid var(--color-primary-400)' : '1.5px solid var(--color-border)',
                          background: formData.frequency === f.value
                            ? 'linear-gradient(135deg, var(--color-primary-50), #ECFDF5)' : 'var(--color-surface-2)',
                          boxShadow: formData.frequency === f.value ? '0 0 0 3px rgba(6,182,212,0.12)' : 'none',
                          transition: 'all 0.2s', fontFamily: 'var(--font-sans)',
                          gap: '0.25rem',
                        }}
                      >
                        <span style={{
                          fontSize: '0.875rem', fontWeight: 700,
                          color: formData.frequency === f.value ? 'var(--color-info)' : 'var(--color-text-primary)',
                        }}>{f.label}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{f.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">{t('lblDescription')}</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder={t('phDescription')}
                    className="form-input"
                    style={{ resize: 'none' }}
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button type="button" onClick={() => { setIsModalOpen(false); resetModal(); }} className="btn btn-secondary">
                {t('btnCancel')}
              </button>
              <button type="submit" form="exp-form" disabled={saving} className="btn btn-danger" style={{ minWidth: 170 }}>
                {saving ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="spinner spinner-sm" /> {t('savingState')}
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingDown style={{ width: 16, height: 16 }} /> {isEditMode ? t('btnUpdateExpense') : t('btnSaveExpense')}
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
