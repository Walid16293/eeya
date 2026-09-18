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
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import FastInput from '../components/FastInput';

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ventes enregistrées (persistées localement et reliées au test)
  const [salesHistory, setSalesHistory] = useState([]);

  // Modal de vente
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [soldPrice, setSoldPrice] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('15');
  const [channel, setChannel] = useState('Instagram DM');
  const [savingSale, setSavingSale] = useState(false);
  const [successToast, setSuccessToast] = useState(null);

  useEffect(() => {
    loadData();
    // Charger l'historique des ventes
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

  const handleOpenSaleModal = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setSoldPrice(product.targetSellPrice?.toString() || '2900');
    setDeliveryFee('15');

    // Extraire tailles et couleurs par défaut
    let specs = {};
    try {
      specs = typeof product.specifications === 'string' 
        ? JSON.parse(product.specifications || '{}') 
        : (product.specifications || {});
    } catch (_) {}

    setSelectedSize(specs.tailles?.[0] || 'M');
    setSelectedColor(specs.couleurs?.[0] || 'Rose poudré');
  };

  const handleConfirmSale = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSavingSale(true);
    const unitPrice = parseFloat(soldPrice) || selectedProduct.targetSellPrice || 0;
    const fee = parseFloat(deliveryFee) || 0;
    const totalRevenue = unitPrice * quantity;
    const totalCost = (selectedProduct.buyPrice * quantity) + (fee * quantity);
    const netProfit = totalRevenue - totalCost;

    const newSale = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productImage: selectedProduct.imageUrl,
      quantity,
      size: selectedSize,
      color: selectedColor,
      unitPrice,
      totalRevenue,
      netProfit,
      channel,
    };

    // 1. Sauvegarder dans l'historique
    const updatedHistory = [newSale, ...salesHistory];
    setSalesHistory(updatedHistory);
    try {
      localStorage.setItem('le_laboratoire_sales', JSON.stringify(updatedHistory));
    } catch (_) {}

    // 2. Si un test actif existe pour ce produit, synchroniser avec le bilan du jour !
    if (activeTest && activeTest.productId === selectedProduct.id) {
      try {
        const currentDay = activeTest.currentDay || 1;
        const currentOrders = activeTest.totalConfirmedOrders || 0;
        await api.logDailyMetric(activeTest.id, {
          dayNumber: currentDay,
          confirmedOrders: currentOrders + quantity,
          adsSpent: activeTest.totalAdsSpent || 0,
          clicks: 0,
          impressions: 0,
          notes: `Vente enregistrée : ${quantity}x ${selectedProduct.name} (${selectedSize}, ${selectedColor}) via ${channel}`,
        });
      } catch (err) {
        console.warn('Sync avec test actif:', err);
      }
    }

    setSavingSale(false);
    setSelectedProduct(null);
    setSuccessToast(`Vente enregistrée ! +${totalRevenue.toLocaleString()} DA (Fayda : +${netProfit.toLocaleString()} DA)`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleDeleteSale = (saleId) => {
    const filtered = salesHistory.filter((s) => s.id !== saleId);
    setSalesHistory(filtered);
    try {
      localStorage.setItem('le_laboratoire_sales', JSON.stringify(filtered));
    } catch (_) {}
  };

  // Filtrer les produits
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  // Calculs statistiques
  const totalRevenueAll = salesHistory.reduce((sum, s) => sum + (s.totalRevenue || 0), 0);
  const totalProfitAll = salesHistory.reduce((sum, s) => sum + (s.netProfit || 0), 0);
  const totalItemsSold = salesHistory.reduce((sum, s) => sum + (s.quantity || 0), 0);

  return (
    <div className="page-content" style={{ paddingBottom: '90px' }}>
      {/* Entête */}
      <header className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="gold-badge">Point de Vente • Sel3a</span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Sorties de Stock</span>
          </div>
          <h1 className="page-title" style={{ marginTop: '4px' }}>
            Enregistrer les Ventes
          </h1>
        </div>
      </header>

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
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <CheckCircle2 size={20} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Cartes Métriques Rapides */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        <div className="glass-card" style={{ padding: '12px 10px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Vendu</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
            {totalItemsSold} <span style={{ fontSize: '0.72rem' }}>pcs</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '12px 10px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>Chiffre d'Affaires</span>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
            {totalRevenueAll.toLocaleString()} <span style={{ fontSize: '0.68rem' }}>DA</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '12px 10px', textAlign: 'center', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <span style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 700 }}>Fayda Nette</span>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
            +{totalProfitAll.toLocaleString()} <span style={{ fontSize: '0.68rem' }}>DA</span>
          </div>
        </div>
      </div>

      {/* Barre de Recherche de Marchandise */}
      <div className="search-bar" style={{ marginBottom: '16px' }}>
        <Search size={18} color="var(--text-dim)" />
        <input
          type="text"
          placeholder="Rechercher une sel3a par nom ou catégorie..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Grille des Produits Disponibles à la Vente */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Sélectionnez la Sel3a Vendue ({filteredProducts.length})
          </h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Cliquez pour enregistrer
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <Package size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p style={{ fontSize: '0.9rem' }}>Aucune marchandise trouvée.</p>
          </div>
        ) : (
          filteredProducts.map((p) => {
            let specs = {};
            try {
              specs = typeof p.specifications === 'string' 
                ? JSON.parse(p.specifications || '{}') 
                : (p.specifications || {});
            } catch (_) {}

            return (
              <div
                key={p.id}
                className="glass-card"
                style={{
                  padding: '14px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  transition: 'transform 0.15s ease',
                }}
              >
                {/* Photo Produit */}
                <div style={{ width: '68px', height: '68px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-card)' }}>
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={22} color="var(--text-dim)" />
                    </div>
                  )}
                </div>

                {/* Infos Produit */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.66rem', color: 'var(--accent-rose)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {p.category}
                    </span>
                    {p.hasActiveTest && (
                      <span className="tag tag-active" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                        Test Actif
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginTop: '3px' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#34d399', fontFamily: 'JetBrains Mono' }}>
                      {p.targetSellPrice.toLocaleString()} DA
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      (Achat : {p.buyPrice.toLocaleString()} DA)
                    </span>
                  </div>
                </div>

                {/* Bouton Vendre */}
                <button
                  type="button"
                  onClick={() => handleOpenSaleModal(p)}
                  className="btn-primary"
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.78rem',
                    flexShrink: 0,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ShoppingBag size={14} />
                  <span>Vendre</span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Historique des Ventes Enregistrées */}
      <div style={{ marginTop: '20px' }}>
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
            Aucune vente enregistrée pour le moment. Cliquez sur "Vendre" sur n'importe quel produit pour commencer !
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
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {sale.quantity}x {sale.productName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '6px' }}>
                    <span>Taille : <strong>{sale.size || 'Unique'}</strong></span>
                    <span>•</span>
                    <span>Couleur : <strong>{sale.color || 'Standard'}</strong></span>
                    <span>•</span>
                    <span>Canal : {sale.channel}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#34d399', fontFamily: 'JetBrains Mono' }}>
                    +{sale.totalRevenue.toLocaleString()} DA
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-rose)', fontWeight: 700 }}>
                    Fayda : +{sale.netProfit.toLocaleString()} DA
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL D'ENREGISTREMENT D'UNE VENTE */}
      {selectedProduct && (
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
          onClick={() => setSelectedProduct(null)}
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
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Entête Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="gold-badge">Sortie de Marchandise</span>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '4px' }}>
                  {selectedProduct.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
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

              {/* Taille Vendue */}
              <div className="input-group">
                <label className="input-label">Taille Vendue</label>
                <input
                  type="text"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  placeholder="Ex: S, M, L, XL"
                  className="fast-input"
                  style={{ fontSize: '0.9rem', padding: '10px' }}
                />
              </div>

              {/* Couleur Vendue */}
              <div className="input-group">
                <label className="input-label">Couleur Vendue</label>
                <input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  placeholder="Ex: Rose poudré, Beige"
                  className="fast-input"
                  style={{ fontSize: '0.9rem', padding: '10px' }}
                />
              </div>

              {/* Prix de Vente Unitaire */}
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

              {/* Bilan Financier de cette Vente */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Montant Total Encaissé :</span>
                  <strong style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
                    {((parseFloat(soldPrice) || 0) * quantity).toLocaleString()} DA
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Fayda Nette Immédiate :</span>
                  <strong style={{ color: '#34d399', fontFamily: 'JetBrains Mono' }}>
                    +{(((parseFloat(soldPrice) || 0) - selectedProduct.buyPrice - (parseFloat(deliveryFee) || 0)) * quantity).toLocaleString()} DA
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
                  <span>Enregistrement...</span>
                ) : (
                  <>
                    <Check size={18} />
                    <span>Confirmer la Vente ({((parseFloat(soldPrice) || 0) * quantity).toLocaleString()} DA)</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
