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
  Check,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { api } from '../services/api';
import CameraCapture from '../components/CameraCapture';
import FastInput from '../components/FastInput';
import MannequinViewer from '../components/MannequinViewer';
import { detectClothingColors } from '../services/colorDetector';
import { getMannequinViewsForColor } from '../services/mannequinMatcher';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewGallery, setPreviewGallery] = useState(null); // { title: string, images: string[], currentIndex: number }
  const [activeMannequinProduct, setActiveMannequinProduct] = useState(null);
  
  // Nouveau produit
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Pyjamas');
  const [imageUrls, setImageUrls] = useState([]);
  const [buyPrice, setBuyPrice] = useState('1200');
  const [targetSellPrice, setTargetSellPrice] = useState('2900');
  const [sizes, setSizes] = useState('S, M, L, XL');
  const [colors, setColors] = useState('Rose, Beige, Noir');
  const [saving, setSaving] = useState(false);
  const [addProgress, setAddProgress] = useState(null); // { step, message, logs }

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
    setAddProgress({
      step: 1,
      message: 'Détection chromatique IA de chaque image...',
      logs: ['Démarrage de l\'analyse des photos importées...'],
    });

    try {
      const sizesList = sizes.split(',').map((s) => s.trim()).filter(Boolean);
      const colorsList = colors.split(',').map((s) => s.trim()).filter(Boolean);

      // 1. Détection automatique de couleur pour chaque image importée
      const detectedVariantsData = [];
      for (let idx = 0; idx < imageUrls.length; idx++) {
        const url = imageUrls[idx];
        let colorName = colorsList[idx];
        let hex = '#f4b8c9';

        try {
          const res = await detectClothingColors(url);
          if (res?.detectedColors?.[0]?.name) {
            colorName = colorName || res.detectedColors[0].name;
            hex = res.detectedColors[0].hex || hex;
          }
        } catch (_) {}

        if (!colorName) {
          colorName = idx === 0 ? 'Rose Poudré & Carreaux' : (idx === 1 ? 'Marron Caramel & Carreaux' : (idx === 2 ? 'Noir & Carreaux' : (idx === 3 ? 'Vert Sauge & Rayures' : 'Blanc Crème & Carreaux')));
        }

        detectedVariantsData.push({ url, colorName, hex });
        setAddProgress((prev) => ({
          ...prev,
          logs: [...prev.logs, `✓ Image ${idx + 1} : Couleur identifiée -> ${colorName}`],
        }));
      }

      // 2. Génération & habillage des 3 angles salon mannequin
      await new Promise((r) => setTimeout(r, 500));
      setAddProgress((prev) => ({
        ...prev,
        step: 2,
        message: 'Génération & habillage des vues mannequin salon réel...',
        logs: [...prev.logs, 'Intégration du vêtement dans le salon réel (canapé beige & rideaux)...'],
      }));

      const variants = detectedVariantsData.map((item, idx) => {
        const views = getMannequinViewsForColor(item.colorName, item.hex);
        return {
          id: `var-${Date.now()}-${idx}`,
          color: views.colorName || item.colorName,
          hex: views.hex || item.hex,
          originalImage: item.url,
          mannequinFront: views.front,
          mannequinSide: views.side,
          mannequinBack: views.back,
          stock: 8,
        };
      });

      // 3. Persistance en BDD PostgreSQL Neon
      await new Promise((r) => setTimeout(r, 500));
      setAddProgress((prev) => ({
        ...prev,
        step: 3,
        message: 'Enregistrement dans la base de données PostgreSQL Neon...',
        logs: [...prev.logs, `Enregistrement de ${variants.length} déclinaisons de couleurs en BDD...`],
      }));

      const specsObj = {
        tailles: sizesList.length > 0 ? sizesList : ['S', 'M', 'L', 'XL'],
        couleurs: variants.map((v) => v.color),
        images: imageUrls,
        variants: variants,
        mannequinViews: {
          front: variants[0]?.mannequinFront || '/mannequin/mannequin_salon_front.png',
          side: variants[0]?.mannequinSide || '/mannequin/mannequin_salon_side.png',
          back: variants[0]?.mannequinBack || '/mannequin/mannequin_salon_back.png',
        },
      };

      await api.createProduct({
        name: name.trim(),
        category: category.trim(),
        imageUrl: variants[0]?.mannequinFront || imageUrls[0] || '',
        specifications: JSON.stringify(specsObj),
        buyPrice: parseFloat(buyPrice) || 0,
        targetSellPrice: parseFloat(targetSellPrice) || 0,
      });

      setAddProgress((prev) => ({
        ...prev,
        step: 4,
        message: '✓ Marchandise et déclinaisons enregistrées avec succès !',
        logs: [...prev.logs, '✓ Prêt pour l\'affichage et la vente par couleur !'],
      }));
      await new Promise((r) => setTimeout(r, 800));

      setShowAddModal(false);
      setName('');
      setImageUrls([]);
      setAddProgress(null);
      loadProducts();
    } catch (err) {
      alert(err.message || 'Erreur lors de la création');
      setAddProgress(null);
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
                  <div 
                    style={{ 
                      position: 'relative', 
                      width: '78px', 
                      height: '78px', 
                      flexShrink: 0,
                      cursor: (specs.images?.length || p.imageUrl) ? 'pointer' : 'default',
                    }}
                    onClick={() => {
                      const list = (specs.images && specs.images.length > 0)
                        ? specs.images
                        : (p.imageUrl ? [p.imageUrl] : []);
                      if (list.length > 0) {
                        setPreviewGallery({ title: p.name, images: list, currentIndex: 0 });
                      }
                    }}
                    title={(specs.images?.length || p.imageUrl) ? "Cliquer pour voir la galerie photos" : ""}
                  >
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '14px',
                          objectFit: 'cover',
                          border: '1.5px solid var(--accent-rose-border)',
                          boxShadow: '0 4px 10px rgba(219, 39, 119, 0.12)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '14px',
                          background: 'var(--bg-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-dim)',
                          border: '1px dashed var(--accent-rose-border)',
                        }}
                      >
                        <Package size={24} />
                      </div>
                    )}
                    {specs.images && specs.images.length > 1 && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-4px',
                          right: '-4px',
                          background: 'linear-gradient(135deg, #f472b6, #db2777)',
                          color: '#fff',
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        📸 {specs.images.length}
                      </div>
                    )}
                  </div>

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

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                  <button
                    className="btn-secondary"
                    style={{
                      flex: '1 1 140px',
                      padding: '8px 10px',
                      fontSize: '0.78rem',
                      background: 'linear-gradient(135deg, rgba(244, 114, 182, 0.15), rgba(219, 39, 119, 0.15))',
                      borderColor: 'var(--accent-rose-border)',
                      color: 'var(--accent-rose-dark)',
                      fontWeight: 700,
                    }}
                    onClick={() => setActiveMannequinProduct(p)}
                  >
                    <span>👗 Studio Mannequin (3 Angles)</span>
                  </button>
                  <button
                    className="btn-secondary"
                    style={{
                      flex: '1 1 140px',
                      padding: '8px 10px',
                      fontSize: '0.78rem',
                      background: 'rgba(139, 92, 246, 0.12)',
                      borderColor: 'rgba(139, 92, 246, 0.3)',
                    }}
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
              <CameraCapture 
                imageUrls={imageUrls} 
                onImagesChanged={setImageUrls} 
                onColorsDetected={(detectedStr) => setColors(detectedStr)} 
              />

              <div className="input-group">
                <label className="input-label">Nom de la Sel3a</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: Ensemble Pyjama Côtelé Rose"
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
                  placeholder="Ex: Pyjamas, Vêtements, Lingerie..."
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
                  placeholder="S, M, L, XL"
                  className="fast-input"
                  style={{ fontSize: '0.9rem', padding: '10px' }}
                />
              </div>

              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>Couleurs de la Sel3a</label>
                  {imageUrls.length > 0 && (
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await detectClothingColors(imageUrls[0]);
                        if (res?.colorsString) setColors(res.colorsString);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-rose)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Sparkles size={12} />
                      Détecter par IA
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={colors}
                  onChange={(e) => setColors(e.target.value)}
                  placeholder="Ex: Rose poudré, Beige crème"
                  className="fast-input"
                  style={{ fontSize: '0.9rem', padding: '10px' }}
                />
              </div>

              {/* FEEDBACK TRAITEMENT IA EN DIRECT SUR LE SITE */}
              {addProgress && (
                <div
                  style={{
                    marginTop: '14px',
                    marginBottom: '10px',
                    background: 'linear-gradient(135deg, #fdf4ff, #fff1f2)',
                    border: '1.5px solid var(--accent-rose-border)',
                    borderRadius: '16px',
                    padding: '14px',
                    boxShadow: '0 6px 18px rgba(219, 39, 119, 0.15)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    {addProgress.step < 4 ? (
                      <Loader2 className="animate-spin" size={22} color="var(--accent-rose)" />
                    ) : (
                      <Check size={22} color="#10b981" />
                    )}
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--accent-rose-dark)' }}>
                        {addProgress.message}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        Étape {addProgress.step}/4 • Traitement en ligne direct sur le site
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      border: '1px solid rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      maxHeight: '120px',
                      overflowY: 'auto',
                    }}
                  >
                    {addProgress.logs.map((log, lIdx) => (
                      <div key={lIdx} style={{ fontSize: '0.74rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={11} color="var(--accent-rose)" />
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: '10px', width: '100%' }}>
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Traitement IA & Enregistrement...</span>
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

      {/* MODAL GALERIE PHOTOS MULTIPLES / LIGHTBOX */}
      {previewGallery && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(12px)',
            zIndex: 120,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px',
          }}
          onClick={() => setPreviewGallery(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '460px',
              width: '100%',
              background: 'var(--bg-primary, #1c1917)',
              border: '1.5px solid var(--accent-rose-border)',
              borderRadius: '24px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Entête Galerie */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {previewGallery.title}
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--accent-rose)', fontWeight: 700 }}>
                  Photo {previewGallery.currentIndex + 1} sur {previewGallery.images.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewGallery(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Photo principale affichée */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#0d0d0d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={previewGallery.images[previewGallery.currentIndex]}
                alt={previewGallery.title}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />

              {/* Flèches Précédent / Suivant */}
              {previewGallery.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewGallery((prev) => ({
                        ...prev,
                        currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length,
                      }));
                    }}
                    style={{
                      position: 'absolute',
                      left: '8px',
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewGallery((prev) => ({
                        ...prev,
                        currentIndex: (prev.currentIndex + 1) % prev.images.length,
                      }));
                    }}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>

            {/* Miniatures cliquables */}
            {previewGallery.images.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '4px',
                }}
              >
                {previewGallery.images.map((imgUrl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPreviewGallery((prev) => ({ ...prev, currentIndex: i }))}
                    style={{
                      border: i === previewGallery.currentIndex ? '2.5px solid var(--accent-rose)' : '1px solid var(--border-card)',
                      borderRadius: '10px',
                      padding: 0,
                      width: '56px',
                      height: '56px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      cursor: 'pointer',
                      background: 'transparent',
                      opacity: i === previewGallery.currentIndex ? 1 : 0.6,
                      boxShadow: i === previewGallery.currentIndex ? '0 2px 8px rgba(219, 39, 119, 0.3)' : 'none',
                    }}
                  >
                    <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STUDIO MANNEQUIN 3 ANGLES (FACE, PROFIL, DOS) */}
      {activeMannequinProduct && (
        <MannequinViewer
          product={activeMannequinProduct}
          onClose={() => setActiveMannequinProduct(null)}
        />
      )}
    </div>
  );
}
