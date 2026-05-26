import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Search, Plus, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { formatDate, PATIENT_TYPE_LABELS } from '../utils/formatters';

export default function PatientsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_primary: '',
    patient_type: 'particulier',
  });
  const [saving, setSaving] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/patients?page=${page}&search=${search}`);
      setPatients(res.data.data);
      setTotalPages(res.data.pagination.pages);
    } catch (error) {
      console.error('Erreur chargement patients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPatients();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, page]);

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/patients', formData);
      setIsModalOpen(false);
      setFormData({ first_name: '', last_name: '', phone_primary: '', patient_type: 'particulier' });
      // Rediriger directement vers le dossier du patient
      navigate(`/patients/${res.data.data.id}`);
    } catch (err) {
      alert('Erreur lors de la création : ' + (err.response?.data?.message || err.message));
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des Patients</h1>
          <p className="page-description">Consultez et gérez la liste de vos patients.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Nouveau Patient
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="search-bar w-full sm:w-auto flex-1">
            <Search />
            <input 
              type="text" 
              placeholder="Rechercher par nom, prénom, téléphone..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <button className="btn btn-secondary shrink-0">
            <Filter className="w-4 h-4" />
            Filtres
          </button>
        </div>

        <div className="table-container overflow-x-auto">
          {loading ? (
            <div className="py-12 flex justify-center"><div className="spinner"></div></div>
          ) : patients.length === 0 ? (
            <div className="empty-state">
              <Users />
              <h3>Aucun patient trouvé</h3>
              <p>Commencez par ajouter un nouveau patient ou modifiez votre recherche.</p>
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary mt-4">Ajouter un patient</button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Dernière Visite</th>
                  <th>Séances</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(patient => (
                  <tr key={patient.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                          {patient.first_name[0]}{patient.last_name[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{patient.first_name} {patient.last_name}</div>
                          {patient.first_name_ar && <div className="text-xs text-gray-500 font-arabic">{patient.first_name_ar} {patient.last_name_ar}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-gray-900">{patient.phone_primary || '—'}</div>
                      <div className="text-xs text-gray-500">{patient.city || '—'}</div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {PATIENT_TYPE_LABELS[patient.patient_type]}
                      </span>
                    </td>
                    <td className="text-sm text-gray-600">
                      {formatDate(patient.updated_at)}
                    </td>
                    <td className="text-sm text-gray-900 font-medium">
                      {patient.session_count || 0}
                    </td>
                    <td className="text-right">
                      <Link to={`/patients/${patient.id}`} className="btn btn-secondary btn-sm">
                        Dossier
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 mt-4 pt-4 px-2">
            <span className="text-sm text-gray-500">Page {page} sur {totalPages}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary btn-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Précédent
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-secondary btn-sm"
              >
                Suivant <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Création Patient Rapide */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
            {/* Header du Modal */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-200" />
                Nouveau Patient
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.first_name}
                    onChange={e => setFormData({...formData, first_name: e.target.value})}
                    placeholder="Ex: Ahmed"
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.last_name}
                    onChange={e => setFormData({...formData, last_name: e.target.value})}
                    placeholder="Ex: Benali"
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Téléphone *</label>
                <input 
                  type="tel" 
                  required
                  value={formData.phone_primary}
                  onChange={e => setFormData({...formData, phone_primary: e.target.value})}
                  placeholder="06 XX XX XX XX"
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Couverture Médicale (Type)</label>
                <div className="relative">
                  <select 
                    value={formData.patient_type}
                    onChange={e => setFormData({...formData, patient_type: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl form-select-custom outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-800 appearance-none"
                  >
                    <option value="particulier">👤 Particulier (Sans mutuelle)</option>
                    <option value="cnss">🏥 CNSS (AMO)</option>
                    <option value="cnops">🏛️ CNOPS</option>
                    <option value="mutuelle">🛡️ Mutuelle Privée</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-1">Ce choix influencera la facturation et les feuilles de soins.</p>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary px-6">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary px-8 shadow-md">
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Création...
                    </div>
                  ) : 'Créer le dossier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
