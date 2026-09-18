import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Loader2, CheckCircle2, RefreshCw, X, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function CameraCapture({ imageUrl, onImageUploaded }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(imageUrl || '');
  
  // Deux références séparées : une pour la caméra directe et une pour la galerie / fichiers locaux
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    // Aperçu immédiat
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setLoading(true);

    try {
      // Téléversement vers Cloudinary
      const uploadedUrl = await api.uploadToCloudinary(file);
      setPreview(uploadedUrl);
      onImageUploaded(uploadedUrl);
    } catch (err) {
      console.error('Erreur téléversement photo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview('');
    onImageUploaded('');
  };

  return (
    <div className="input-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label className="input-label" style={{ marginBottom: 0 }}>
          Photo de la Sel3a (Produit)
        </label>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Sparkles size={12} color="var(--accent-rose)" />
          Caméra ou Galerie locale
        </span>
      </div>

      {/* Input 1 : Déclencheur direct Caméra dorsale */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFile(e.target.files?.[0])}
        style={{ display: 'none' }}
      />

      {/* Input 2 : Sélecteur de fichiers classiques (Galerie mobile & Explorateur PC) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files?.[0])}
        style={{ display: 'none' }}
      />

      {preview ? (
        /* VUE APERÇU AVEC OPTIONS */
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '180px',
            borderRadius: '18px',
            overflow: 'hidden',
            border: '2px solid var(--accent-rose-border)',
            boxShadow: '0 8px 24px rgba(219, 39, 119, 0.12)',
            background: 'var(--bg-secondary)',
          }}
        >
          <img
            src={preview}
            alt="Aperçu Produit"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {loading ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(253, 248, 245, 0.85)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--accent-rose-dark)',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              <Loader2 className="animate-spin" size={26} color="var(--accent-rose)" />
              <span>Optimisation & Envoi Cloudinary...</span>
            </div>
          ) : (
            <>
              {/* Badge Succès */}
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  background: 'rgba(5, 150, 105, 0.92)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                <CheckCircle2 size={13} />
                <span>Photo prête</span>
              </div>

              {/* Bouton Supprimer */}
              <button
                type="button"
                onClick={handleRemove}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(225, 29, 72, 0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
                title="Supprimer la photo"
              >
                <X size={16} />
              </button>

              {/* Barre de ré-action en bas de l'image */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  right: '10px',
                  display: 'flex',
                  gap: '8px',
                }}
              >
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid var(--accent-rose-border)',
                    borderRadius: '10px',
                    padding: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  <Camera size={14} color="var(--accent-rose)" />
                  <span>Reprendre</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid var(--accent-rose-border)',
                    borderRadius: '10px',
                    padding: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  <ImageIcon size={14} color="var(--accent-rose)" />
                  <span>Galerie</span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* VUE SÉLECTION DOUBLE : CAMÉRA OU FICHIERS LOCAUX */
        <div
          style={{
            border: '2px dashed var(--accent-rose-border)',
            borderRadius: '20px',
            padding: '20px 16px',
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.7), rgba(251, 207, 232, 0.2))',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '3px' }}>
              Ajouter l'image de la marchandise
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
              Photographiez en direct ou importez une photo depuis vos fichiers
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
            {/* BOUTON 1 : CAMÉRA DORSALE */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              style={{
                background: 'linear-gradient(135deg, #fbcfe8, #f472b6)',
                border: '1px solid rgba(219, 39, 119, 0.25)',
                borderRadius: '14px',
                padding: '12px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(244, 114, 182, 0.25)',
                transition: 'transform 0.15s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-rose-dark)',
                }}
              >
                <Camera size={20} />
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#831843' }}>
                Prendre Photo
              </span>
              <span style={{ fontSize: '0.68rem', color: '#9d174d' }}>
                Caméra Dorsale
              </span>
            </button>

            {/* BOUTON 2 : GALERIE / FICHIERS LOCAUX */}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              style={{
                background: 'linear-gradient(135deg, #ffffff, #fef3c7)',
                border: '1px solid rgba(212, 163, 115, 0.35)',
                borderRadius: '14px',
                padding: '12px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(212, 163, 115, 0.2)',
                transition: 'transform 0.15s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(254, 243, 199, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#b45309',
                }}
              >
                <ImageIcon size={20} />
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#78350f' }}>
                Galerie Locale
              </span>
              <span style={{ fontSize: '0.68rem', color: '#92400e' }}>
                Smartphone & PC
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
