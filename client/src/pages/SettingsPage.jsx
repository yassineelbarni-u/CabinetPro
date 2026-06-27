import { useState, useEffect } from 'react';
import {
  Settings, Building2, Phone, Mail, MapPin, Save,
  Database, Download, CheckCircle, AlertCircle, Loader,
  X, Shield, Info,
} from 'lucide-react';
import api from '../api/axios';

const TABS = [
  { id: 'info',   label: 'Informations',  icon: Building2, emoji: '🏥' },
  { id: 'backup', label: 'Sauvegarde',    icon: Database,  emoji: '💾' },
];

/* Champ avec icône à gauche */
function FormField({ label, icon: Icon, required, hint, children }) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && (
          <Icon style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            width: 16, height: 16, color: '#A5D8E6', pointerEvents: 'none',
          }} />
        )}
        {children}
      </div>
      {hint && <p className="form-hint">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('info');
  const [form, setForm] = useState({ name: '', address: '', city: '', phone: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [backupLoading, setBackupLoading] = useState(false);

  useEffect(() => {
    api.get('/cabinet')
      .then(res => {
        const d = res.data.data;
        setForm({ name: d.name || '', address: d.address || '', city: d.city || '', phone: d.phone || '', email: d.email || '' });
      })
      .catch(() => showToast('error', 'Impossible de charger les informations du cabinet.'))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) { showToast('error', 'Le nom du cabinet est obligatoire.'); return; }
    setSaving(true);
    try {
      await api.put('/cabinet', form);
      showToast('success', 'Informations mises à jour avec succès !');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const token = localStorage.getItem('cabinetpro_token');
      const response = await fetch('/api/cabinet/backup', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erreur lors du backup.');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const today = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `sauvegarde_cabinet_${today}.sql`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('success', 'Sauvegarde téléchargée avec succès !');
    } catch (err) {
      showToast('error', err.message || 'Erreur lors du téléchargement de la sauvegarde.');
    } finally {
      setBackupLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '0.875rem', color: '#8BA7BE' }}>Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Toast notification ── */}
      {toast && (
        <div
          className="animate-slide-up"
          style={{
            position: 'fixed', top: 24, right: 24, zIndex: 100,
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.875rem 1.25rem',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            background: toast.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: toast.type === 'success' ? '1px solid #A7F3D0' : '1px solid #FECACA',
            color: toast.type === 'success' ? '#065F46' : '#991B1B',
            fontSize: '0.875rem', fontWeight: 600,
            maxWidth: 380,
          }}
        >
          {toast.type === 'success'
            ? <CheckCircle style={{ width: 20, height: 20, color: '#059669', flexShrink: 0 }} />
            : <AlertCircle style={{ width: 20, height: 20, color: '#DC2626', flexShrink: 0 }} />
          }
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, padding: 2 }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #06B6D4, #0891B2)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(6,182,212,0.30)',
            }}>
              <Settings style={{ width: 20, height: 20, color: '#fff' }} />
            </span>
            Paramètres
          </h1>
          <p className="page-description">Configurez votre cabinet et gérez vos données.</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs-container">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              <Icon style={{ width: 16, height: 16 }} />
              {tab.emoji} {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Onglet Informations ── */}
      {activeTab === 'info' && (
        <div style={{ maxWidth: 680 }}>
          <div className="card">
            {/* Header de la card */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              paddingBottom: '1.25rem', marginBottom: '1.5rem',
              borderBottom: '1px solid #E0EEF2',
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                background: 'linear-gradient(135deg, #CFFAFE, #A5F3FC)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid #A5F3FC',
              }}>
                <Building2 style={{ width: 22, height: 22, color: '#0891B2' }} />
              </div>
              <div>
                <h3 style={{ fontWeight: 800, color: '#0F2A3F', fontSize: '1.0625rem', letterSpacing: '-0.015em' }}>
                  Informations du Cabinet
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#8BA7BE', marginTop: 2 }}>
                  Ces informations apparaîtront sur vos factures et reçus.
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

              {/* Nom du cabinet */}
              <FormField label="Nom du Cabinet" icon={Building2} required hint="Affiché en en-tête sur les factures PDF">
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex : Cabinet Dentaire Al Shifa"
                  className="form-input"
                  style={{ paddingLeft: '2.375rem' }}
                />
              </FormField>

              {/* Téléphone + Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <FormField label="Téléphone" icon={Phone}>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+212 6XX XXX XXX"
                    className="form-input"
                    style={{ paddingLeft: '2.375rem' }}
                  />
                </FormField>
                <FormField label="Email" icon={Mail}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="contact@cabinet.ma"
                    className="form-input"
                    style={{ paddingLeft: '2.375rem' }}
                  />
                </FormField>
              </div>

              {/* Ville + Adresse */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.875rem' }}>
                <FormField label="Ville" icon={MapPin}>
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="Casablanca"
                    className="form-input"
                    style={{ paddingLeft: '2.375rem' }}
                  />
                </FormField>
                <div className="form-group">
                  <label className="form-label">Adresse Complète</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="123 Rue Mohammed V, Quartier Maarif"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Bouton Sauvegarder */}
              <div style={{ paddingTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ minWidth: 200, justifyContent: 'center' }}
                >
                  {saving ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Loader style={{ width: 16, height: 16, animation: 'spin 0.75s linear infinite' }} />
                      Enregistrement...
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Save style={{ width: 16, height: 16 }} />
                      Enregistrer les modifications
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Onglet Sauvegarde ── */}
      {activeTab === 'backup' && (
        <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Card principale */}
          <div className="card">
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              paddingBottom: '1.25rem', marginBottom: '1.5rem',
              borderBottom: '1px solid #E0EEF2',
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid #A7F3D0',
              }}>
                <Database style={{ width: 22, height: 22, color: '#059669' }} />
              </div>
              <div>
                <h3 style={{ fontWeight: 800, color: '#0F2A3F', fontSize: '1.0625rem', letterSpacing: '-0.015em' }}>
                  Sauvegarde de la Base de Données
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#8BA7BE', marginTop: 2 }}>
                  Téléchargez une copie complète de toutes vos données.
                </p>
              </div>
            </div>

            {/* Alerte recommandation */}
            <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
              <Info style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontWeight: 700, marginBottom: 4 }}>Recommandation</p>
                <p style={{ lineHeight: 1.7 }}>
                  Effectuez une sauvegarde <strong>quotidienne ou hebdomadaire</strong> et conservez le fichier
                  sur un disque externe ou un service cloud (Google Drive, OneDrive).
                  Le fichier généré est un fichier <code style={{
                    background: '#A5F3FC', padding: '1px 5px', borderRadius: 5,
                    fontSize: '0.8rem', fontWeight: 700, color: '#0E7490',
                  }}>.sql</code> qui permet de restaurer complètement votre base de données.
                </p>
              </div>
            </div>

            {/* Bloc téléchargement */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1.125rem 1.25rem',
              background: 'linear-gradient(135deg, #F0FDFF, #ECFDF5)',
              borderRadius: 16,
              border: '1.5px solid #A7F3D0',
              gap: '1rem',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                  <Shield style={{ width: 16, height: 16, color: '#059669' }} />
                  <span style={{ fontWeight: 700, color: '#0F2A3F', fontSize: '0.9375rem' }}>
                    Sauvegarde complète
                  </span>
                </div>
                <p style={{ fontSize: '0.775rem', color: '#4A6580', lineHeight: 1.6 }}>
                  Inclut · Patients · Rendez-vous · Consultations · Paiements · Charges
                </p>
              </div>
              <button
                onClick={handleDownloadBackup}
                disabled={backupLoading}
                className="btn btn-accent"
                style={{ flexShrink: 0, minWidth: 175, justifyContent: 'center' }}
              >
                {backupLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Loader style={{ width: 16, height: 16, animation: 'spin 0.75s linear infinite' }} />
                    Génération...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Download style={{ width: 16, height: 16 }} />
                    Télécharger (.sql)
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Alerte prérequis Docker */}
          <div className="alert alert-danger" style={{ borderRadius: 16 }}>
            <AlertCircle style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontWeight: 700, marginBottom: 4 }}>Prérequis Docker</p>
              <p style={{ lineHeight: 1.7, fontSize: '0.85rem' }}>
                La sauvegarde nécessite que le conteneur Docker{' '}
                <code style={{
                  background: '#FECACA', padding: '1px 5px', borderRadius: 5,
                  fontSize: '0.8rem', fontWeight: 700, color: '#991B1B',
                }}>cabinet_postgres</code>{' '}
                soit en cours d'exécution. Si vous obtenez une erreur, assurez-vous que
                Docker Desktop est ouvert et que vous avez exécuté{' '}
                <code style={{
                  background: '#FECACA', padding: '1px 5px', borderRadius: 5,
                  fontSize: '0.8rem', fontWeight: 700, color: '#991B1B',
                }}>docker-compose up -d</code>.
              </p>
            </div>
          </div>

          {/* Informations sur les formats */}
          <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <h4 style={{ fontWeight: 700, color: '#0F2A3F', fontSize: '0.875rem', marginBottom: '0.875rem' }}>
              📋 Ce que contient la sauvegarde
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.625rem' }}>
              {[
                { emoji: '👤', label: 'Dossiers patients', desc: 'Informations & contacts' },
                { emoji: '📅', label: 'Rendez-vous', desc: 'Historique & agenda' },
                { emoji: '🦷', label: 'Consultations', desc: 'Actes et traitements' },
                { emoji: '💳', label: 'Paiements', desc: 'Encaissements & reçus' },
                { emoji: '📉', label: 'Charges', desc: 'Dépenses du cabinet' },
                { emoji: '⚙️', label: 'Paramètres', desc: 'Config du cabinet' },
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.625rem 0.875rem',
                    background: '#F8FAFC', borderRadius: 10,
                    border: '1px solid #E0EEF2',
                  }}
                >
                  <span style={{ fontSize: '1.125rem' }}>{item.emoji}</span>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F2A3F' }}>{item.label}</div>
                    <div style={{ fontSize: '0.7rem', color: '#8BA7BE' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
