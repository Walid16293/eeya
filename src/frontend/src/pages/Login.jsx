import React, { useState } from 'react';
import { Shield, Lock, ArrowRight, Loader2, UserCheck } from 'lucide-react';
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
    <div style={{ padding: '30px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #06b6d4, #10b981)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(6, 182, 212, 0.35)',
            marginBottom: '16px',
          }}
        >
          <Shield size={34} />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
          Le Laboratoire
        </h1>
        <p style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Maximisation de la Fayda & Tests 6 Jours
        </p>
      </div>

      <div className="glass-card" style={{ margin: 0 }}>
        <div style={{ marginBottom: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Sélectionnez votre profil de gérant :
        </div>

        {/* Boutons de sélection rapide entre les 2 associés */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => handleSelectAdmin('admin1', 'Laboratoire1@2026')}
            style={{
              padding: '12px 10px',
              borderRadius: '12px',
              border: username === 'admin1' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-card)',
              background: username === 'admin1' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <UserCheck size={18} color={username === 'admin1' ? 'var(--accent-cyan)' : 'var(--text-dim)'} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Associé 1</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Terrain & Stock</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectAdmin('admin2', 'Laboratoire2@2026')}
            style={{
              padding: '12px 10px',
              borderRadius: '12px',
              border: username === 'admin2' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-card)',
              background: username === 'admin2' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <UserCheck size={18} color={username === 'admin2' ? 'var(--accent-cyan)' : 'var(--text-dim)'} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Associé 2</span>
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
              style={{ fontSize: '1rem', padding: '12px' }}
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
                style={{ fontSize: '1rem', padding: '12px' }}
              />
              <span className="input-suffix">
                <Lock size={16} />
              </span>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#fca5a5',
                fontSize: '0.82rem',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Connexion sécurisée...</span>
              </>
            ) : (
              <>
                <span>Accéder au Laboratoire</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
        🔒 Plateforme privée fermée • Déployée pour les 2 administrateurs uniquement
      </div>
    </div>
  );
}
