import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Search, Plus, Filter, ChevronLeft, ChevronRight,
  Check, UserPlus,
} from 'lucide-react';
import api from '../api/axios';
import { formatDate, PATIENT_TYPE_LABELS } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';


/* ──────────── Couverture médicale chips ──────────── */
const COVERAGE_OPTIONS = [
  { value: 'particulier', emoji: '👤', label: 'Particulier', desc: 'Sans mutuelle' },
  { value: 'cnss', emoji: '🏥', label: 'CNSS', desc: 'AMO Obligatoire' },
  { value: 'cnops', emoji: '🏛️', label: 'CNOPS', desc: 'Fonction publique' },
  { value: 'mutuelle', emoji: '🛡️', label: 'Mutuelle', desc: 'Privée / complémentaire' },
];

/* Badge couleur par type patient */
const TYPE_BADGE = {
  particulier: 'badge-neutral',
  cnss: 'badge-primary',
  cnops: 'badge-info',
  mutuelle: 'badge-purple',
};

export default function PatientsPage() {
  usePageTitle('Patients');
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_primary: '',
    city: '',
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
    const t = setTimeout(() => { fetchPatients(); }, 500);
    return () => clearTimeout(t);
  }, [search, page]);

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/patients', formData);
      setIsModalOpen(false);
      setFormData({ first_name: '', last_name: '', phone_primary: '', city: '', patient_type: 'particulier' });
      navigate(`/patients/${res.data.data.id}`);
    } catch (err) {
      showToast('error', 'Erreur lors de la création : ' + (err.response?.data?.message || err.message));
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des Patients</h1>
          <p className="page-description">Consultez et gérez tous les dossiers patients de votre cabinet.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus style={{ width: 16, height: 16 }} />
          Nouveau Patient
        </button>
      </div>

      {/* Card principale */}
      <div className="card" style={{ padding: '1.5rem' }}>
        {/* Barre de recherche + filtres */}
        <div style={{
          display: 'flex', flexDirection: 'row', gap: '0.75rem',
          marginBottom: '1.25rem', flexWrap: 'wrap',
        }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 220 }}>
            <Search />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, téléphone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              id="patient-search"
            />
          </div>
          <button className="btn btn-secondary" style={{ flexShrink: 0 }}>
            <Filter style={{ width: 16, height: 16 }} />
            Filtres
          </button>
        </div>

        {/* Tableau */}
        <div className="table-container">
          {loading ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th><th>Contact</th><th>Couverture</th>
                  <th>Dernière activité</th><th style={{ textAlign: 'center' }}>Séances</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="skeleton skeleton-circle" style={{ width: 40, height: 40, flexShrink: 0 }} />
                        <div>
                          <div className="skeleton skeleton-text" style={{ width: 130, marginBottom: 4 }} />
                          <div className="skeleton skeleton-text-sm" style={{ width: 80 }} />
                        </div>
                      </div>
                    </td>
                    <td><div className="skeleton skeleton-text" style={{ width: 90 }} /></td>
                    <td><div className="skeleton skeleton-rect" style={{ width: 70, height: 22 }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
                    <td style={{ textAlign: 'center' }}><div className="skeleton skeleton-circle" style={{ width: 32, height: 32, margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'right' }}><div className="skeleton skeleton-rect" style={{ width: 80, height: 30 }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : patients.length === 0 ? (
            <div className="empty-state" style={{ padding: '3.5rem 2rem' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, #F0FDFF, #ECFDF5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 8,
              }}>
                <Users style={{ width: 32, height: 32, color: '#06B6D4' }} />
              </div>
              <h3>Aucun patient trouvé</h3>
              <p>Commencez par ajouter un nouveau patient ou modifiez votre recherche.</p>
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ marginTop: '0.75rem' }}>
                <UserPlus style={{ width: 16, height: 16 }} /> Ajouter un patient
              </button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Contact</th>
                  <th>Couverture</th>
                  <th>Dernière activité</th>
                  <th style={{ textAlign: 'center' }}>Séances</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(patient => (
                  <tr key={patient.id}>
                    {/* Nom */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="patient-avatar">
                          {patient.first_name[0]}{patient.last_name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F2A3F' }}>
                            {patient.first_name} {patient.last_name}
                          </div>
                          {patient.first_name_ar && (
                            <div className="font-arabic" style={{ fontSize: '0.75rem', color: '#8BA7BE' }}>
                              {patient.first_name_ar} {patient.last_name_ar}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F2A3F' }}>
                        {patient.phone_primary || '—'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#8BA7BE', marginTop: 2 }}>
                        {patient.city || '—'}
                      </div>
                    </td>

                    {/* Type */}
                    <td>
                      <span className={`badge ${TYPE_BADGE[patient.patient_type] || 'badge-neutral'}`}>
                        {PATIENT_TYPE_LABELS[patient.patient_type] || patient.patient_type}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={{ fontSize: '0.8125rem', color: '#4A6580' }}>
                      {formatDate(patient.updated_at)}
                    </td>

                    {/* Séances */}
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, borderRadius: 10,
                        background: patient.session_count > 0 ? '#CFFAFE' : '#F1F5F9',
                        color: patient.session_count > 0 ? '#0891B2' : '#94A3B8',
                        fontWeight: 700, fontSize: '0.875rem',
                      }}>
                        {patient.session_count || 0}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/patients/${patient.id}`} className="btn btn-secondary btn-sm">
                        Dossier →
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
          <div className="pagination">
            <span className="pagination-info">Page {page} sur {totalPages}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary btn-sm"
              >
                <ChevronLeft style={{ width: 14, height: 14 }} /> Précédent
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-secondary btn-sm"
              >
                Suivant <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== MODAL NOUVEAU PATIENT ===== */}
      {isModalOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container animate-slide-up" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>

            {/* Header teal */}
            <div className="modal-header-teal">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                  🧑‍⚕️ Nouveau Dossier Patient
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
                  Créez un dossier, puis complétez les informations
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.20)',
                  borderRadius: 10, padding: 8, cursor: 'pointer', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '1.125rem', lineHeight: 1 }}>✕</span>
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleCreatePatient} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

                {/* Prénom + Nom */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="p-prenom">Prénom *</label>
                    <input
                      id="p-prenom"
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="Ahmed"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="p-nom">Nom *</label>
                    <input
                      id="p-nom"
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Benali"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Téléphone */}
                <div className="form-group">
                  <label className="form-label" htmlFor="p-tel">Téléphone *</label>
                  <input
                    id="p-tel"
                    type="tel"
                    required
                    value={formData.phone_primary}
                    onChange={e => setFormData({ ...formData, phone_primary: e.target.value })}
                    placeholder="06 XX XX XX XX"
                    className="form-input"
                  />
                </div>

                {/* Ville */}
                <div className="form-group">
                  <label className="form-label" htmlFor="p-city">Ville</label>
                  <input
                    id="p-city"
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Casablanca, Rabat..."
                    className="form-input"
                  />
                </div>

                {/* Couverture médicale — chips */}
                <div>
                  <label className="form-label" style={{ marginBottom: '0.625rem', display: 'block' }}>
                    Couverture Médicale
                  </label>
                  <div className="coverage-chips">
                    {COVERAGE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, patient_type: opt.value })}
                        className={`coverage-chip ${formData.patient_type === opt.value ? 'selected' : ''}`}
                      >
                        <span className="coverage-chip-emoji">{opt.emoji}</span>
                        <div className="coverage-chip-info">
                          <span className="coverage-chip-label">{opt.label}</span>
                          <span className="coverage-chip-desc">{opt.desc}</span>
                        </div>
                        {formData.patient_type === opt.value && (
                          <Check style={{ width: 15, height: 15, color: '#06B6D4', marginLeft: 'auto', flexShrink: 0 }} />
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="form-hint" style={{ marginTop: '0.5rem' }}>
                    Ce choix influencera la facturation et les feuilles de soins.
                  </p>
                </div>
              </div>

              {/* Footer actions */}
              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ minWidth: 150 }}>
                  {saving ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="spinner spinner-sm" /> Création...
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <UserPlus style={{ width: 16, height: 16 }} /> Créer le dossier
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
