import React, { useState } from 'react';
import { Lock, ArrowRight, Loader2, UserCheck, Sparkles, Moon } from 'lucide-react';
import { api } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin1');
  const [password, setPassword] = useState('Laboratoire1@2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectAdmin = (adminUser, adminPass) => {
    setUsername(adminUser);
    setPassword(adminPass);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login(username, password);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Identifiants invalides.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      
      {/* BRANDING LOGO & TITRE */}
      <div style={{ textAlign: 'center', marginBottom: '26px' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '12px' }}>
          <img
            src="/logo.png"
            alt="Eya Pyjamas Collection"
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              objectFit: 'cover',
              boxShadow: '0 8px 30px rgba(219, 39, 119, 0.28), 0 0 0 4px #fff, 0 0 0 7px rgba(244, 114, 182, 0.35)',
              display: 'block',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              background: 'linear-gradient(135deg, #fbcfe8, #f472b6)',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <Sparkles size={14} color="#831843" />
          </div>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em', marginBottom: '4px' }}>
          Eya
        </h1>
        <div style={{ fontSize: '0.78rem', color: 'var(--accent-rose-dark)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
          Pyjamas Collection • Le Laboratoire
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
          Maximisation de la Fayda & Tests 6 Jours
        </p>
      </div>

      {/* CARTE DE CONNEXION */}
      <div className="glass-card" style={{ margin: 0, padding: '24px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Espace Gérants :
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--accent-gold-dark)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Moon size={12} color="var(--accent-moon)" />
            Accès Privé
          </span>
        </div>

        {/* Boutons de sélection rapide entre les 2 associés */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => handleSelectAdmin('admin1', 'Laboratoire1@2026')}
            style={{
              padding: '12px 10px',
              borderRadius: '14px',
              border: username === 'admin1' ? '2px solid var(--accent-rose)' : '1px solid rgba(219, 39, 119, 0.15)',
              background: username === 'admin1' ? 'linear-gradient(145deg, #fff, #fce7f3)' : 'rgba(255, 255, 255, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              boxShadow: username === 'admin1' ? '0 4px 14px rgba(244, 114, 182, 0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <UserCheck size={18} color={username === 'admin1' ? 'var(--accent-rose)' : 'var(--text-dim)'} />
            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: username === 'admin1' ? 'var(--accent-rose-dark)' : 'var(--text-main)' }}>
              Associé 1
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Terrain & Sel3a</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectAdmin('admin2', 'Laboratoire2@2026')}
            style={{
              padding: '12px 10px',
              borderRadius: '14px',
              border: username === 'admin2' ? '2px solid var(--accent-rose)' : '1px solid rgba(219, 39, 119, 0.15)',
              background: username === 'admin2' ? 'linear-gradient(145deg, #fff, #fce7f3)' : 'rgba(255, 255, 255, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              boxShadow: username === 'admin2' ? '0 4px 14px rgba(244, 114, 182, 0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <UserCheck size={18} color={username === 'admin2' ? 'var(--accent-rose)' : 'var(--text-dim)'} />
            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: username === 'admin2' ? 'var(--accent-rose-dark)' : 'var(--text-main)' }}>
              Associé 2
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Direction & Ads</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Identifiant</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="fast-input"
              style={{ fontSize: '0.98rem', padding: '12px 14px' }}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Mot de passe</label>
            <div className="input-wrapper">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="fast-input"
                style={{ fontSize: '0.98rem', padding: '12px 14px' }}
              />
              <span className="input-suffix">
                <Lock size={16} color="var(--accent-rose)" />
              </span>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: '12px',
                padding: '10px 14px',
                color: '#be123c',
                fontSize: '0.82rem',
                marginBottom: '16px',
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Vérification sécurisée...</span>
              </>
            ) : (
              <>
                <span>Ouvrir Le Laboratoire</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
        🌸 Application Eya • Accès 24/7 strictement réservé aux 2 gérants
      </div>
    </div>
  );
}
