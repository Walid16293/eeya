import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  PlusCircle, 
  CheckCircle2, 
  AlertOctagon, 
  TrendingUp, 
  Sparkles, 
  Loader2, 
  ShoppingBag,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import FastInput from '../components/FastInput';
import TimelineDays from '../components/TimelineDays';
import SentinelBanner from '../components/SentinelBanner';

export default function Laboratory() {
  const [activeTest, setActiveTest] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingMetric, setSavingMetric] = useState(false);
  const [error, setError] = useState('');

  // Saisie journalière (Fast-Input)
  const [selectedDay, setSelectedDay] = useState(1);
  const [adsSpentToday, setAdsSpentToday] = useState('350');
  const [ordersToday, setOrdersToday] = useState('1');
  const [clicksToday, setClicksToday] = useState('25');
  const [impressionsToday, setImpressionsToday] = useState('1100');
  const [notesToday, setNotesToday] = useState('');

  // Nouveau test modal/form
  const [showNewTest, setShowNewTest] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [initialQuantity, setInitialQuantity] = useState('8');
  const [adsBudget, setAdsBudget] = useState('2000');
  const [ticketBureau, setTicketBureau] = useState('15');
  const [sellingPrice, setSellingPrice] = useState('2900');
  const [customRasLmal, setCustomRasLmal] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [testData, prodsData] = await Promise.all([
        api.getActiveTest(),
        api.getProducts(),
      ]);
      setActiveTest(testData);
      setProducts(prodsData || []);

      if (testData) {
        // Pré-remplir le jour sélectionné
        const nextDay = testData.currentDay > 0 && testData.currentDay < 6 
          ? testData.currentDay + 1 
          : testData.currentDay || 1;
        setSelectedDay(nextDay);
        loadDayData(testData, nextDay);
      }
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les données du laboratoire.');
    } finally {
      setLoading(false);
    }
  };

  const loadDayData = (test, day) => {
    const metric = test?.metrics?.find((m) => m.dayNumber === day);
    if (metric) {
      setAdsSpentToday(metric.adsSpent.toString());
      setOrdersToday(metric.confirmedOrders.toString());
      setClicksToday(metric.clicks.toString());
      setImpressionsToday(metric.impressions.toString());
      setNotesToday(metric.notes || '');
    } else {
      setAdsSpentToday('350');
      setOrdersToday('1');
      setClicksToday('20');
      setImpressionsToday('1000');
      setNotesToday('');
    }
  };

  const handleSelectDay = (day) => {
    setSelectedDay(day);
    loadDayData(activeTest, day);
  };

  const handleSaveDailyMetric = async (e) => {
    e.preventDefault();
    if (!activeTest) return;

    setSavingMetric(true);
    try {
      const updated = await api.logDailyMetric(activeTest.id, {
        dayNumber: selectedDay,
        adsSpent: parseFloat(adsSpentToday) || 0,
        confirmedOrders: parseInt(ordersToday, 10) || 0,
        clicks: parseInt(clicksToday, 10) || 0,
        impressions: parseInt(impressionsToday, 10) || 0,
        notes: notesToday,
      });
      setActiveTest(updated);
      alert(`Bilan du Jour ${selectedDay} enregistré avec succès !`);
    } catch (err) {
      alert(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSavingMetric(false);
    }
  };

  const handleStartTest = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('Veuillez sélectionner une marchandise.');
      return;
    }

    try {
      const newTest = await api.startTest({
        productId: selectedProductId,
        initialQuantity: parseInt(initialQuantity, 10) || 8,
        adsBudgetTotal: parseFloat(adsBudget) || 2000,
        ticketBureauFee: parseFloat(ticketBureau) || 15,
        sellingPrice: parseFloat(sellingPrice) || 0,
        rasLmal: customRasLmal ? parseFloat(customRasLmal) : null,
      });
      setActiveTest(newTest);
      setShowNewTest(false);
    } catch (err) {
      alert(err.message || 'Erreur lors du lancement du test');
    }
  };

  const handleCompleteTest = async () => {
    if (!window.confirm('Voulez-vous clôturer ce test de 6 jours avec succès ?')) return;
    try {
      await api.completeTest(activeTest.id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAbortTest = async () => {
    if (!window.confirm('⚠️ ALERTE : Confirmez-vous l\'arrêt d\'urgence de ce test pour couper les dépenses Ads ?')) return;
    try {
      await api.abortTest(activeTest.id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
        <Loader2 className="animate-spin" size={32} color="var(--accent-cyan)" />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Synchronisation du Laboratoire...</span>
      </div>
    );
  }

  return (
    <div>
      {/* En-tête de page */}
      <header className="app-header">
        <div className="brand-badge">
          <div className="brand-icon">
            <FlaskConical size={20} />
          </div>
          <div>
            <div className="brand-title">Le Laboratoire</div>
            <div className="brand-subtitle">Cycle 6 Jours • Fayda</div>
          </div>
        </div>
        {!activeTest && !showNewTest && (
          <button 
            className="btn-primary" 
            style={{ width: 'auto', padding: '8px 14px', fontSize: '0.82rem' }}
            onClick={() => setShowNewTest(true)}
          >
            <PlusCircle size={16} />
            <span>Nouveau Test</span>
          </button>
        )}
      </header>

      {/* CAS 1 : UN TEST EST ACTIF */}
      {activeTest ? (
        <>
          {/* CARTE HERO FAYDA EN DIRECT */}
          <div className="glass-card fayda-hero">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="tag tag-active">Test Actif • 6 Jours</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '6px' }}>
                  {activeTest.productName}
                </h2>
              </div>
              {activeTest.productImageUrl && (
                <img
                  src={activeTest.productImageUrl}
                  alt={activeTest.productName}
                  style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              )}
            </div>

            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Fayda Nette Actuelle (Bénéfice Réel)
              </div>
              <div className={`fayda-large-amount ${activeTest.netFayda < 0 ? 'loss' : ''}`}>
                {activeTest.netFayda >= 0 ? `+${activeTest.netFayda.toLocaleString()} DA` : `${activeTest.netFayda.toLocaleString()} DA`}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.82rem', fontWeight: 600 }}>
                <span style={{ color: activeTest.roi >= 0 ? '#34d399' : '#f87171' }}>
                  ROI : {activeTest.roi}%
                </span>
                <span style={{ color: 'var(--text-dim)' }}>•</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  Ventes : {activeTest.totalConfirmedOrders} pcs ({activeTest.totalRevenue.toLocaleString()} DA)
                </span>
              </div>
            </div>

            {/* Grille des paramètres financiers du test */}
            <div className="metrics-grid">
              <div className="metric-box">
                <span className="metric-label">Ras Lmal (Stock)</span>
                <span className="metric-value">{activeTest.rasLmal.toLocaleString()} DA</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Ads Consommé</span>
                <span className="metric-value" style={{ color: activeTest.adsBudgetRemaining < 500 ? '#f59e0b' : '#fff' }}>
                  {activeTest.totalAdsSpent.toLocaleString()} / {activeTest.adsBudgetTotal.toLocaleString()} DA
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Stock Restant</span>
                <span className="metric-value" style={{ color: activeTest.remainingQuantity <= 2 ? '#38bdf8' : '#fff' }}>
                  {activeTest.remainingQuantity} / {activeTest.initialQuantity} pcs
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Prix de Vente</span>
                <span className="metric-value">{activeTest.sellingPrice.toLocaleString()} DA</span>
              </div>
            </div>
          </div>

          {/* SENTINELLES D'ARBITRAGE AUTOMATIQUE */}
          <SentinelBanner alerts={activeTest.activeAlerts} />

          {/* TIMELINE VISUELLE DES 6 JOURS */}
          <TimelineDays
            currentDay={activeTest.currentDay}
            metrics={activeTest.metrics}
            selectedDay={selectedDay}
            onSelectDay={handleSelectDay}
          />

          {/* FORMULAIRE FAST-INPUT DU JOUR SÉLECTIONNÉ */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  Saisie Rapide • Jour {selectedDay}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Enregistrement du soir (Fast-Input mobile)
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                Ticket: {activeTest.ticketBureauFee} DA/colis
              </div>
            </div>

            <form onSubmit={handleSaveDailyMetric}>
              <FastInput
                label="Dépense Sponsoring Ads du Jour"
                value={adsSpentToday}
                onChange={setAdsSpentToday}
                quickSteps={[100, 300, 500]}
                suffix="DA"
              />

              <FastInput
                label="Commandes Confirmées / Livrées Aujourd'hui"
                value={ordersToday}
                onChange={setOrdersToday}
                quickSteps={[1, 2, 5]}
                suffix="pcs"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <FastInput
                  label="Clics Publicité"
                  value={clicksToday}
                  onChange={setClicksToday}
                  suffix="clics"
                />
                <FastInput
                  label="Impressions Ads"
                  value={impressionsToday}
                  onChange={setImpressionsToday}
                  suffix="vues"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Remarques ou retours clients</label>
                <input
                  type="text"
                  value={notesToday}
                  onChange={(e) => setNotesToday(e.target.value)}
                  placeholder="Ex: Beaucoup de messages sur la taille XL..."
                  className="fast-input"
                  style={{ fontSize: '0.9rem', padding: '10px 14px' }}
                />
              </div>

              <button type="submit" className="btn-primary btn-emerald" disabled={savingMetric}>
                {savingMetric ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Calcul de la Fayda...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Valider la Journée {selectedDay}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ACTIONS STRATÉGIQUES SUR LE TEST */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '14px 16px' }}>
            <button className="btn-secondary" onClick={handleCompleteTest}>
              <CheckCircle2 size={16} color="#34d399" />
              <span>Valider le Test</span>
            </button>
            <button className="btn-secondary" style={{ borderColor: 'rgba(239,68,68,0.3)' }} onClick={handleAbortTest}>
              <AlertOctagon size={16} color="#f87171" />
              <span style={{ color: '#fca5a5' }}>Arrêt d'Urgence</span>
            </button>
          </div>
        </>
      ) : (
        /* CAS 2 : AUCUN TEST ACTIF EN COURS */
        <div style={{ padding: '10px 0' }}>
          {showNewTest ? (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  Nouveau Test du Laboratoire
                </h2>
                <button
                  type="button"
                  onClick={() => setShowNewTest(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Annuler
                </button>
              </div>

              <form onSubmit={handleStartTest}>
                <div className="input-group">
                  <label className="input-label">Marchandise (Sel3a) à tester</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      const prod = products.find((p) => p.id === e.target.value);
                      if (prod) {
                        setSellingPrice(prod.targetSellPrice.toString());
                        setCustomRasLmal((prod.buyPrice * 8).toString());
                      }
                    }}
                    required
                    className="fast-input"
                    style={{ fontSize: '1rem', padding: '12px' }}
                  >
                    <option value="">Sélectionnez un produit...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Achat: {p.buyPrice} DA - Vente: {p.targetSellPrice} DA)
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <FastInput
                    label="Stock de Test (Qté)"
                    value={initialQuantity}
                    onChange={setInitialQuantity}
                    suffix="pcs"
                  />
                  <FastInput
                    label="Ras Lmal Total"
                    value={customRasLmal}
                    onChange={setCustomRasLmal}
                    placeholder="Auto"
                    suffix="DA"
                  />
                </div>

                <FastInput
                  label="Budget Sponsoring (Ads)"
                  value={adsBudget}
                  onChange={setAdsBudget}
                  quickSteps={[500, 1000]}
                  suffix="DA"
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <FastInput
                    label="Prix de Vente Unitaire"
                    value={sellingPrice}
                    onChange={setSellingPrice}
                    suffix="DA"
                  />
                  <FastInput
                    label="Ticket Bureau"
                    value={ticketBureau}
                    onChange={setTicketBureau}
                    suffix="DA"
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
                  <Sparkles size={18} />
                  <span>Démarrer le Test de 6 Jours</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-card" style={{ textAlign: 'center', padding: '36px 20px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'rgba(6, 182, 212, 0.12)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-cyan)',
                  marginBottom: '14px',
                }}
              >
                <FlaskConical size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
                Le Laboratoire est Prêt
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '22px' }}>
                Aucun test publicitaire n'est actif actuellement. Sélectionnez une marchandise pour démarrer la validation sur 6 jours avec un budget Ads contrôlé.
              </p>
              <button className="btn-primary" onClick={() => setShowNewTest(true)}>
                <PlusCircle size={18} />
                <span>Lancer un Test de Rentabilité</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
