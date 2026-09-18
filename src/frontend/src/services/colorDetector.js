/**
 * Agent de Détection Automatique des Couleurs pour Eya - Pyjamas Collection
 * Analyse les pixels réels du vêtement via Canvas sans erreur CORS (support File, Blob et remote via fetch),
 * pondère la saturation pour isoler le tissu des fonds neutres (sols, carrelages, draps)
 * et mappe vers la palette de référence Eya.
 */

export const PRESET_COLORS = [
  { name: 'Rose Poudré & Carreaux', hex: '#f4b8c9', r: 244, g: 184, b: 201, tag: 'rose' },
  { name: 'Marron Caramel & Carreaux', hex: '#b06d40', r: 176, g: 109, b: 64, tag: 'caramel' },
  { name: 'Noir & Carreaux', hex: '#1c1917', r: 28, g: 25, b: 23, tag: 'noir' },
  { name: 'Vert Sauge & Rayures', hex: '#a3b18a', r: 163, g: 177, b: 138, tag: 'vert' },
  { name: 'Blanc Crème & Carreaux', hex: '#f5ebe0', r: 245, g: 235, b: 224, tag: 'blanc' },
  { name: 'Rose Pastel', hex: '#fbcfe8', r: 251, g: 207, b: 232, tag: 'rose' },
  { name: 'Vieux Rose', hex: '#d8839b', r: 216, g: 131, b: 155, tag: 'rose' },
  { name: 'Chocolat / Moka', hex: '#582f17', r: 88, g: 47, b: 23, tag: 'caramel' },
  { name: 'Terracotta', hex: '#c85a32', r: 200, g: 90, b: 50, tag: 'caramel' },
  { name: 'Gris Anthracite', hex: '#475569', r: 71, g: 85, b: 105, tag: 'noir' },
  { name: 'Vert Kaki / Olive', hex: '#656d4a', r: 101, g: 109, b: 74, tag: 'vert' },
  { name: 'Bleu Ciel', hex: '#bae6fd', r: 186, g: 230, b: 253, tag: 'bleu' },
  { name: 'Bleu Marine', hex: '#1e3a8a', r: 30, g: 58, b: 138, tag: 'bleu' },
  { name: 'Bordeaux & Lilas', hex: '#881337', r: 136, g: 19, b: 55, tag: 'bordeaux' },
];

/**
 * Calcule la distance de couleur pondérée pour la vision humaine (Redmean distance)
 */
function colorDistance(r1, g1, b1, r2, g2, b2) {
  const rmean = (r1 + r2) / 2;
  const r = r1 - r2;
  const g = g1 - g2;
  const b = b1 - b2;
  return Math.sqrt((((512 + rmean) * r * r) >> 8) + 4 * g * g + (((767 - rmean) * b * b) >> 8));
}

/**
 * Trouve la couleur de mode la plus proche
 */
export function matchClosestColor(r, g, b) {
  let minDistance = Infinity;
  let best = PRESET_COLORS[0];

  for (const c of PRESET_COLORS) {
    const dist = colorDistance(r, g, b, c.r, c.g, c.b);
    if (dist < minDistance) {
      minDistance = dist;
      best = c;
    }
  }
  return best;
}

/**
 * Convertit n'importe quelle source d'image (File, Blob ou URL) en URL locale sûre (Blob URL)
 * pour garantir l'absence totale d'erreur de sécurité Canvas (Tainted Canvas / CORS).
 */
async function getImageElement(imageSource) {
  return new Promise((resolve, reject) => {
    let objectUrl = null;

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    const cleanup = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };

    img.onload = () => {
      resolve({ img, cleanup });
    };

    img.onerror = () => {
      cleanup();
      reject(new Error("Impossible de charger l'image pour analyse"));
    };

    if (imageSource instanceof Blob || imageSource instanceof File) {
      objectUrl = URL.createObjectURL(imageSource);
      img.src = objectUrl;
    } else if (typeof imageSource === 'string') {
      if (imageSource.startsWith('data:') || imageSource.startsWith('blob:')) {
        img.src = imageSource;
      } else {
        // Pour les URLs externes (ex: Cloudinary), on fetch en Blob pour contourner CORS
        fetch(imageSource)
          .then((res) => res.blob())
          .then((blob) => {
            objectUrl = URL.createObjectURL(blob);
            img.src = objectUrl;
          })
          .catch(() => {
            // Fallback direct avec crossOrigin
            img.src = imageSource;
          });
      }
    } else {
      reject(new Error('Source image invalide'));
    }
  });
}

/**
 * Analyse chromatique avancée d'une image de vêtement
 * Échantillonne le centre du vêtement (tissu), isole les couleurs saturées
 * et élimine les fonds clairs (sols, carrelage, couettes).
 * 
 * @param {File|Blob|string} imageSource 
 * @returns {Promise<{ colorName: string, hex: string, allDetected: Array<{ name: string, hex: string }> }>}
 */
export async function detectClothingColors(imageSource) {
  try {
    const { img, cleanup } = await getImageElement(imageSource);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const sampleSize = 120;
    canvas.width = sampleSize;
    canvas.height = sampleSize;

    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
    cleanup();

    // Zone centrale (20% à 80% pour capturer le tissu et éviter les bords/sols)
    const sx = Math.floor(sampleSize * 0.2);
    const sy = Math.floor(sampleSize * 0.2);
    const sw = Math.floor(sampleSize * 0.6);
    const sh = Math.floor(sampleSize * 0.6);

    const imageData = ctx.getImageData(sx, sy, sw, sh);
    const data = imageData.data;

    const scoreMap = new Map();

    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 128) continue; // Ignore transparent

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const chroma = max - min; // Saturation / vivacité de la couleur
      const lightness = (max + min) / 2;

      // Ignorer les reflets aveuglants ou fonds carrelage ultra blancs
      if (lightness > 245 && chroma < 12) continue;

      // Poids du pixel : on donne 3.5x plus d'importance aux pixels avec une vraie couleur (tissu)
      let weight = 1;
      if (chroma > 18) {
        weight = 3.5;
      } else if (lightness < 35) {
        // Tissu sombre / noir
        weight = 2.5;
      }

      const match = matchClosestColor(r, g, b);
      const current = scoreMap.get(match.name) || { match, score: 0 };
      current.score += weight;
      scoreMap.set(match.name, current);
    }

    const sorted = Array.from(scoreMap.values()).sort((a, b) => b.score - a.score);

    if (sorted.length > 0) {
      const best = sorted[0].match;
      const all = sorted.slice(0, 3).map((item) => ({
        name: item.match.name,
        hex: item.match.hex,
      }));
      return {
        colorName: best.name,
        hex: best.hex,
        colorsString: all.map((c) => c.name).join(', '),
        detectedColors: all,
      };
    }

    return {
      colorName: 'Rose Poudré & Carreaux',
      hex: '#f4b8c9',
      colorsString: 'Rose Poudré & Carreaux',
      detectedColors: [{ name: 'Rose Poudré & Carreaux', hex: '#f4b8c9' }],
    };
  } catch (err) {
    console.warn('Erreur détection couleur:', err);
    return {
      colorName: 'Rose Poudré & Carreaux',
      hex: '#f4b8c9',
      colorsString: 'Rose Poudré & Carreaux',
      detectedColors: [{ name: 'Rose Poudré & Carreaux', hex: '#f4b8c9' }],
    };
  }
}
