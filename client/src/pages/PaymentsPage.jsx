import { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, Plus, Search, Calendar as CalendarIcon, 
  Trash2, FileText, User, DollarSign, TrendingUp, Pencil 
} from 'lucide-react';
import api from '../api/axios';
import { generateInvoicePDF } from '../utils/invoiceGenerator';

const METHOD_CONFIG = {
  'especes': { label: 'Espèces', color: 'bg-emerald-100 text-emerald-700' },
  'virement': { label: 'Virement', color: 'bg-blue-100 text-blue-700' },
  'cheque': { label: 'Chèque', color: 'bg-purple-100 text-purple-700' },
  'assurance': { label: 'Assurance', color: 'bg-orange-100 text-orange-700' },
};

const PAYER_CONFIG = {
  'patient': 'Patient',
  'cnss': 'CNSS',
  'cnops': 'CNOPS',
  'mutuelle': 'Mutuelle Privée',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cabinetInfo, setCabinetInfo] = useState({});
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [allPatients, setAllPatients] = useState([]);
  const [formData, setFormData] = useState({
    patient_id: '',
    amount: '',
    payment_method: 'especes',
    payer_type: 'patient',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Build query string
      const queryParams = new URLSearchParams({
        page,
        limit: 15,
        ...(search && { search }),
        ...(filterMethod && { method: filterMethod })
      });

      const [payRes, statRes, patRes] = await Promise.all([
        api.get(`/payments?${queryParams}`),
        api.get('/payments/stats'),
        api.get('/patients?limit=1000') // For the dropdown in modal
      ]);

      setPayments(payRes.data.data);
      setTotalPages(payRes.data.pagination.pages);
      setStats(statRes.data.data);
      setAllPatients(patRes.data.data);
      // Fetch cabinet info for invoices (once)
      if (!cabinetInfo.name) {
        try {
          const cabRes = await api.get('/cabinet');
          setCabinetInfo(cabRes.data.data);
        } catch (_) { /* silently ignore */ }
      }
    } catch (err) {
      console.error('Erreur chargement paiements:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterMethod]);

  useEffect(() => {
    // Debounce search
    const t = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.amount) {
      setError('Veuillez remplir les champs obligatoires.');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      if (isEditMode) {
        await api.put(`/payments/${editId}`, formData);
      } else {
        await api.post('/payments', formData);
      }
      setIsModalOpen(false);
      resetModal();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (payment) => {
    setIsEditMode(true);
    setEditId(payment.id);
    setFormData({
      patient_id: payment.patient_id,
      amount: payment.amount,
      payment_method: payment.payment_method,
      payer_type: payment.payer_type,
      payment_date: new Date(payment.payment_date).toISOString().split('T')[0],
      notes: payment.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce paiement ? Cette action recalculera le solde de la consultation liée si elle existe.')) {
      return;
    }
    
    try {
      await api.delete(`/payments/${id}`);
      fetchData();
    } catch (err) {
      console.error('Erreur suppression paiement', err);
      alert('Erreur lors de la suppression.');
    }
  };

  const resetModal = () => {
    setFormData({
      patient_id: '',
      amount: '',
      payment_method: 'especes',
      payer_type: 'patient',
      payment_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsEditMode(false);
    setEditId(null);
    setError('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Paiements & Encaissements</h1>
          <p className="page-description">Gérez les recettes, suivez les encaissements et les méthodes de paiement.</p>
        </div>
        <button onClick={() => { resetModal(); setIsModalOpen(true); }} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Nouveau Paiement
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stat-cards">
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Recettes du jour</span>
              <span className="stat-value">{stats.revenue_today.toLocaleString('fr-MA')} MAD</span>
            </div>
            <div className="stat-icon green"><TrendingUp className="w-6 h-6" /></div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Recettes du mois</span>
              <span className="stat-value">{stats.revenue_month.toLocaleString('fr-MA')} MAD</span>
            </div>
            <div className="stat-icon blue"><DollarSign className="w-6 h-6" /></div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Total Annuel</span>
              <span className="stat-value">{stats.revenue_year.toLocaleString('fr-MA')} MAD</span>
            </div>
            <div className="stat-icon purple"><CalendarIcon className="w-6 h-6" /></div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Espèces (Ce mois)</span>
              <span className="stat-value">
                {stats.by_method.find(m => m.payment_method === 'especes')?.total || 0} MAD
              </span>
            </div>
            <div className="stat-icon orange"><CreditCard className="w-6 h-6" /></div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="search-bar w-full sm:max-w-md">
          <Search />
          <input
            type="text"
            placeholder="Rechercher un patient..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-full sm:w-auto">
          <select 
            value={filterMethod}
            onChange={(e) => { setFilterMethod(e.target.value); setPage(1); }}
            className="w-full form-select-custom px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
          >
            <option value="">Toutes les méthodes</option>
            <option value="especes">Espèces</option>
            <option value="virement">Virement</option>
            <option value="cheque">Chèque</option>
            <option value="assurance">Assurance</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        {loading && payments.length === 0 ? (
          <div className="py-12 flex justify-center"><div className="spinner"></div></div>
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
                    <th>Séance liée</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <div className="font-semibold text-gray-900">
                          {new Date(payment.payment_date).toLocaleDateString('fr-MA')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(payment.payment_date).toLocaleTimeString('fr-MA', { hour: '2-digit', minute:'2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div className="font-bold text-gray-900">
                          {payment.patient?.first_name} {payment.patient?.last_name}
                        </div>
                        <div className="text-xs text-gray-500">{payment.patient?.phone_primary}</div>
                      </td>
                      <td>
                        <span className="font-bold text-gray-900">{parseFloat(payment.amount).toLocaleString('fr-MA')} MAD</span>
                      </td>
                      <td>
                        <span className={`badge ${METHOD_CONFIG[payment.payment_method]?.color || 'badge-neutral'}`}>
                          {METHOD_CONFIG[payment.payment_method]?.label || payment.payment_method}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-gray-600">
                          {PAYER_CONFIG[payment.payer_type] || payment.payer_type}
                        </span>
                      </td>
                      <td>
                        {payment.session_id ? (
                          <span className="badge badge-info">Oui</span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Imprimer le reçu PDF"
                            onClick={() => generateInvoicePDF(payment, cabinetInfo)}
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEdit(payment)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(payment.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                <span className="text-sm text-gray-500">
                  Page {page} sur {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-secondary btn-sm"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn btn-secondary btn-sm"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state py-16">
            <CreditCard className="!w-12 !h-12" />
            <h3>Aucun paiement trouvé</h3>
            <p>Commencez par ajouter un encaissement pour qu'il apparaisse ici.</p>
          </div>
        )}
      </div>

      {/* Modal Nouveau/Modifier Paiement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{isEditMode ? 'Modifier le Paiement' : 'Enregistrer un Paiement'}</h3>
                <p className="text-sm text-gray-500">{isEditMode ? 'Modifiez les informations d\'un encaissement existant.' : 'Ajoutez un encaissement manuel pour un patient.'}</p>
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

              {/* Patient */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Patient *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    required
                    value={formData.patient_id}
                    onChange={e => setFormData({...formData, patient_id: e.target.value})}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl form-select-custom outline-none focus:bg-white focus:border-blue-500 transition-all text-sm"
                  >
                    <option value="">-- Sélectionnez un patient --</option>
                    {allPatients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name} {p.phone_primary ? `(${p.phone_primary})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Montant & Date */}
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
                    value={formData.payment_date}
                    onChange={e => setFormData({...formData, payment_date: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Méthode & Payeur */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Méthode</label>
                  <select
                    value={formData.payment_method}
                    onChange={e => setFormData({...formData, payment_method: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl form-select-custom outline-none focus:bg-white focus:border-blue-500 transition-all text-sm"
                  >
                    <option value="especes">Espèces</option>
                    <option value="virement">Virement bancaire</option>
                    <option value="cheque">Chèque</option>
                    <option value="assurance">Assurance / Tiers payant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Type de Payeur</label>
                  <select
                    value={formData.payer_type}
                    onChange={e => setFormData({...formData, payer_type: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl form-select-custom outline-none focus:bg-white focus:border-blue-500 transition-all text-sm"
                  >
                    <option value="patient">Patient lui-même</option>
                    <option value="cnss">CNSS</option>
                    <option value="cnops">CNOPS</option>
                    <option value="mutuelle">Mutuelle Privée</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Notes / Réf. (Optionnel)</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  rows="2"
                  placeholder="Numéro de chèque, référence virement..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm resize-none"
                ></textarea>
              </div>

            </form>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button type="button" onClick={() => { setIsModalOpen(false); resetModal(); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button type="submit" onClick={handleSubmit} disabled={saving} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Enregistrement...' : isEditMode ? 'Enregistrer les modifications' : 'Enregistrer le paiement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
