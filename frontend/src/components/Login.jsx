import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EyeIcon = ({ visible }) =>
  visible ? (
    // Eye open
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    // Eye closed (slash)
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDevResetUrl('');
    setResetLoading(true);

    if (!resetEmail.trim()) {
      setError('Veuillez entrer votre email');
      setResetLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim().toLowerCase() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data.message === 'Erreur serveur' && data.error
            ? `${data.message} (${data.error})`
            : data.message || "Impossible d'envoyer la demande";
        throw new Error(msg);
      }
      setSuccess(
        data.message ||
          'Si un compte existe pour cet email, vous recevrez un message avec un lien de réinitialisation.'
      );
      if (data.resetUrl) setDevResetUrl(data.resetUrl);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    try {
      const userData = await login(email, password);

      switch (userData.role.toLowerCase()) {
        case 'administrateur':
          navigate('/dashboard/AdminDashboard', { replace: true });
          break;
        case 'consommateur':
          navigate('/', { replace: true });
          break;
        case 'fournisseur':
          navigate('/dashboard/SupplierDashboard', { replace: true });
          break;
        case 'agent':
          navigate('/dashboard/AgentDashboard', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Erreur de connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  if (showResetForm) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>Mot de passe oublié</h2>

          {error && <div style={styles.error}>{error}</div>}

          {!success ? (
            <form onSubmit={handleForgotPassword} style={styles.form}>
              <p style={styles.infoText}>
                Entrez l'adresse email de votre compte. Si elle est reconnue, vous recevrez un lien pour choisir un nouveau mot de passe.
              </p>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => {
                    setResetEmail(e.target.value);
                    setError('');
                  }}
                  style={styles.input}
                  placeholder="votre@email.com"
                  required
                />
              </div>

              <button
                type="submit"
                style={{
                  ...styles.button,
                  opacity: resetLoading ? 0.7 : 1,
                  cursor: resetLoading ? 'not-allowed' : 'pointer'
                }}
                disabled={resetLoading}
              >
                {resetLoading ? 'Envoi en cours…' : 'Envoyer le lien par email'}
              </button>
            </form>
          ) : (
            <div style={{ ...styles.success, whiteSpace: 'pre-line' }} role="status">
              {success}
              {devResetUrl ? (
                <div style={{ marginTop: '12px' }}>
                  <a
                    href={devResetUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.resetLink}
                  >
                    Ouvrir le lien de réinitialisation (dev)
                  </a>
                </div>
              ) : null}
            </div>
          )}

          <p style={styles.text}>
            <button
              type="button"
              onClick={() => {
                setShowResetForm(false);
                setResetEmail('');
                setSuccess('');
                setDevResetUrl('');
                setError('');
              }}
              style={styles.backLink}
            >
              ← Retour à la connexion
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Connexion</h2>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              style={styles.input}
              placeholder="votre@email.com"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Mot de passe</label>
            {/* Wrapper relatif pour positionner l'icône */}
            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                style={styles.passwordInput}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={styles.eyeButton}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                <EyeIcon visible={showPassword} />
              </button>
            </div>
          </div>

          <p style={styles.forgotPassword}>
            <button
              type="button"
              onClick={() => setShowResetForm(true)}
              style={styles.forgotLink}
            >
              Mot de passe oublié ?
            </button>
          </p>

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            disabled={loading}
          >
            {loading ? 'Connexion en cours…' : 'Se connecter'}
          </button>
        </form>

        <p style={styles.text}>
          Pas encore de compte ?{' '}
          <Link to="/register" style={styles.link}>
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: '1rem'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '450px'
  },
  title: {
    textAlign: 'center',
    marginBottom: '30px',
    color: '#1f2937',
    fontSize: '2rem',
    fontWeight: '700'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#374151',
    fontSize: '0.875rem'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  /* Nouveau : wrapper pour le champ mot de passe */
  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  passwordInput: {
    width: '100%',
    padding: '12px 44px 12px 12px',   // padding-right pour laisser la place à l'icône
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    color: '#9ca3af',
    lineHeight: 1
  },
  button: {
    backgroundColor: '#16a34a',
    color: 'white',
    padding: '14px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '10px',
    transition: 'background-color 0.2s'
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    border: '1px solid #fecaca',
    fontWeight: '500',
    fontSize: '0.875rem'
  },
  success: {
    backgroundColor: '#f0fdf4',
    color: '#15803d',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    border: '1px solid #bbf7d0',
    fontWeight: '500',
    fontSize: '0.875rem',
    lineHeight: '1.5'
  },
  text: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#6b7280',
    fontSize: '0.875rem'
  },
  link: {
    color: '#16a34a',
    textDecoration: 'none',
    fontWeight: '600'
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: '#16a34a',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    padding: 0,
    textDecoration: 'none'
  },
  forgotPassword: {
    textAlign: 'right',
    margin: '-10px 0 15px 0'
  },
  forgotLink: {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    fontSize: '0.875rem',
    padding: 0,
    textDecoration: 'none'
  },
  resetLink: {
    color: '#16a34a',
    textDecoration: 'none',
    fontWeight: '700'
  },
  infoText: {
    color: '#6b7280',
    fontSize: '0.875rem',
    marginBottom: '1.5rem',
    lineHeight: '1.5'
  }
};

export default Login;
