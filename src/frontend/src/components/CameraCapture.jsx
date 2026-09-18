import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Loader2, CheckCircle2, X, Plus, Star, Sparkles } from 'lucide-react';
import { api } from '../services/api';

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

export default function CameraCapture({ imageUrls = [], onImagesChanged }) {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Normaliser en tableau d'URLs
  const images = Array.isArray(imageUrls)
    ? imageUrls
    : (imageUrls ? [imageUrls] : []);

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setLoading(true);
    setUploadProgress({ current: 0, total: files.length });

    const newUrls = [];

    try {
      for (let i = 0; i < files.length; i++) {
        setUploadProgress({ current: i + 1, total: files.length });
        const file = files[i];
        // Compression automatique côté client pour chargement instantané sans saturation
        const optimizedFile = await compressImage(file);
        const uploadedUrl = await api.uploadToCloudinary(optimizedFile);
        if (uploadedUrl) {
          newUrls.push(uploadedUrl);
        }
      }

      const updated = [...images, ...newUrls];
      onImagesChanged(updated);
    } catch (err) {
      console.error('Erreur téléversement photos multiples:', err);
      alert('Une erreur est survenue lors du téléversement de certaines photos.');
    } finally {
      setLoading(false);
      setUploadProgress({ current: 0, total: 0 });
      // Reset inputs
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleRemove = (indexToRemove) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onImagesChanged(updated);
  };

  const handleSetPrimary = (indexToPrimary) => {
    if (indexToPrimary === 0) return;
    const selected = images[indexToPrimary];
    const remaining = images.filter((_, idx) => idx !== indexToPrimary);
    const updated = [selected, ...remaining];
    onImagesChanged(updated);
  };

  return (
    <div className="input-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label className="input-label" style={{ marginBottom: 0 }}>
          Photos de la Sel3a ({images.length} photo{images.length > 1 ? 's' : ''})
        </label>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Sparkles size={12} color="var(--accent-rose)" />
          Sélection multiple autorisée
        </span>
      </div>

      {/* Input 1 : Caméra Dorsale (Prend une photo et l'ajoute à la liste) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: 'none' }}
      />

      {/* Input 2 : Galerie Locale / PC (MULTIPLE : Sélection de plusieurs photos en même temps) */}
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
              Téléversement en cours ({uploadProgress.current}/{uploadProgress.total})...
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              Optimisation et hébergement Cloudinary persistant
            </div>
          </div>
        </div>
      )}

      {/* GRILLE DES PHOTOS EXISTANTES */}
      {images.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
            }}
          >
            {images.map((url, idx) => {
              const isPrimary = idx === 0;
              return (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    border: isPrimary ? '2.5px solid var(--accent-rose)' : '1px solid var(--border-card)',
                    boxShadow: isPrimary ? '0 4px 14px rgba(219, 39, 119, 0.25)' : '0 2px 6px rgba(0,0,0,0.05)',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSetPrimary(idx)}
                  title={isPrimary ? 'Photo principale' : 'Cliquer pour définir comme photo principale'}
                >
                  <img
                    src={url}
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
              Ajouter des photos du produit
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
              Vous pouvez charger plusieurs images à la fois (angles, détails, couleurs)
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
