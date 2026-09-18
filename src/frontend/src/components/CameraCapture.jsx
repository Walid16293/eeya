import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Loader2, CheckCircle2, X, Plus, Star, Sparkles, Palette, Edit3 } from 'lucide-react';
import { api } from '../services/api';
import { detectClothingColors, PRESET_COLORS } from '../services/colorDetector';

// Helper pour compresser les photos volumineuses (ex: photos smartphone 10Mo -> ~150Ko instantanément)
const compressImage = (file, maxWidth = 1280, maxHeight = 1280, quality = 0.82) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/') || file.type.includes('svg')) {
      return resolve(file);
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

export default function CameraCapture({ imageUrls = [], photoItems = [], onImagesChanged, onColorsDetected }) {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Normaliser les éléments : supporte soit photoItems [{ url, colorName, hex }], soit imageUrls ['url1', ...]
  const items = (photoItems && photoItems.length > 0)
    ? photoItems
    : (Array.isArray(imageUrls)
        ? imageUrls.map((u, i) => (typeof u === 'string' ? { url: u, colorName: `Couleur ${i + 1}`, hex: '#f4b8c9' } : u))
        : []);

  const notifyChange = (newItems) => {
    const urls = newItems.map((it) => it.url);
    if (onImagesChanged) {
      // Envoie à la fois les URLs et les objets complets avec couleurs
      onImagesChanged(urls, newItems);
    }
    if (onColorsDetected) {
      const colorsStr = newItems.map((it) => it.colorName).join(', ');
      onColorsDetected(colorsStr, newItems);
    }
  };

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setLoading(true);
    setUploadProgress({ current: 0, total: files.length });

    const newItems = [];

    try {
      for (let i = 0; i < files.length; i++) {
        setUploadProgress({ current: i + 1, total: files.length });
        const file = files[i];

        // 1. Compression et téléversement vers Cloudinary
        const optimizedFile = await compressImage(file);
        const uploadedUrl = await api.uploadToCloudinary(optimizedFile);

        // 2. Détection chromatique IA SUR LE SERVEUR (Backend .NET ImageSharp)
        let detected = { colorName: 'Rose Poudré & Carreaux', hex: '#f4b8c9' };
        let serverSuccess = false;

        if (uploadedUrl) {
          try {
            const serverRes = await api.detectColorOnServer(uploadedUrl);
            if (serverRes?.colorName) {
              detected = { colorName: serverRes.colorName, hex: serverRes.hex };
              serverSuccess = true;
            }
          } catch (serverErr) {
            console.warn('Détection serveur indisponible, utilisation du fallback local:', serverErr);
          }
        }

        // Fallback local si le serveur est en veille ou injoignable
        if (!serverSuccess) {
          try {
            const localRes = await detectClothingColors(file);
            if (localRes?.colorName) {
              detected = { colorName: localRes.colorName, hex: localRes.hex };
            }
          } catch (_) {}
        }

        if (uploadedUrl) {
          newItems.push({
            url: uploadedUrl,
            colorName: detected.colorName,
            hex: detected.hex,
          });
        }
      }

      const updated = [...items, ...newItems];
      notifyChange(updated);
    } catch (err) {
      console.error('Erreur téléversement photos multiples:', err);
      alert('Une erreur est survenue lors du téléversement de certaines photos.');
    } finally {
      setLoading(false);
      setUploadProgress({ current: 0, total: 0 });
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleColorChange = (index, newColorName) => {
    const preset = PRESET_COLORS.find((p) => p.name === newColorName);
    const updated = items.map((it, idx) => {
      if (idx === index) {
        return {
          ...it,
          colorName: newColorName,
          hex: preset ? preset.hex : it.hex,
        };
      }
      return it;
    });
    notifyChange(updated);
  };

  const handleRemove = (indexToRemove) => {
    const updated = items.filter((_, idx) => idx !== indexToRemove);
    notifyChange(updated);
  };

  const handleSetPrimary = (indexToPrimary) => {
    if (indexToPrimary === 0) return;
    const selected = items[indexToPrimary];
    const remaining = items.filter((_, idx) => idx !== indexToPrimary);
    const updated = [selected, ...remaining];
    notifyChange(updated);
  };

  return (
    <div className="input-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label className="input-label" style={{ marginBottom: 0 }}>
          Photos de la Sel3a ({items.length} photo{items.length > 1 ? 's' : ''})
        </label>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Sparkles size={12} color="var(--accent-rose)" />
          Détection de couleur automatique
        </span>
      </div>

      {/* Input 1 : Caméra Dorsale */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: 'none' }}
      />

      {/* Input 2 : Galerie Locale / PC (MULTIPLE) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: 'none' }}
      />

      {/* CHARGEMENT EN COURS */}
      {loading && (
        <div
          style={{
            background: 'linear-gradient(135deg, #fdf4ff, #fff1f2)',
            border: '1.5px solid var(--accent-rose-border)',
            borderRadius: '16px',
            padding: '14px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--accent-rose-dark)',
          }}
        >
          <Loader2 className="animate-spin" size={24} color="var(--accent-rose)" />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.86rem' }}>
              Analyse IA & Téléversement ({uploadProgress.current}/{uploadProgress.total})...
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              Détection chromatique et optimisation d'image en cours
            </div>
          </div>
        </div>
      )}

      {/* GRILLE DES PHOTOS AVEC CONTRÔLE DES COULEURS PAR PHOTO */}
      {items.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '12px',
            }}
          >
            {items.map((item, idx) => {
              const isPrimary = idx === 0;
              return (
                <div
                  key={idx}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: isPrimary ? '2px solid var(--accent-rose)' : '1px solid var(--border-card)',
                    boxShadow: isPrimary ? '0 4px 14px rgba(219, 39, 119, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Image Container */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '1',
                      cursor: 'pointer',
                      background: '#fdf4ff',
                    }}
                    onClick={() => handleSetPrimary(idx)}
                    title={isPrimary ? 'Photo principale' : 'Cliquer pour définir comme photo principale'}
                  >
                    <img
                      src={item.url}
                      alt={`Sel3a ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {/* Badge Principale */}
                    {isPrimary ? (
                      <div
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          background: 'linear-gradient(135deg, #f472b6, #db2777)',
                          borderRadius: '6px',
                          padding: '2px 6px',
                          color: '#fff',
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                        }}
                      >
                        <Star size={10} fill="#fff" />
                        <span>Principale</span>
                      </div>
                    ) : (
                      <div
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          background: 'rgba(0,0,0,0.5)',
                          backdropFilter: 'blur(4px)',
                          borderRadius: '6px',
                          padding: '2px 5px',
                          color: '#fff',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                        }}
                      >
                        #{idx + 1}
                      </div>
                    )}

                    {/* Bouton Supprimer */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(idx);
                      }}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: 'rgba(225, 29, 72, 0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      }}
                      title="Supprimer cette photo"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* CONTRÔLE DE LA COULEUR DÉTECTÉE / SÉLECTIONNÉE */}
                  <div
                    style={{
                      padding: '8px',
                      background: 'rgba(253, 242, 248, 0.65)',
                      borderTop: '1px solid var(--accent-rose-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: item.hex || '#f4b8c9',
                          border: '1.5px solid rgba(0,0,0,0.2)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          flexShrink: 0,
                          display: 'inline-block',
                        }}
                      />
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-rose-dark)' }}>
                        Couleur détectée :
                      </span>
                    </div>

                    <select
                      value={item.colorName}
                      onChange={(e) => handleColorChange(idx, e.target.value)}
                      style={{
                        width: '100%',
                        background: '#ffffff',
                        border: '1.5px solid var(--accent-rose-border)',
                        borderRadius: '8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        padding: '4px 6px',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {PRESET_COLORS.map((pc) => (
                        <option key={pc.name} value={pc.name}>
                          {pc.name}
                        </option>
                      ))}
                      {!PRESET_COLORS.some((p) => p.name === item.colorName) && (
                        <option value={item.colorName}>{item.colorName}</option>
                      )}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          {/* BOUTONS D'AJOUT SUPPLÉMENTAIRES */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="btn-secondary"
              style={{ padding: '8px 10px', fontSize: '0.78rem' }}
            >
              <Camera size={14} color="var(--accent-rose)" />
              <span>+ Prendre Photo</span>
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="btn-secondary"
              style={{ padding: '8px 10px', fontSize: '0.78rem' }}
            >
              <ImageIcon size={14} color="var(--accent-rose)" />
              <span>+ Ajouter Galerie</span>
            </button>
          </div>
        </div>
      ) : (
        /* VUE INITIALE VIDE (AVANT SÉLECTION) */
        <div
          style={{
            border: '2px dashed var(--accent-rose-border)',
            borderRadius: '20px',
            padding: '22px 16px',
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.8), rgba(251, 207, 232, 0.22))',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '3px' }}>
              Ajouter les photos des déclinaisons
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
              L'IA détectera automatiquement la couleur de chaque photo, et vous pourrez la modifier facilement.
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

            {/* BOUTON 2 : GALERIE / FICHIERS LOCAUX (MULTIPLE) */}
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
                  background: 'rgba(254, 243, 199, 0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#b45309',
                }}
              >
                <ImageIcon size={20} />
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#78350f' }}>
                Galerie Multi-Photos
              </span>
              <span style={{ fontSize: '0.68rem', color: '#92400e' }}>
                Smartphone & PC (Plusieurs)
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
