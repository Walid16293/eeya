import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Check, 
  CheckCircle2, 
  TrendingUp, 
  Package, 
  Layers, 
  Clock, 
  Trash2, 
  Sparkles, 
  ArrowLeft, 
  ChevronRight, 
  Eye,
  Tag
} from 'lucide-react';
import { api } from '../services/api';
import FastInput from '../components/FastInput';
import MannequinViewer from '../components/MannequinViewer';
import { getMannequinViewsForColor } from '../services/mannequinMatcher';

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Navigation hiérarchique : null = vue globale, sinon le produit sélectionné
  const [activeProductView, setActiveProductView] = useState(null);
  const [activeMannequinView, setActiveMannequinView] = useState(null); // { product, color }

  // Ventes enregistrées (persistées localement et synchronisées)
  const [salesHistory, setSalesHistory] = useState([]);

  // Modal d'enregistrement final de la vente
  const [saleModalVariant, setSaleModalVariant] = useState(null); // { product, colorName, colorHex, rawImage, mannequinImage, sizes }
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const [soldPrice, setSoldPrice] = useState('2900');
  const [deliveryFee, setDeliveryFee] = useState('15');
  const [channel, setChannel] = useState('Instagram DM');
  const [savingSale, setSavingSale] = useState(false);
  const [successToast, setSuccessToast] = useState(null);

  useEffect(() => {
    loadData();
    try {
      const saved = localStorage.getItem('le_laboratoire_sales');
      if (saved) setSalesHistory(JSON.parse(saved));
    } catch (_) {}
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, test] = await Promise.all([
        api.getProducts(),
        api.getActiveTest(),
      ]);
      setProducts(prods || []);
      setActiveTest(test);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Construit la liste des variantes de couleur pour un produit donné
   * avec pour chaque couleur : sa photo originale et ses vues mannequin salon
   */
  const getProductColorVariants = (product) => {
    let specs = {};
    try {
      specs = typeof product.specifications === 'string' 
        ? JSON.parse(product.specifications || '{}') 
        : (product.specifications || {});
    } catch (_) {}

    // 1. Si les variantes existent déjà dans la base de données PostgreSQL Neon :
    if (specs.variants && Array.isArray(specs.variants) && specs.variants.length > 0) {
      return specs.variants.map((v) => {
        const matched = getMannequinViewsForColor(v.color, v.hex);
        return {
          id: v.id || `var-${v.color}`,
          name: v.color || matched.colorName,
          hex: v.hex || matched.hex,
          rawImage: v.originalImage || product.imageUrl,
          mannequinImage: v.mannequinFront || matched.front,
          mannequinSide: v.mannequinSide || matched.side,
          mannequinBack: v.mannequinBack || matched.back,
          sizes: specs.tailles || ['S', 'M', 'L', 'XL'],
          stockEstimate: v.stock !== undefined ? v.stock : 8,
        };
      });
    }

    // 2. Si le produit a plusieurs images importées dans la BDD (images: [...]) :
    const imagesList = (specs.images && specs.images.length > 0) 
      ? specs.images 
      : (product.imageUrl ? [product.imageUrl] : []);
    const colorsList = specs.couleurs || [];
    const sizesList = specs.tailles || ['S', 'M', 'L', 'XL'];

    return imagesList.map((imgUrl, idx) => {
      let colorName = colorsList[idx];
      if (!colorName) {
        colorName = idx === 0 ? 'Rose Poudré & Carreaux' : (idx === 1 ? 'Marron Caramel & Carreaux' : (idx === 2 ? 'Noir & Carreaux' : (idx === 3 ? 'Vert Sauge & Rayures' : 'Blanc Crème & Carreaux')));
      }

      const matched = getMannequinViewsForColor(colorName);

      return {
        id: `var-${product.id}-${idx}`,
        name: matched.colorName || colorName,
        hex: matched.hex,
        rawImage: imgUrl,
        mannequinImage: matched.front,
        mannequinSide: matched.side,
        mannequinBack: matched.back,
        sizes: sizesList,
        stockEstimate: 8,
      };
    });
  };

  const handleOpenSaleForm = (product, variant) => {
    setSaleModalVariant({
      product,
      colorName: variant.name,
      colorHex: variant.hex,
      rawImage: variant.rawImage,
      mannequinImage: variant.mannequinImage,
      sizes: variant.sizes,
    });
    setQuantity(1);
    setSelectedSize(variant.sizes[0] || 'M');
    setSoldPrice(product.targetSellPrice?.toString() || '2900');
    setDeliveryFee('15');
  };

  const handleConfirmSale = async (e) => {
    e.preventDefault();
    if (!saleModalVariant) return;

    setSavingSale(true);
    const unitPrice = parseFloat(soldPrice) || saleModalVariant.product.targetSellPrice || 0;
    const fee = parseFloat(deliveryFee) || 0;
    const totalRevenue = unitPrice * quantity;
    const totalCost = (saleModalVariant.product.buyPrice * quantity) + (fee * quantity);
    const netProfit = totalRevenue - totalCost;

    const newSale = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      productId: saleModalVariant.product.id,
      productName: saleModalVariant.product.name,
      colorName: saleModalVariant.colorName,
      colorHex: saleModalVariant.colorHex,
      image: saleModalVariant.mannequinImage || saleModalVariant.rawImage,
      quantity,
      size: selectedSize,
      unitPrice,
      totalRevenue,
      netProfit,
      channel,
    };

    // 1. Sauvegarder dans l'historique local
    const updatedHistory = [newSale, ...salesHistory];
    setSalesHistory(updatedHistory);
    try {
      localStorage.setItem('le_laboratoire_sales', JSON.stringify(updatedHistory));
    } catch (_) {}

    // 2. Décrémenter le stock dans la base de données PostgreSQL Neon
    try {
      let currentSpecs = {};
      try {
        currentSpecs = typeof saleModalVariant.product.specifications === 'string'
          ? JSON.parse(saleModalVariant.product.specifications || '{}')
          : (saleModalVariant.product.specifications || {});
      } catch (_) {}

      if (currentSpecs.variants && Array.isArray(currentSpecs.variants)) {
        currentSpecs.variants = currentSpecs.variants.map((v) => {
          if (v.color === saleModalVariant.colorName) {
            return { ...v, stock: Math.max(0, (v.stock || 8) - quantity) };
          }
          return v;
        });

        await api.updateProduct(saleModalVariant.product.id, {
          specifications: JSON.stringify(currentSpecs),
        });
        loadData();
      }
    } catch (err) {
      console.warn('Erreur synchronisation stock BDD:', err);
    }

    // 3. Si un test actif existe pour ce produit, synchroniser avec le bilan du jour
    if (activeTest && activeTest.productId === saleModalVariant.product.id) {
      try {
        const currentDay = activeTest.currentDay || 1;
        const currentOrders = activeTest.totalConfirmedOrders || 0;
        await api.logDailyMetric(activeTest.id, {
          dayNumber: currentDay,
          confirmedOrders: currentOrders + quantity,
          adsSpent: activeTest.totalAdsSpent || 0,
          clicks: 0,
          impressions: 0,
          notes: `Vente validée : ${quantity}x ${saleModalVariant.product.name} (${saleModalVariant.colorName} - Taille ${selectedSize}) via ${channel}`,
        });
      } catch (err) {
        console.warn('Sync avec test actif:', err);
      }
    }

    setSavingSale(false);
    setSaleModalVariant(null);
    setSuccessToast(`Vente validée ! +${totalRevenue.toLocaleString()} DA en caisse (Fayda : +${netProfit.toLocaleString()} DA)`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Filtrer les produits pour la vue globale
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  // Statistiques
  const totalRevenueAll = salesHistory.reduce((sum, s) => sum + (s.totalRevenue || 0), 0);
  const totalProfitAll = salesHistory.reduce((sum, s) => sum + (s.netProfit || 0), 0);
  const totalItemsSold = salesHistory.reduce((sum, s) => sum + (s.quantity || 0), 0);

  return (
    <div className="page-content" style={{ paddingBottom: '90px' }}>
      {/* Toast de confirmation */}
      {successToast && (
        <div
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff',
            borderRadius: '14px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 700,
            fontSize: '0.86rem',
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
          }}
        >
          <CheckCircle2 size={20} />
          <span>{successToast}</span>
        </div>
      )}

      {/* VUE 1 : CATALOGUE GLOBAL DES MARCHANDISES */}
      {!activeProductView ? (
        <>
          <header className="page-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="gold-badge">Point de Vente • Sel3a</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Vue Globale du Stock</span>
              </div>
              <h1 className="page-title" style={{ marginTop: '4px' }}>
                Enregistrer les Ventes
              </h1>
            </div>
          </header>

          {/* Métriques Rapides */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginBottom: '16px',
            }}
          >
            <div className="glass-card" style={{ padding: '12px 8px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Vendu</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                {totalItemsSold} <span style={{ fontSize: '0.7rem' }}>pcs</span>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '12px 8px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>Chiffre d'Affaires</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                {totalRevenueAll.toLocaleString()} <span style={{ fontSize: '0.68rem' }}>DA</span>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '12px 8px', textAlign: 'center', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <span style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 700 }}>Fayda Nette</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                +{totalProfitAll.toLocaleString()} <span style={{ fontSize: '0.68rem' }}>DA</span>
              </div>
            </div>
          </div>

          {/* Barre de Recherche */}
          <div className="search-bar" style={{ marginBottom: '16px' }}>
            <Search size={18} color="var(--accent-rose)" />
            <input
              type="text"
              placeholder="Rechercher une sel3a par nom ou catégorie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Liste Globale des Marchandises */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Sélectionnez une Marchandise ({filteredProducts.length})
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Cliquez pour voir les couleurs
              </span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
                <Package size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <p style={{ fontSize: '0.9rem' }}>Aucune marchandise trouvée.</p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const variants = getProductColorVariants(p);
                const totalStock = variants.reduce((sum, v) => sum + (v.stockEstimate || 0), 0);

                return (
                  <div
                    key={p.id}
                    className="glass-card"
                    style={{
                      padding: '16px 18px',
                      margin: '10px 0',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: '#ffffff',
                      border: '1.5px solid var(--accent-rose-border)',
                      borderRadius: '20px',
                      boxShadow: '0 4px 16px rgba(219, 39, 119, 0.06)',
                    }}
                    onClick={() => setActiveProductView(p)}
                  >
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Photo Couverture */}
                      <div
                        style={{
                          width: '82px',
                          height: '82px',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '2px solid var(--accent-rose-border)',
                          boxShadow: '0 4px 12px rgba(219, 39, 119, 0.12)',
                          background: '#fdf4ff',
                        }}
                      >
                        <img
                          src={variants[0]?.rawImage || p.imageUrl || '/mannequin/mannequin_salon_front.png'}
                          alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      {/* Infos Produit */}
                      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--accent-rose-dark)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {p.category}
                          </span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: '#059669',
                              padding: '2px 8px',
                              borderRadius: '20px',
                            }}
                          >
                            Stock : {totalStock} pcs
                          </span>
                          {p.hasActiveTest && (
                            <span className="tag tag-active" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                              Test Actif
                            </span>
                          )}
                        </div>

                        <h3 style={{ fontSize: '1.02rem', fontWeight: 800, marginTop: '3px', color: 'var(--text-main)', lineHeight: 1.25 }}>
                          {p.name}
                        </h3>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '1.08rem', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono' }}>
                            {p.targetSellPrice.toLocaleString()} DA
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                            (Achat : {p.buyPrice.toLocaleString()} DA)
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--accent-rose-dark)', fontWeight: 700 }}>
                            • Fayda : +{(p.targetSellPrice - p.buyPrice).toLocaleString()} DA
                          </span>
                        </div>

                        {/* Pastilles et noms de toutes les couleurs disponibles */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {variants.length} couleur{variants.length > 1 ? 's' : ''} :
                          </span>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {variants.map((v) => (
                              <span
                                key={v.id}
                                title={v.name}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: 'rgba(0,0,0,0.03)',
                                  border: '1px solid rgba(0,0,0,0.06)',
                                  borderRadius: '12px',
                                  padding: '2px 7px',
                                  fontSize: '0.68rem',
                                  fontWeight: 600,
                                  color: 'var(--text-main)',
                                }}
                              >
                                <span
                                  style={{
                                    width: '9px',
                                    height: '9px',
                                    borderRadius: '50%',
                                    background: v.hex,
                                    border: '1px solid rgba(0,0,0,0.2)',
                                    display: 'inline-block',
                                  }}
                                />
                                {v.name.split('&')[0].trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Bouton Sélectionner les Couleurs (Propre et Sans Écrasement) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveProductView(p);
                        }}
                        className="btn-select-product"
                      >
                        <span>Sélectionner</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* VUE 2 : DÉCLINAISONS DE COULEUR SÉPARÉES POUR LE PRODUIT SÉLECTIONNÉ */
        <div>
          {/* Bouton Retour */}
          <button
            type="button"
            onClick={() => setActiveProductView(null)}
            className="btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '0.78rem',
              marginBottom: '16px',
              gap: '6px',
              width: 'fit-content',
            }}
          >
            <ArrowLeft size={16} />
            <span>← Retour aux marchandises</span>
          </button>

          {/* Entête du Produit Sélectionné */}
          <div className="glass-card" style={{ padding: '16px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="gold-badge">{activeProductView.category}</span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Sélection par Couleur</span>
            </div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
              {activeProductView.name}
            </h1>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', alignItems: 'baseline' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono' }}>
                {activeProductView.targetSellPrice.toLocaleString()} DA
              </span>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                (Marge brute : +{(activeProductView.targetSellPrice - activeProductView.buyPrice).toLocaleString()} DA / pièce)
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <h2 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Couleurs Disponibles pour cette Sel3a
            </h2>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Pour chaque couleur, visualisez la <strong>photo originale</strong> et le <strong>rendu mannequin salon</strong>, puis sélectionnez celle qui a été vendue :
            </p>
          </div>

          {/* LISTE DES COULEURS SÉPARÉES AVEC VISUELS COMPARATIFS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {getProductColorVariants(activeProductView).map((variant) => (
              <div
                key={variant.id}
                className="glass-card"
                style={{
                  padding: '16px',
                  borderRadius: '20px',
                  border: '1.5px solid var(--accent-rose-border)',
                }}
              >
                {/* Entête Couleur */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: variant.hex,
                        border: '1.5px solid #fff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        display: 'inline-block',
                      }}
                    />
                    <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      Couleur : {variant.name}
                    </h3>
                  </div>

                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-rose-dark)', fontWeight: 700 }}>
                    Stock : ~{variant.stockEstimate} pcs
                  </span>
                </div>

                {/* LES DEUX PHOTOS COMPARATIVES BIEN SÉPARÉES */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  {/* Photo 1 : Originale (À plat) */}
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      border: '1px solid var(--border-card)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ padding: '6px 8px', background: 'rgba(0,0,0,0.03)', fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      📸 Photo Originale (À plat)
                    </div>
                    <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden' }}>
                      <img
                        src={variant.rawImage}
                        alt={`${variant.name} originale`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  </div>

                  {/* Photo 2 : Face Mannequin Salon Réel */}
                  <div
                    style={{
                      background: '#12100e',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      border: '1.5px solid var(--accent-rose-border)',
                      boxShadow: '0 4px 10px rgba(219, 39, 119, 0.15)',
                    }}
                  >
                    <div style={{ padding: '6px 8px', background: 'rgba(219, 39, 119, 0.15)', fontSize: '0.66rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
                      👗 Face Mannequin (Salon Réel)
                    </div>
                    <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden' }}>
                      <img
                        src={variant.mannequinImage}
                        alt={`${variant.name} mannequin`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Tailles Disponibles */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Tailles :
                  </span>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {variant.sizes.map((s, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'rgba(255, 255, 255, 0.8)',
                          border: '1px solid var(--border-card)',
                          borderRadius: '6px',
                          padding: '2px 7px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ACTIONS : 3 ANGLES SALON OU VENDRE CETTE COULEUR */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setActiveMannequinView({ product: activeProductView, color: variant.name })}
                    className="btn-secondary"
                    style={{
                      flex: '1 1 140px',
                      padding: '11px',
                      fontSize: '0.8rem',
                      borderColor: 'var(--accent-rose-border)',
                      background: 'rgba(253, 242, 248, 0.7)',
                      color: 'var(--accent-rose-dark)',
                      fontWeight: 700,
                    }}
                  >
                    <Eye size={15} color="var(--accent-rose)" />
                    <span>👗 3 Angles Salon</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenSaleForm(activeProductView, variant)}
                    className="btn-primary"
                    style={{
                      flex: '2 1 180px',
                      padding: '11px 14px',
                      fontSize: '0.84rem',
                      borderRadius: '12px',
                    }}
                  >
                    <ShoppingBag size={16} />
                    <span>Vendre cette couleur ({variant.name})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historique des Ventes Enregistrées */}
      <div style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Historique des Ventes ({salesHistory.length})
          </h2>
          {salesHistory.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Voulez-vous réinitialiser l\'historique des ventes ?')) {
                  setSalesHistory([]);
                  localStorage.removeItem('le_laboratoire_sales');
                }
              }}
              style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.72rem', cursor: 'pointer' }}
            >
              Effacer historique
            </button>
          )}
        </div>

        {salesHistory.length === 0 ? (
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
            Aucune vente enregistrée pour le moment. Cliquez sur un produit ci-dessus pour enregistrer vos ventes par couleur !
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {salesHistory.slice(0, 15).map((sale) => (
              <div
                key={sale.id}
                className="glass-card"
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {sale.quantity}x {sale.productName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--accent-rose-dark)', fontWeight: 700 }}>
                      {sale.colorName}
                    </span>
                    <span>•</span>
                    <span>Taille : <strong>{sale.size || 'M'}</strong></span>
                    <span>•</span>
                    <span>Canal : {sale.channel}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono' }}>
                    +{sale.totalRevenue.toLocaleString()} DA
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-rose-dark)', fontWeight: 700 }}>
                    Fayda : +{sale.netProfit.toLocaleString()} DA
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL FINAL D'ENREGISTREMENT DE LA VENTE */}
      {saleModalVariant && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={() => setSaleModalVariant(null)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '520px',
              margin: '0 auto',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '20px',
              paddingBottom: '32px',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.6)',
              background: '#fff',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Entête Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="gold-badge">Confirmation Sortie de Stock</span>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
                  {saleModalVariant.product.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: saleModalVariant.colorHex,
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent-rose-dark)', fontWeight: 700 }}>
                    Couleur sélectionnée : {saleModalVariant.colorName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSaleModalVariant(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleConfirmSale}>
              {/* Quantité vendue */}
              <div className="input-group">
                <label className="input-label">Quantité Vendue (Pièces)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="btn-secondary"
                    style={{ width: '44px', height: '44px', fontSize: '1.2rem', padding: 0 }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="fast-input"
                    style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 800, padding: '10px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="btn-secondary"
                    style={{ width: '44px', height: '44px', fontSize: '1.2rem', padding: 0 }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Sélection Taille */}
              <div className="input-group">
                <label className="input-label">Taille Vendue</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {saleModalVariant.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: selectedSize === s ? '2px solid var(--accent-rose)' : '1px solid var(--border-card)',
                        background: selectedSize === s ? 'linear-gradient(135deg, #fbcfe8, #f472b6)' : '#fff',
                        color: selectedSize === s ? '#831843' : 'var(--text-main)',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prix de Vente & Frais Bureau */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <FastInput
                  label="Prix Vente Unitaire"
                  value={soldPrice}
                  onChange={setSoldPrice}
                  suffix="DA"
                />
                <FastInput
                  label="Ticket Bureau / Colis"
                  value={deliveryFee}
                  onChange={setDeliveryFee}
                  suffix="DA"
                />
              </div>

              {/* Canal de Vente */}
              <div className="input-group">
                <label className="input-label">Canal de Vente</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="fast-input"
                  style={{ fontSize: '0.9rem', padding: '10px' }}
                >
                  <option value="Instagram DM">Instagram DM</option>
                  <option value="Facebook Ads / Messenger">Facebook Ads / Messenger</option>
                  <option value="TikTok Shop / DM">TikTok</option>
                  <option value="Vente Directe / Magasin">Vente Directe / Magasin</option>
                  <option value="Téléphone / Appel">Téléphone / Appel</option>
                </select>
              </div>

              {/* Bilan Financier */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #fdf4ff, #fff1f2)',
                  border: '1.5px solid var(--accent-rose-border)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Montant Total Encaissé :</span>
                  <strong style={{ color: '#0284c7', fontFamily: 'JetBrains Mono' }}>
                    {((parseFloat(soldPrice) || 0) * quantity).toLocaleString()} DA
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Fayda Nette Immédiate :</span>
                  <strong style={{ color: '#059669', fontFamily: 'JetBrains Mono' }}>
                    +{(((parseFloat(soldPrice) || 0) - saleModalVariant.product.buyPrice - (parseFloat(deliveryFee) || 0)) * quantity).toLocaleString()} DA
                  </strong>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary btn-emerald"
                disabled={savingSale}
                style={{ width: '100%', padding: '14px' }}
              >
                {savingSale ? (
                  <span>Validation...</span>
                ) : (
                  <>
                    <Check size={18} />
                    <span>Valider la Vente ({((parseFloat(soldPrice) || 0) * quantity).toLocaleString()} DA)</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STUDIO MANNEQUIN 3 ANGLES (SALON RÉEL) */}
      {activeMannequinView && (
        <MannequinViewer
          product={activeMannequinView.product}
          initialColor={activeMannequinView.color}
          onClose={() => setActiveMannequinView(null)}
        />
      )}
    </div>
  );
}
