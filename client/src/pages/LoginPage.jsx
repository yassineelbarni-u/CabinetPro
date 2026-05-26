import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Activity, FileText, ChevronRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left side - Branding */}
      <div className="login-left">
        <div className="mb-12">
          <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mb-6">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-5xl font-extrabold text-white mb-4">
            Gestion médicale<br />
            <span>simplifiée.</span>
          </h2>
          <p className="text-lg text-white/70">
            CabinetPro vous aide à gérer vos patients, rendez-vous, paiements et votre comptabilité en un seul endroit.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 text-white/80">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#00BFA6]" />
            </div>
            <span>Suivi temps réel de votre activité</span>
          </div>
          <div className="flex items-center gap-4 text-white/80">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#00BFA6]" />
            </div>
            <span>Dossiers patients informatisés sécurisés</span>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="login-right w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Bienvenue sur CabinetPro</h3>
            <p className="text-gray-500">Connectez-vous pour accéder à votre espace</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="email">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                placeholder="admin@cabinetpro.ma"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="password">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between mt-2 mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                <span className="text-sm text-gray-600">Se souvenir de moi</span>
              </label>
              <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                Mot de passe oublié ?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transform transition hover:-translate-y-0.5 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Se connecter
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Demo Admin: admin@cabinetpro.ma / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
