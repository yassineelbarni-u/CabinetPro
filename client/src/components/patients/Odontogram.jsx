import { useState } from 'react';
import { X, Check } from 'lucide-react';

const FILL_COLORS = {
  sain: '#ffffff',
  carie: '#ef4444',
  couronne: '#facc15',
  extraction: '#1f2937',
  devitalisation: '#a855f7',
  detartrage: '#93c5fd',
  implant: '#10b981',
  facette: '#a5f3fc',
  blanchiment: '#ffffff',
  pont: '#fb923c',
};

const TREATMENT_LABELS = {
  sain: 'Sain',
  carie: 'Carie',
  couronne: 'Couronne',
  extraction: 'Extraction',
  devitalisation: 'Dévitalisation (Canal)',
  detartrage: 'Détartrage',
  implant: 'Implant',
  facette: 'Facette',
  blanchiment: 'Blanchiment',
  pont: 'Pont',
};

// SVG Components for Teeth
const ToothWrapper = ({ children }) => (
  <svg width="34" height="34" viewBox="0 0 34 34" className="drop-shadow-sm transition-all duration-300">
    {children}
  </svg>
);

const Incisor = ({ color }) => (
  <ToothWrapper>
    <rect x="7" y="5" width="20" height="12" rx="5" fill={color} stroke="#94a3b8" strokeWidth="1.2" />
    <path d="M 12 5 L 12 17 M 17 5 L 17 17" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2 2" />
  </ToothWrapper>
);

const Canine = ({ color }) => (
  <ToothWrapper>
    <path d="M 7 11 Q 17 3 27 11 Q 23 19 17 19 Q 11 19 7 11 Z" fill={color} stroke="#94a3b8" strokeWidth="1.2" />
  </ToothWrapper>
);

const Premolar = ({ color }) => (
  <ToothWrapper>
    <rect x="5" y="6" width="24" height="18" rx="6" fill={color} stroke="#94a3b8" strokeWidth="1.2" />
    <line x1="10" y1="15" x2="24" y2="15" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
  </ToothWrapper>
);

const Molar = ({ color }) => (
  <ToothWrapper>
    <rect x="3" y="3" width="28" height="26" rx="8" fill={color} stroke="#94a3b8" strokeWidth="1.2" />
    <path d="M 3 16 L 31 16 M 17 3 L 17 29" stroke="#94a3b8" strokeWidth="1.2" />
    <circle cx="17" cy="16" r="2" fill="#94a3b8" />
  </ToothWrapper>
);

// Map index (0 to 7) to Tooth Component
const getToothComponent = (index) => {
  if (index <= 1) return Incisor;
  if (index === 2) return Canine;
  if (index <= 4) return Premolar;
  return Molar;
};

// Calculate X, Y, and Rotation based on dental arch
const getToothPosition = (index, isBottom, isLeft) => {
  const thetas = [3, 14, 26, 38, 52, 65, 78, 90]; // angles in degrees
  const theta = thetas[index];
  const rad = theta * Math.PI / 180;

  const Rx = 135; // width radius (tighter)
  const Ry = 170; // height radius (tighter)

  const Cx = 200; // Center X of the jaw SVG container (width=400)
  const Cy = isBottom ? 50 : 250; // Center Y of ellipse

  const x = Cx + (isLeft ? 1 : -1) * Rx * Math.sin(rad);
  const y = Cy + (isBottom ? 1 : -1) * Ry * Math.cos(rad);

  let rotation = (isLeft ? 1 : -1) * theta;
  if (isBottom) {
    rotation = (isLeft ? -1 : 1) * theta;
  }

  return { left: x, top: y, rotation };
};

export default function Odontogram({ value, onChange, readOnly = false }) {
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [treatment, setTreatment] = useState('sain');
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState('');

  const getToothState = (num) => {
    return value.find(t => t.tooth_number === num) || { tooth_number: num, treatment_type: 'sain' };
  };

  const handleToothClick = (num) => {
    if (readOnly) return;
    const existing = getToothState(num);
    setSelectedTooth(num);
    setTreatment(existing.treatment_type);
    setNotes(existing.notes || '');
    setPrice(existing.price || '');
    setIsModalOpen(true);
  };

  const saveTooth = () => {
    const newRecord = {
      tooth_number: selectedTooth,
      treatment_type: treatment,
      notes,
      price: parseFloat(price) || 0
    };

    const filtered = value.filter(t => t.tooth_number !== selectedTooth);

    if (treatment === 'sain' && !notes && !price) {
      onChange(filtered);
    } else {
      onChange([...filtered, newRecord]);
    }

    setIsModalOpen(false);
  };

  const renderJaw = (isBottom) => {
    const indices = [7, 6, 5, 4, 3, 2, 1, 0]; // Right side (patient's right, screen left)
    const indicesLeft = [0, 1, 2, 3, 4, 5, 6, 7]; // Left side (patient's left, screen right)

    const renderSide = (isLeft) => {
      const arr = isLeft ? indicesLeft : indices;
      return arr.map((idx) => {
        // Calculate FDI number
        // Top Right: 11-18, Top Left: 21-28
        // Bottom Right: 41-48, Bottom Left: 31-38
        let quadrant = 1;
        if (!isBottom && isLeft) quadrant = 2;
        if (isBottom && !isLeft) quadrant = 4;
        if (isBottom && isLeft) quadrant = 3;

        const toothNumber = quadrant * 10 + (idx + 1);
        const { left, top, rotation } = getToothPosition(idx, isBottom, isLeft);

        const state = getToothState(toothNumber);
        const ToothShape = getToothComponent(idx);
        const color = FILL_COLORS[state.treatment_type] || FILL_COLORS.sain;
        const isExtracted = state.treatment_type === 'extraction';
        const hasNotes = state.notes && state.notes.length > 0;

        return (
          <div
            key={toothNumber}
            onClick={() => handleToothClick(toothNumber)}
            className={`absolute flex flex-col items-center justify-center group ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
            style={{
              left: `${left}px`,
              top: `${top}px`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`
            }}
          >
            {/* Numéro de la dent - Éloigné légèrement pour ne pas coller */}
            <span
              className="absolute -top-6 text-[11px] font-bold text-gray-500 group-hover:text-blue-600 transition-colors"
              style={{ transform: `rotate(${-rotation}deg)` }}
            >
              {toothNumber}
            </span>

            <div className="relative transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-lg">
              <ToothShape color={color} />

              {isExtracted && (
                <X className="absolute inset-0 m-auto w-6 h-6 text-gray-800 drop-shadow-md z-10" strokeWidth="3" />
              )}

              {hasNotes && !isExtracted && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white z-10 shadow-sm animate-pulse"></div>
              )}
            </div>
          </div>
        );
      });
    };

    return (
      <div className="relative w-[400px] h-[300px] mx-auto border-b border-dashed border-gray-200/50 last:border-0">
        {/* Ligne médiane subtile */}
        <div className="absolute left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-blue-200 to-transparent"></div>

        {/* Titre de la mâchoire */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-900/10 font-black text-4xl tracking-widest uppercase pointer-events-none select-none">
          {isBottom ? 'Bas' : 'Haut'}
        </div>

        {renderSide(false)} {/* Droite du patient (gauche de l'écran) */}
        {renderSide(true)}  {/* Gauche du patient (droite de l'écran) */}
      </div>
    );
  };

  return (
    <div className="odontogram-container p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-gray-800">Odontogramme (FDI)</h3>
        {!readOnly && <p className="text-sm text-gray-500 mt-1">Cliquez sur une dent pour interagir</p>}
      </div>

      <div className="flex flex-col items-center gap-2 bg-gradient-to-b from-blue-50/50 via-white to-blue-50/50 rounded-3xl p-6 overflow-hidden border border-gray-100 shadow-inner">
        {renderJaw(false)} {/* Mâchoire du haut */}
        {renderJaw(true)}  {/* Mâchoire du bas */}
      </div>

      {/* Légende */}
      <div className="mt-8 flex flex-wrap gap-4 justify-center bg-gray-50 p-4 rounded-xl border border-gray-100">
        {Object.entries(TREATMENT_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2 text-xs font-semibold text-gray-700">
            <div
              className="w-4 h-4 rounded-full border border-gray-300 shadow-sm flex items-center justify-center"
              style={{ backgroundColor: FILL_COLORS[key] }}
            >
              {key === 'extraction' && <X className="w-3 h-3 text-white" />}
            </div>
            {label}
          </div>
        ))}
      </div>

      {/* Modal d'édition */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Soin — Dent {selectedTooth}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Acte médical</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TREATMENT_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setTreatment(key)}
                      className={`px-3 py-2 text-sm rounded-lg border font-medium flex items-center gap-2 transition-all ${treatment === key
                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      <div className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: FILL_COLORS[key] }}></div>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Prix (DH)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: 500"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes cliniques (Optionnel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Détails de l'intervention..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary px-5">Annuler</button>
                <button onClick={saveTooth} className="btn btn-primary px-5">
                  <Check className="w-4 h-4 mr-1" /> Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
