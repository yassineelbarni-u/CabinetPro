import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import Odontogram from '../components/patients/Odontogram';

export default function SessionCreatePage() {
  const { patient_id } = useParams();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [careType, setCareType] = useState('Consultation générale');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [toothRecords, setToothRecords] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('especes');

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await api.get(`/patients/${patient_id}`);
        setPatient(res.data.data);
      } catch (err) {
        setError('Impossible de charger le patient.');
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [patient_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.post('/sessions', {
        patient_id,
        care_type: careType,
        clinical_notes: clinicalNotes,
        prescription,
        tooth_records: toothRecords,
        payment_amount: parseFloat(paymentAmount) || 0,
        payment_method: paymentMethod
      });
      
      // Retourner à la fiche patient
      navigate(`/patients/${patient_id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde de la séance.');
      setSaving(false);
    }
  };

  const calculateTotal = () => {
    return toothRecords.reduce((sum, tr) => sum + (tr.price || 0), 0);
  };

  if (loading) return <div className="py-12 flex justify-center"><div className="spinner"></div></div>;
  if (!patient) return <div className="p-6">Patient non trouvé.</div>;

  const totalAmount = calculateTotal();

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nouvelle Séance</h1>
            <p className="text-gray-500">Patient : {patient.first_name} {patient.last_name}</p>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={saving} className="btn btn-primary">
          {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
          Enregistrer la séance
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de gauche : Formulaire principal */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <h3 className="card-title mb-4">Informations générales</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Motif de consultation</label>
                <input 
                  type="text" 
                  value={careType}
                  onChange={(e) => setCareType(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes Cliniques</label>
                <textarea 
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  rows="4"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Symptômes, diagnostic, observations..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ordonnance</label>
                <textarea 
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  rows="4"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Médicaments prescrits..."
                ></textarea>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title mb-4">Facturation</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="font-semibold text-gray-700">Total Soins :</span>
                <span className="text-xl font-bold text-gray-900">{totalAmount} DH</span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Montant payé (DH)</label>
                <input 
                  type="number" 
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Méthode de paiement</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl form-select-custom focus:bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="especes">Espèces</option>
                  <option value="virement">Virement</option>
                  <option value="cheque">Chèque</option>
                  <option value="assurance">Assurance / Mutuelle</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne de droite : Odontogramme */}
        <div className="lg:col-span-2">
          <div className="card h-full">
            <h3 className="card-title mb-4 flex items-center justify-between">
              Actes Dentaires
              <span className="badge badge-info">{toothRecords.length} soin(s) ajouté(s)</span>
            </h3>
            
            <Odontogram value={toothRecords} onChange={setToothRecords} />
            
            {toothRecords.length > 0 && (
              <div className="mt-6 border-t border-gray-100 pt-4">
                <h4 className="font-semibold text-gray-700 mb-3">Récapitulatif des soins :</h4>
                <div className="space-y-2">
                  {toothRecords.map((tr, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                      <div>
                        <span className="font-bold mr-2">Dent {tr.tooth_number} :</span>
                        <span className="capitalize">{tr.treatment_type}</span>
                        {tr.notes && <span className="text-gray-500 ml-2">({tr.notes})</span>}
                      </div>
                      <div className="font-semibold">{tr.price} DH</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
