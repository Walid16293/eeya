import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Sparkles, 
  Trash2, 
  Tag, 
  Loader2, 
  ArrowUpRight,
  ExternalLink,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import CameraCapture from '../components/CameraCapture';
import FastInput from '../components/FastInput';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Nouveau produit
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Vêtements');
  const [imageUrl, setImageUrl] = useState('');
  const [buyPrice, setBuyPrice] = useState('1200');
  const [targetSellPrice, setTargetSellPrice] = useState('2900');
  const [sizes, setSizes] = useState('M, L, XL');
  const [colors, setColors] = useState('Noir, Bleu');
  const [saving, setSaving] = useState(false);

  // Recherche de marché IA
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [activeProductForAi, setActiveProductForAi] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts();
      setProducts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const specsObj = {
        tailles: sizes.split(',').map((s) => s.trim()).filter(Boolean),
        couleurs: colors.split(',').map((c) => c.trim()).filter(Boolean),
      };

      await api.createProduct({
        name: name.trim(),
        category: category.trim(),
        imageUrl: imageUrl.trim(),
        specifications: JSON.stringify(specsObj),
        buyPrice: parseFloat(buyPrice) || 0,
        targetSellPrice: parseFloat(targetSellPrice) || 0,
      });

      setShowAddModal(false);
      setName('');
      setImageUrl('');
      loadProducts();
    } catch (err) {
      alert(err.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette marchandise ?')) return;
    try {
      await api.deleteProduct(id);
      loadProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRunAiResearch = async (product) => {
    setActiveProductForAi(product);
    setAiLoading(true);
    setAiResult(null);

    try {
      const result = await api.runMarketResearch(product.id);
      setAiResult(result);
    } catch (err) {
      alert('Erreur lors de l\'analyse IA de marché : ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyPsychologicalPrice = async (newPrice) => {
    if (!activeProductForAi) return;
    try {
      await api.updateProduct(activeProductForAi.id, { targetSellPrice: newPrice });
      alert(`Prix mis à jour à ${newPrice.toLocaleString()} DA !`);
      setAiResult(null);
      setActiveProductForAi(null);
      loadProducts();
    } catch (err) {
      alert(err.message);
    }
  };

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
            <div className="brand-title">Eya • Collection Sel3a</div>
            <div className="brand-subtitle">Marchandises & Prix IA</div>
          </div>
        </div>
        <button
          className="btn-primary"
          style={{ width: 'auto', padding: '8px 14px', fontSize: '0.82rem' }}
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} />
          <span>Ajouter</span>
        </button>
      </header>

      {/* LISTE DES PRODUITS */}
      <div style={{ padding: '8px 0' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 className="animate-spin" size={28} color="var(--accent-cyan)" />
          </div>
        ) : products.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '36px 20px' }}>
            <Package size={36} color="var(--text-dim)" style={{ marginBottom: '10px' }} />
            <div style={{ fontWeight: 700, marginBottom: '6px' }}>Aucune marchandise enregistrée</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '18px' }}>
              Photographiez et ajoutez votre premier échantillon de test.
            </div>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              <span>Ajouter une Sel3a</span>
            </button>
          </div>
        ) : (
          products.map((p) => {
            let specs = {};
            try {
              specs = JSON.parse(p.specifications || '{}');
            } catch (_) {}

            return (
              <div key={p.id} className="glass-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        border: '1px solid var(--border-card)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-dim)',
                      }}
                    >
                      <Package size={24} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
                          {p.category}
                        </span>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px', wordBreak: 'break-word' }}>
                          {p.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => handleDelete(p.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'baseline' }}>
                      <div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Achat: </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
                          {p.buyPrice.toLocaleString()} DA
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Vente: </span>
                        <span style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'JetBrains Mono', color: '#34d399' }}>
                          {p.targetSellPrice.toLocaleString()} DA
                        </span>
                      </div>
                    </div>

                    {/* Spécifications JSONB dynamiques */}
                    {specs.tailles && (
                      <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                        {specs.tailles.map((t, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem', background: 'rgba(139, 92, 246, 0.12)', borderColor: 'rgba(139, 92, 246, 0.3)' }}
                    onClick={() => handleRunAiResearch(p)}
                  >
                    <Sparkles size={15} color="#a78bfa" />
                    <span style={{ color: '#c4b5fd' }}>Scraping & Prix IA</span>
                  </button>
                  {p.hasActiveTest && (
                    <span className="tag tag-active" style={{ display: 'flex', alignItems: 'center' }}>
                      Test en cours
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL AJOUT PRODUIT AVEC CAMÉRA DORSALE */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '540px',
              margin: '0 auto',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              maxHeight: '90vh',
              overflowY: 'auto',
              paddingBottom: '30px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Nouvelle Sel3a</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleCreateProduct}>
              <CameraCapture imageUrl={imageUrl} onImageUploaded={setImageUrl} />

              <div className="input-group">
                <label className="input-label">Nom de la Sel3a</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: Montre Connectée Ultra Pro"
                  className="fast-input"
                  style={{ fontSize: '1rem', padding: '12px' }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Catégorie</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Électronique, Vêtements, Maison..."
                  className="fast-input"
                  style={{ fontSize: '0.95rem', padding: '12px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <FastInput
                  label="Prix d'Achat (Gros)"
                  value={buyPrice}
                  onChange={setBuyPrice}
                  suffix="DA"
                />
                <FastInput
                  label="Prix Vente Cible"
                  value={targetSellPrice}
                  onChange={setTargetSellPrice}
                  suffix="DA"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Tailles (séparées par virgule)</label>
                <input
                  type="text"
                  value={sizes}
                  onChange={(e) => setSizes(e.target.value)}
                  placeholder="M, L, XL"
                  className="fast-input"
                  style={{ fontSize: '0.9rem', padding: '10px' }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Couleurs disponibles</label>
                <input
                  type="text"
                  value={colors}
                  onChange={(e) => setColors(e.target.value)}
                  placeholder="Noir, Argent, Bleu"
                  className="fast-input"
                  style={{ fontSize: '0.9rem', padding: '10px' }}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: '10px' }}>
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    <span>Enregistrer la Marchandise</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ANALYSE IA & SCRAPING DUCKDUCKGO */}
      {(aiLoading || aiResult) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              boxShadow: '0 12px 36px rgba(139, 92, 246, 0.25)',
              margin: 0,
            }}
          >
            {aiLoading ? (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <Loader2 className="animate-spin" size={38} color="#a78bfa" style={{ marginBottom: '14px' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                  Scraping & Analyse Marché en cours...
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Interrogation de DuckDuckGo Search sur Facebook, Instagram et TikTok en Algérie + Extraction sémantique Groq LLM.
                </p>
              </div>
            ) : aiResult ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="#a78bfa" />
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#c4b5fd' }}>
                      Rapport d'Intelligence Marché
                    </span>
                  </div>
                  <button
                    onClick={() => { setAiResult(null); setActiveProductForAi(null); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Fermer
                  </button>
                </div>

                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '12px' }}>
                  Produit : {aiResult.productName}
                </div>

                <div className="metrics-grid" style={{ marginBottom: '14px' }}>
                  <div className="metric-box">
                    <span className="metric-label">Prix Moyen Marché</span>
                    <span className="metric-value">{aiResult.averagePrice.toLocaleString()} DA</span>
                  </div>
                  <div className="metric-box" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                    <span className="metric-label" style={{ color: '#34d399' }}>Prix Psychologique</span>
                    <span className="metric-value" style={{ color: '#34d399' }}>
                      {aiResult.psychologicalPrice.toLocaleString()} DA
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '12px',
                    padding: '12px',
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                    marginBottom: '14px',
                  }}
                >
                  <strong style={{ color: '#fff' }}>Conseil Stratégique : </strong>
                  {aiResult.strategicAdvice}
                </div>

                <button
                  className="btn-primary btn-emerald"
                  onClick={() => handleApplyPsychologicalPrice(aiResult.psychologicalPrice)}
                >
                  <Check size={18} />
                  <span>Appliquer ce Prix ({aiResult.psychologicalPrice.toLocaleString()} DA)</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
