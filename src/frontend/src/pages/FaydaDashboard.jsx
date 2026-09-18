import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, PieChart, ShieldCheck, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { api } from '../services/api';

export default function FaydaDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await api.getGlobalSummary();
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader2 className="animate-spin" size={32} color="var(--accent-cyan)" />
      </div>
    );
  }

  const isPositive = (summary?.totalNetFayda || 0) >= 0;

  return (
    <div>
      <header className="app-header">
        <div className="brand-badge">
          <img
            src="/logo.png"
            alt="Eya Logo"
            className="brand-logo-img"
          />
          <div>
            <div className="brand-title">Eya • Bilan Fayda</div>
            <div className="brand-subtitle">Rentabilité & Trésorerie</div>
          </div>
        </div>
      </header>

      <div style={{ padding: '8px 0' }}>
        {/* HERO FAYDA CUMULÉE */}
        <div className="glass-card fayda-hero">
          <span className="tag tag-active" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'transparent' }}>
            Bénéfice Net Réel Consolidé
          </span>
          <div className={`fayda-large-amount ${!isPositive ? 'loss' : ''}`} style={{ fontSize: '2.5rem', margin: '12px 0' }}>
            {isPositive ? `+${(summary?.totalNetFayda || 0).toLocaleString()} DA` : `${(summary?.totalNetFayda || 0).toLocaleString()} DA`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700 }}>
            <span style={{ color: isPositive ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center' }}>
              {isPositive ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
              ROI Global : {summary?.overallROI || 0}%
            </span>
            <span style={{ color: 'var(--text-dim)' }}>•</span>
            <span style={{ color: 'var(--text-muted)' }}>
              {summary?.totalConfirmedOrders || 0} commandes livrées
            </span>
          </div>
        </div>

        {/* DÉPENSES & ENCAISSEMENTS */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} color="var(--accent-cyan)" />
            <span>Structure des Coûts & Revenus</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Chiffre d'Affaires Brut</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'JetBrains Mono', color: '#38bdf8' }}>
                {(summary?.totalRevenue || 0).toLocaleString()} DA
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ras Lmal Investi (Marchandise)</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
                {(summary?.totalRasLmalInvested || 0).toLocaleString()} DA
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sponsoring Ads Consommé</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'JetBrains Mono', color: '#f59e0b' }}>
                {(summary?.totalAdsConsumed || 0).toLocaleString()} DA
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Logistique (Tickets Bureau)</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
                {(summary?.totalTicketBureauPaid || 0).toLocaleString()} DA
              </span>
            </div>
          </div>
        </div>

        {/* ACTIVITÉ DES TESTS */}
        <div className="metrics-grid" style={{ margin: '0 16px' }}>
          <div className="glass-card" style={{ margin: 0, padding: '16px' }}>
            <span className="metric-label">Tests Actifs</span>
            <span className="metric-value" style={{ color: 'var(--accent-cyan)' }}>
              {summary?.activeTestsCount || 0}
            </span>
          </div>
          <div className="glass-card" style={{ margin: 0, padding: '16px' }}>
            <span className="metric-label">Tests Clôturés</span>
            <span className="metric-value">
              {summary?.completedTestsCount || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
