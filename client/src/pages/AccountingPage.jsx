import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, 
  Plus, Trash2, Calendar as CalendarIcon 
} from 'lucide-react';
import api from '../api/axios';

const CATEGORY_CONFIG = {
  'loyer': { label: 'Loyer', color: 'bg-blue-100 text-blue-700' },
  'electricite_eau': { label: 'Électricité / Eau', color: 'bg-yellow-100 text-yellow-700' },
  'materiel': { label: 'Matériel médical', color: 'bg-purple-100 text-purple-700' },
  'fournitures_medicales': { label: 'Fournitures', color: 'bg-indigo-100 text-indigo-700' },
  'salaires': { label: 'Salaires', color: 'bg-rose-100 text-rose-700' },
  'maintenance': { label: 'Maintenance', color: 'bg-orange-100 text-orange-700' },
  'autres': { label: 'Autres', color: 'bg-gray-100 text-gray-700' },
  'loyer_materiel': { label: 'Location Matériel', color: 'bg-teal-100 text-teal-700' }
};

export default function AccountingPage() {
  const [summary, setSummary] = useState({ income: 0, expense: 0, net_profit: 0 });
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: 'autres',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    frequency: 'ponctuelle'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, expRes] = await Promise.all([
        api.get('/accounting/summary'),
        api.get(`/accounting/expenses?page=${page}&limit=15`)
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) {
      setError('Veuillez remplir les champs obligatoires.');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      await api.post('/accounting/expenses', formData);
      setIsModalOpen(false);
      resetModal();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette dépense ?')) return;
    
    try {
      await api.delete(`/accounting/expenses/${id}`);
      fetchData();
    } catch (err) {
      console.error('Erreur suppression dépense', err);
      alert('Erreur lors de la suppression.');
    }
  };

  const resetModal = () => {
    setFormData({
      category: 'autres',
      description: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      frequency: 'ponctuelle'
    });
    setError('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Comptabilité</h1>
          <p className="page-description">Suivez vos recettes, vos charges et calculez votre bénéfice net.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Ajouter une charge
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Recettes (Mois)</span>
            <span className="stat-value text-emerald-600">{summary.income.toLocaleString('fr-MA')} MAD</span>
          </div>
          <div className="stat-icon green"><TrendingUp className="w-6 h-6" /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Charges (Mois)</span>
            <span className="stat-value text-rose-600">{summary.expense.toLocaleString('fr-MA')} MAD</span>
          </div>
          <div className="stat-icon red"><TrendingDown className="w-6 h-6" /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Bénéfice Net</span>
            <span className={`stat-value ${summary.net_profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
              {summary.net_profit.toLocaleString('fr-MA')} MAD
            </span>
          </div>
          <div className="stat-icon blue"><Wallet className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <h3 className="font-bold text-gray-900 text-lg">Historique des Charges</h3>
        </div>

        {loading && expenses.length === 0 ? (
          <div className="py-12 flex justify-center"><div className="spinner"></div></div>
        ) : expenses.length > 0 ? (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Catégorie</th>
                    <th>Description</th>
                    <th>Montant</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>
                        <div className="font-semibold text-gray-900">
                          {new Date(expense.expense_date).toLocaleDateString('fr-MA')}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${CATEGORY_CONFIG[expense.category]?.color || 'badge-neutral'}`}>
                          {CATEGORY_CONFIG[expense.category]?.label || expense.category}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm text-gray-600">{expense.description || '-'}</span>
                      </td>
                      <td>
                        <span className="font-bold text-rose-600">-{parseFloat(expense.amount).toLocaleString('fr-MA')} MAD</span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleDelete(expense.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <span className="text-sm text-gray-500">Page {page} sur {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary btn-sm">Précédent</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-secondary btn-sm">Suivant</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state py-16">
            <DollarSign className="!w-12 !h-12 text-gray-300" />
            <h3>Aucune charge trouvée</h3>
            <p>Ajoutez des dépenses pour mieux suivre vos finances.</p>
          </div>
        )}
      </div>

      {/* Modal Ajout Charge */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Ajouter une charge</h3>
                <p className="text-sm text-gray-500">Enregistrez une nouvelle dépense du cabinet.</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); resetModal(); }} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-200">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Montant (MAD) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm font-bold text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={e => setFormData({...formData, expense_date: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Catégorie *</label>
                <select
                  required
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl form-select-custom outline-none focus:bg-white focus:border-blue-500 transition-all text-sm"
                >
                  <option value="loyer">Loyer</option>
                  <option value="salaires">Salaires</option>
                  <option value="materiel">Matériel médical</option>
                  <option value="fournitures_medicales">Fournitures médicales</option>
                  <option value="electricite_eau">Électricité / Eau / Internet</option>
                  <option value="maintenance">Maintenance & Réparations</option>
                  <option value="loyer_materiel">Location de matériel</option>
                  <option value="autres">Autres frais</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Description (Optionnel)</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  rows="2"
                  placeholder="Détails de la dépense..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm resize-none"
                ></textarea>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button type="button" onClick={() => { setIsModalOpen(false); resetModal(); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button type="submit" onClick={handleSubmit} disabled={saving} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Enregistrement...' : 'Ajouter la charge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
