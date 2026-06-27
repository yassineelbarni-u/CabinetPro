import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Activity, ShieldCheck, BarChart3, ChevronRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

const FEATURES = [
  {
    icon: Activity,
    title: 'Suivi en temps réel',
    desc: 'Activité du cabinet, recettes et rendez-vous du jour en un coup d\'œil.',
  },
  {
    icon: ShieldCheck,
    title: 'Dossiers sécurisés',
    desc: 'Données patients chiffrées, sauvegardées et conformes aux normes médicales.',
  },
  {
    icon: BarChart3,
    title: 'Comptabilité intégrée',
    desc: 'Suivi des paiements, impayés et bénéfice net automatisé.',
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ── Panneau gauche ─────────────────────────────────────── */}
      <div className="login-left">
        {/* Logo + titre */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '2.5rem' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'linear-gradient(135deg, #06B6D4, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(6,182,212,0.35)',
              border: '1px solid rgba(255,255,255,0.20)',
            }}>
              <Stethoscope style={{ width: 26, height: 26, color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                CabinetPro
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(6,182,212,0.75)', fontWeight: 500, marginTop: 2 }}>
                Cabinet Dentaire
              </div>
            </div>
          </div>

          <h2 style={{
            fontSize: '2.75rem', fontWeight: 900, color: '#fff',
            letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '1.25rem',
          }}>
            Gestion médicale{' '}
            <span style={{
              background: 'linear-gradient(90deg, #22D3EE, #34D399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>simplifiée.</span>
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, maxWidth: 380 }}>
            Gérez vos patients, rendez-vous, paiements et comptabilité depuis une seule plateforme sécurisée.
          </p>
        </div>

        {/* Feature cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', position: 'relative', zIndex: 1 }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="login-stat-card">
              <div className="login-stat-icon">
                <Icon style={{ width: 20, height: 20, color: '#22D3EE' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer bas */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.30)', textAlign: 'center' }}>
            © 2026 CabinetPro — Conçu pour les professionnels de santé
          </p>
        </div>
      </div>

      {/* ── Panneau droit — Formulaire ─────────────────────────── */}
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'linear-gradient(160deg, #F0F7FA 0%, #ECFEFF 100%)',
        minHeight: '100vh',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 440,
          background: '#fff',
          borderRadius: 28,
          boxShadow: '0 20px 60px rgba(14,116,144,0.14), 0 4px 16px rgba(14,116,144,0.08)',
          border: '1px solid #E0EEF2',
          overflow: 'hidden',
        }}>
          {/* En-tête de la card */}
          <div style={{
            background: 'linear-gradient(135deg, #0E7490 0%, #0891B2 60%, #06B6D4 100%)',
            padding: '2rem 2rem 1.75rem',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Cercle décoratif */}
            <div style={{
              position: 'absolute', top: '-30%', right: '-10%',
              width: 160, height: 160, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.25)',
              }}>
                <Stethoscope style={{ width: 20, height: 20, color: '#fff' }} />
              </div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(255,255,255,0.80)', letterSpacing: '0.05em' }}>
                CABINETPRO
              </span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', marginBottom: 4 }}>
              Bienvenue 👋
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)' }}>
              Connectez-vous à votre espace professionnel
            </p>
          </div>

          {/* Corps du formulaire */}
          <div style={{ padding: '1.75rem 2rem 2rem' }}>
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">
                  Adresse email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="admin@cabinetpro.ma"
                  required
                  autoComplete="email"
                />
              </div>

              {/* Mot de passe */}
              <div className="form-group">
                <label className="form-label" htmlFor="login-password">
                  Mot de passe
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute', right: '0.875rem', top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#8BA7BE', background: 'none', border: 'none',
                      cursor: 'pointer', padding: 4, borderRadius: 6,
                      display: 'flex', alignItems: 'center',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#06B6D4'}
                    onMouseLeave={e => e.currentTarget.style.color = '#8BA7BE'}
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword
                      ? <EyeOff style={{ width: 18, height: 18 }} />
                      : <Eye style={{ width: 18, height: 18 }} />}
                  </button>
                </div>
              </div>

              {/* Se souvenir + Mot de passe oublié */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    style={{
                      width: 16, height: 16,
                      accentColor: '#06B6D4',
                      borderRadius: 4,
                    }}
                  />
                  <span style={{ fontSize: '0.8125rem', color: '#4A6580' }}>Se souvenir de moi</span>
                </label>
                <a
                  href="#"
                  style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0891B2', textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#06B6D4'}
                  onMouseLeave={e => e.currentTarget.style.color = '#0891B2'}
                >
                  Mot de passe oublié ?
                </a>
              </div>

              {/* Bouton */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  fontSize: '0.9375rem',
                  borderRadius: 12,
                  marginTop: '0.375rem',
                  justifyContent: 'center',
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="spinner spinner-sm" style={{ width: 20, height: 20 }} />
                    Connexion en cours...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    Se connecter
                    <ChevronRight style={{ width: 18, height: 18 }} />
                  </span>
                )}
              </button>
            </form>

            {/* Accès demo */}
            <div style={{
              marginTop: '1.5rem',
              padding: '0.875rem',
              background: '#F0FDFF',
              border: '1px solid #A5F3FC',
              borderRadius: 12,
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '0.75rem', color: '#0E7490', fontWeight: 600, marginBottom: 3 }}>
                🔑 Accès démo
              </p>
              <p style={{ fontSize: '0.75rem', color: '#4A6580', fontFamily: 'monospace' }}>
                admin@cabinetpro.ma &nbsp;/&nbsp; admin123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
