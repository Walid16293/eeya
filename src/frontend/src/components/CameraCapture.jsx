import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function CameraCapture({ imageUrl, onImageUploaded }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(imageUrl || '');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show instant local preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setLoading(true);

    try {
      // Upload directly to Cloudinary
      const uploadedUrl = await api.uploadToCloudinary(file);
      setPreview(uploadedUrl);
      onImageUploaded(uploadedUrl);
    } catch (err) {
      console.error('Erreur téléversement photo:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="input-group">
      <label className="input-label">Photo de la Sel3a (Caméra Dorsale)</label>
      <div
        style={{
          border: '2px dashed var(--border-card)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          background: 'rgba(15, 23, 42, 0.5)',
          minHeight: '140px',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {preview ? (
          <div style={{ position: 'relative', width: '100%', height: '140px' }}>
            <img
              src={preview}
              alt="Sel3a Preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '12px',
              }}
            />
            {loading ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.65)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  color: '#fff',
                  gap: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <Loader2 className="animate-spin" size={20} />
                <span>Envoi Cloudinary...</span>
              </div>
            ) : (
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(16, 185, 129, 0.9)',
                  borderRadius: '20px',
                  padding: '3px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                <CheckCircle2 size={12} />
                <span>Prête</span>
              </div>
            )}
          </div>
        ) : (
          <>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
              }}
            >
              <Camera size={24} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Prendre une photo</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Active la caméra arrière du smartphone
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
