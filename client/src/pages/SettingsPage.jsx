import { useState, useEffect } from 'react';
import {
  Settings, Building2, Phone, Mail, MapPin, Save,
  Database, Download, CheckCircle, AlertCircle, Loader
} from 'lucide-react';
import api from '../api/axios';

const TABS = [
  { id: 'info', label: 'Informations du Cabinet', icon: Building2 },
  { id: 'backup', label: 'Sauvegarde des Données', icon: Database },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('info');
  const [cabinetData, setCabinetData] = useState(null);
  const [form, setForm] = useState({
    name: '', address: '', city: '', phone: '', email: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }
  const [backupLoading, setBackupLoading] = useState(false);

  useEffect(() => {
    const fetchCabinet = async () => {
      try {
        const res = await api.get('/cabinet');
        setCabinetData(res.data.data);
        setForm({
          name: res.data.data.name || '',
          address: res.data.data.address || '',
          city: res.data.data.city || '',
          phone: res.data.data.phone || '',
          email: res.data.data.email || '',
        });
      } catch (err) {
        console.error('Erreur chargement cabinet:', err);
        showToast('error', 'Impossible de charger les informations du cabinet.');
      } finally {
        setLoading(false);
      }
    };
    fetchCabinet();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) {
      showToast('error', 'Le nom du cabinet est obligatoire.');
      return;
    }
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
        headers: { Authorization: `Bearer ${token}` }
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
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold transition-all animate-fade-in ${
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          }
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Settings className="w-7 h-7 text-blue-600" />
            Paramètres
          </h1>
          <p className="page-description">Configurez votre cabinet et gérez vos données.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content : Informations */}
      {activeTab === 'info' && (
        <div className="card max-w-2xl">
          <div className="card-header border-b border-gray-100 pb-4 mb-6">
            <h3 className="card-title flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Informations du Cabinet
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">Ces informations apparaîtront sur vos factures.</p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Nom du cabinet */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                Nom du Cabinet *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Cabinet Dentaire Al Shifa"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Téléphone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+212 6XX XXX XXX"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="contact@cabinet.ma"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Ville & Adresse */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  Ville
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="Casablanca"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  Adresse Complète
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="123 Rue Mohammed V, Quartier Maarif"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all disabled:opacity-50"
              >
                {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Content : Sauvegarde */}
      {activeTab === 'backup' && (
        <div className="card max-w-2xl">
          <div className="card-header border-b border-gray-100 pb-4 mb-6">
            <h3 className="card-title flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Sauvegarde Locale de la Base de Données
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Téléchargez une copie complète de toutes vos données (patients, rendez-vous, paiements...).
            </p>
          </div>

          <div className="space-y-5">
            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Recommandation</p>
                <p>Effectuez une sauvegarde quotidienne ou hebdomadaire et conservez le fichier sur un disque externe ou un service cloud (Google Drive, OneDrive). Le fichier généré est un fichier <strong>.sql</strong> qui permet de restaurer complètement votre base de données.</p>
              </div>
            </div>

            {/* Last backup info */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">Sauvegarde complète de la base de données</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Inclut : Patients • Rendez-vous • Consultations • Paiements • Charges
                </p>
              </div>
              <button
                onClick={handleDownloadBackup}
                disabled={backupLoading}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all disabled:opacity-50"
              >
                {backupLoading
                  ? <Loader className="w-4 h-4 animate-spin" />
                  : <Download className="w-4 h-4" />
                }
                {backupLoading ? 'Génération...' : 'Télécharger (.sql)'}
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Prérequis :</strong> La sauvegarde nécessite que le conteneur Docker <code className="bg-amber-100 px-1 rounded">cabinet_postgres</code> soit en cours d'exécution. Si vous obtenez une erreur, assurez-vous que Docker Desktop est ouvert et que vous avez exécuté <code className="bg-amber-100 px-1 rounded">docker-compose up -d</code>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
