/**
 * Agent de Détection Automatique des Couleurs pour Eya - Pyjamas Collection
 * Analyse les pixels d'une image de sel3a via Canvas, extrait les teintes dominantes
 * et les mappe vers des termes de mode en français (Rose poudré, Caramel, Beige, etc.)
 */

// Palette de référence mode & lingerie / pyjamas
const FASHION_PALETTE = [
  { name: 'Rose poudré', hex: '#f4b8c9', r: 244, g: 184, b: 201 },
  { name: 'Rose pastel', hex: '#fbcfe8', r: 251, g: 207, b: 232 },
  { name: 'Vieux rose', hex: '#d8839b', r: 216, g: 131, b: 155 },
  { name: 'Rose framboise', hex: '#be185d', r: 190, g: 24, b: 93 },
  { name: 'Beige crème', hex: '#f5ebe0', r: 245, g: 235, b: 224 },
  { name: 'Beige nude', hex: '#d4a373', r: 212, g: 163, b: 115 },
  { name: 'Écru / Blanc cassé', hex: '#faf7f2', r: 250, g: 247, b: 242 },
  { name: 'Blanc', hex: '#ffffff', r: 255, g: 255, b: 255 },
  { name: 'Marron caramel', hex: '#b06d40', r: 176, g: 109, b: 64 },
  { name: 'Chocolat', hex: '#582f17', r: 88, g: 47, b: 23 },
  { name: 'Terracotta', hex: '#c85a32', r: 200, g: 90, b: 50 },
  { name: 'Noir', hex: '#1c1917', r: 28, g: 25, b: 23 },
  { name: 'Gris perle', hex: '#cbd5e1', r: 203, g: 213, b: 225 },
  { name: 'Gris anthracite', hex: '#475569', r: 71, g: 85, b: 105 },
  { name: 'Bleu ciel', hex: '#bae6fd', r: 186, g: 230, b: 253 },
  { name: 'Bleu marine', hex: '#1e3a8a', r: 30, g: 58, b: 138 },
  { name: 'Vert sauge', hex: '#a3b18a', r: 163, g: 177, b: 138 },
  { name: 'Vert d\'eau', hex: '#a7f3d0', r: 167, g: 243, b: 208 },
  { name: 'Lilas / Lavande', hex: '#e9d5ff', r: 233, g: 213, b: 255 },
  { name: 'Bordeaux', hex: '#881337', r: 136, g: 19, b: 55 },
  { name: 'Jaune moutarde', hex: '#ca8a04', r: 202, g: 138, b: 4 },
];

/**
 * Calcule la distance euclidienne de couleur pondérée
 */
function colorDistance(r1, g1, b1, r2, g2, b2) {
  const rmean = (r1 + r2) / 2;
  const r = r1 - r2;
  const g = g1 - g2;
  const b = b1 - b2;
  return Math.sqrt((((512 + rmean) * r * r) >> 8) + 4 * g * g + (((767 - rmean) * b * b) >> 8));
}

/**
 * Trouve le nom de couleur de mode le plus proche
 */
function matchClosestFashionColor(r, g, b) {
  let minDistance = Infinity;
  let bestMatch = FASHION_PALETTE[0];

  for (const item of FASHION_PALETTE) {
    const dist = colorDistance(r, g, b, item.r, item.g, item.b);
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = item;
    }
  }

  return bestMatch;
}

/**
 * Analyse une image (Blob, File ou URL) et extrait les 1 à 3 couleurs principales de la sel3a
 * @param {File|Blob|string} imageSource
 * @returns {Promise<{ colorsString: string, detectedColors: Array<{ name: string, hex: string }> }>}
 */
export async function detectClothingColors(imageSource) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    let objectUrl = null;
    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else if (imageSource instanceof Blob || imageSource instanceof File) {
      objectUrl = URL.createObjectURL(imageSource);
      img.src = objectUrl;
    } else {
      return resolve({ colorsString: 'Rose poudré, Beige crème', detectedColors: [] });
    }

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Réduire à une taille idéale pour échantillonnage rapide
        const size = 120;
        canvas.width = size;
        canvas.height = size;

        // On dessine l'image
        ctx.drawImage(img, 0, 0, size, size);

        // Zone centrale de tissu (évite les bordures)
        const sx = Math.floor(size * 0.15);
        const sy = Math.floor(size * 0.15);
        const sw = Math.floor(size * 0.7);
        const sh = Math.floor(size * 0.7);

        const imageData = ctx.getImageData(sx, sy, sw, sh);
        const data = imageData.data;

        const colorFrequency = new Map();

        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Ignorer les pixels transparents ou quasi invisibles
          if (a < 128) continue;

          // Ignorer reflets blancs aveuglants
          if (r > 250 && g > 250 && b > 250) continue;

          // Trouver la couleur mode correspondante
          const match = matchClosestFashionColor(r, g, b);
          const current = colorFrequency.get(match.name) || { match, count: 0 };
          current.count += 1;
          colorFrequency.set(match.name, current);
        }

        // Trier par fréquence décroissante
        const sorted = Array.from(colorFrequency.values())
          .sort((a, b) => b.count - a.count)
          .map((item) => item.match);

        // Garder jusqu'à 3 couleurs distinctes significatives
        const unique = [];
        const seen = new Set();
        for (const c of sorted) {
          if (!seen.has(c.name)) {
            seen.add(c.name);
            unique.push({ name: c.name, hex: c.hex });
          }
          if (unique.length >= 3) break;
        }

        const detected = unique.length > 0
          ? unique
          : [{ name: 'Rose poudré', hex: '#f4b8c9' }, { name: 'Beige crème', hex: '#f5ebe0' }];

        const colorsString = detected.map((c) => c.name).join(', ');

        if (objectUrl) URL.revokeObjectURL(objectUrl);
        resolve({ colorsString, detectedColors: detected });
      } catch (err) {
        console.warn('Erreur analyse chromatique canvas:', err);
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        resolve({ colorsString: 'Rose poudré, Beige crème', detectedColors: [] });
      }
    };

    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve({ colorsString: 'Rose poudré, Beige crème', detectedColors: [] });
    };
  });
}
