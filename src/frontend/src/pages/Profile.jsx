import React, { useState, useEffect } from 'react';
import { ShieldCheck, Server, LogOut, Smartphone, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function Profile({ user, onLogout }) {
  const [health, setHealth] = useState(null);
  const [pinging, setPinging] = useState(false);

  useEffect(() => {
    checkServer();
  }, []);

  const checkServer = async () => {
    setPinging(true);
    try {
      const data = await api.checkHealth();
      setHealth(data);
    } catch (err) {
      setHealth({ status: 'OFFLINE', message: err.message });
    } finally {
      setPinging(false);
    }
  };

  return (
    <div>
      <header className="app-header">
        <div className="brand-badge">
          <div className="brand-icon" style={{ background: 'linear-gradient(135deg, #0284c7, #0d9488)' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="brand-title">Espace Associé</div>
            <div className="brand-subtitle">Sécurité & Système</div>
          </div>
        </div>
      </header>

      <div style={{ padding: '8px 0' }}>
        {/* CARTE UTILISATEUR CONNECTÉ */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #06b6d4, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: 800,
                color: '#fff',
              }}
            >
              {user?.username?.toUpperCase()?.slice(0, 2) || 'AD'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                {user?.fullName || 'Administrateur'}
              </h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                <span className="tag tag-active" style={{ fontSize: '0.65rem' }}>
                  {user?.role || 'Admin'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Identifiant : @{user?.username}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ÉTAT DU SERVEUR CLOUD */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Infrastructure Cloud (0 DA)</span>
            </div>
            <button
              onClick={checkServer}
              disabled={pinging}
              style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', padding: '4px' }}
            >
              <RefreshCw size={16} className={pinging ? 'animate-spin' : ''} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: health?.status === 'HEALTHY' ? '#34d399' : '#f87171',
                boxShadow: health?.status === 'HEALTHY' ? '0 0 10px #34d399' : 'none',
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {health?.status === 'HEALTHY' ? 'API Connectée & Opérationnelle' : 'Serveur en attente'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                PostgreSQL Neon • Cloudinary • Groq Cloud 24/7
              </div>
            </div>
          </div>
        </div>

        {/* INSTALLATION PWA SMARTPHONE */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Smartphone size={18} color="#38bdf8" />
            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Installation sur Smartphone (PWA)</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '10px' }}>
            Pour utiliser l'application comme une application native :
          </p>
          <ul style={{ fontSize: '0.78rem', color: 'var(--text-dim)', paddingLeft: '18px', lineHeight: 1.6 }}>
            <li><strong>Sur Android (Chrome)</strong> : Menu (3 points en haut à droite) → <em>"Ajouter à l'écran d'accueil"</em> ou <em>"Installer l'application"</em>.</li>
            <li><strong>Sur iPhone (Safari)</strong> : Bouton Partager (en bas) → <em>"Sur l'écran d'accueil"</em>.</li>
          </ul>
        </div>

        {/* DÉCONNEXION */}
        <div style={{ margin: '14px 16px' }}>
          <button className="btn-secondary" onClick={onLogout} style={{ width: '100%', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}>
            <LogOut size={16} />
            <span>Fermer la session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
