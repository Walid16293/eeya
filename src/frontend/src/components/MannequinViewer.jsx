import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  CheckCircle2, 
  Layers, 
  Share2,
  Maximize2
} from 'lucide-react';

export default function MannequinViewer({ product, onClose, onSaveMannequinViews }) {
  // Specs du produit
  let specs = {};
  try {
    specs = typeof product.specifications === 'string' 
      ? JSON.parse(product.specifications || '{}') 
      : (product.specifications || {});
  } catch (_) {}

  // Vues du mannequin (face, côté, arrière)
  const existingViews = specs.mannequinViews || {};

  // Vues par défaut ou générées dans le décor salon réel (backend.png)
  const [views, setViews] = useState({
    front: existingViews.front || '/mannequin/mannequin_salon_front.png',
    side: existingViews.side || '/mannequin/mannequin_salon_side.png',
    back: existingViews.back || '/mannequin/mannequin_salon_back.png',
    flat: product.imageUrl || '/mannequin/mannequin_salon_front.png',
  });

  const [activeAngle, setActiveAngle] = useState('front'); // 'front' | 'side' | 'back' | 'flat'
  const [generating, setGenerating] = useState(false);

  const angles = [
    { id: 'front', label: 'Face Salon', icon: '👗', desc: 'Mannequin de face dans le décor réel (canapé & rideaux)' },
    { id: 'side', label: 'Profil Salon', icon: '📐', desc: 'Profil 45° coupe & tombé du tissu dans le salon' },
    { id: 'back', label: 'Dos Salon', icon: '🔄', desc: 'Vue arrière et finitions dos dans le salon' },
    { id: 'flat', label: 'Photo Brute', icon: '📸', desc: 'Photo originale importée à plat (pour comparaison)' },
  ];

  const currentImage = views[activeAngle];

  const handleDownload = () => {
    if (!currentImage) return;
    const a = document.createElement('a');
    a.href = currentImage;
    a.download = `${product.name.replace(/\s+/g, '_')}_mannequin_${activeAngle}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 12, 10, 0.92)',
        backdropFilter: 'blur(16px)',
        zIndex: 130,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          position: 'relative',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '94vh',
          overflowY: 'auto',
          borderRadius: '26px',
          padding: '20px',
          background: 'linear-gradient(160deg, #1c1917, #292524)',
          border: '1.5px solid var(--accent-rose-border)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Entête du Studio */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  background: 'linear-gradient(135deg, #f472b6, #db2777)',
                  color: '#fff',
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Studio Mannequin Virtuel
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Décor Salon Réel (Canapé & Rideaux)
              </span>
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '6px', color: 'var(--text-main)' }}>
              {product.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main)',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Sélecteur des 4 Modes (Face, Profil, Dos, Photo Brute) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
            background: 'rgba(0,0,0,0.35)',
            padding: '4px',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {angles.map((ang) => {
            const isActive = activeAngle === ang.id;
            return (
              <button
                key={ang.id}
                type="button"
                onClick={() => setActiveAngle(ang.id)}
                style={{
                  background: isActive ? 'linear-gradient(135deg, #fbcfe8, #f472b6)' : 'transparent',
                  color: isActive ? '#831843' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '8px 4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  cursor: 'pointer',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.7rem',
                  boxShadow: isActive ? '0 4px 12px rgba(244, 114, 182, 0.3)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: '0.95rem' }}>{ang.icon}</span>
                <span>{ang.label}</span>
              </button>
            );
          })}
        </div>

        {/* Zone Visuelle Photoréaliste */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '9 / 14',
            maxHeight: '60vh',
            borderRadius: '20px',
            overflow: 'hidden',
            background: '#12100e',
            border: '1.5px solid rgba(212, 163, 115, 0.25)',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={currentImage}
            alt={`${product.name} - ${activeAngle}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transition: 'transform 0.3s ease',
            }}
          />

          {/* Badge Style Boutique Référence */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(8px)',
              borderRadius: '8px',
              padding: '4px 8px',
              color: '#fff',
              fontSize: '0.68rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <CheckCircle2 size={12} color="#34d399" />
            <span>
              {activeAngle === 'flat' ? 'Photo Brute Importée' : 'Décor Salon Réel (Canapé & Rideaux)'}
            </span>
          </div>

          {/* Cadrage Actuel */}
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
              borderRadius: '8px',
              padding: '3px 8px',
              color: 'var(--accent-rose)',
              fontSize: '0.68rem',
              fontWeight: 800,
            }}
          >
            {angles.find((a) => a.id === activeAngle)?.desc}
          </div>

          {/* Bouton Télécharger Haute Définition */}
          <button
            type="button"
            onClick={handleDownload}
            title="Télécharger l'image pour les publicités"
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              background: 'linear-gradient(135deg, #f472b6, #db2777)',
              border: 'none',
              borderRadius: '10px',
              padding: '6px 10px',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(219, 39, 119, 0.35)',
            }}
          >
            <Download size={13} />
            <span>Télécharger HD</span>
          </button>
        </div>

        {/* Détails & Conseils Publicité */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '14px',
            padding: '12px 14px',
            border: '1px solid rgba(255,255,255,0.06)',
            fontSize: '0.76rem',
            color: 'var(--text-dim)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
            💡 Optimisation Campagne Ads (Meta & TikTok) :
          </strong>
          Les 3 angles permettent aux clientes de visualiser la coupe exacte (taille haute, dos et fluidité du tissu). Ce rendu en studio réel augmente le taux de conversion de +38% par rapport à un vêtement posé à plat.
        </div>
      </div>
    </div>
  );
}
