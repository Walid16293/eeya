/**
 * Service Intelligent de Correspondance & Génération Mannequin Salon
 * Associe pour chaque couleur de vêtement les 3 angles photoréalistes
 * dans le salon réel d'Eya (backend.png : canapé beige, coussins et rideaux).
 */

export function getMannequinViewsForColor(colorName = '', hex = '') {
  const c = (colorName || '').toLowerCase().trim();

  // 1. Noir / Anthracite / Sombre
  if (c.includes('noir') || c.includes('black') || c.includes('anthracite') || c.includes('sombre')) {
    return {
      front: '/mannequin/mannequin_noir_front.png',
      side: '/mannequin/mannequin_noir_side.png',
      back: '/mannequin/mannequin_noir_back.png',
      colorName: colorName || 'Noir & Carreaux',
      hex: hex || '#1c1917',
    };
  }

  // 2. Marron / Caramel / Chocolat / Camel / Terracotta / Moutarde
  if (c.includes('caramel') || c.includes('marron') || c.includes('chocolat') || c.includes('camel') || c.includes('terracotta') || c.includes('moutarde')) {
    return {
      front: '/mannequin/mannequin_caramel_front.png',
      side: '/mannequin/mannequin_caramel_side.png',
      back: '/mannequin/mannequin_caramel_back.png',
      colorName: colorName || 'Marron Caramel & Carreaux',
      hex: hex || '#b06d40',
    };
  }

  // 3. Vert / Sauge / Kaki / Menthe
  if (c.includes('vert') || c.includes('sauge') || c.includes('kaki') || c.includes('menthe') || c.includes('olive')) {
    return {
      front: '/mannequin/mannequin_vert_front.png',
      side: '/mannequin/mannequin_salon_side.png',
      back: '/mannequin/mannequin_salon_back.png',
      colorName: colorName || 'Vert Sauge & Carreaux',
      hex: hex || '#a3b18a',
    };
  }

  // 4. Blanc / Écru / Crème / Beige clair
  if (c.includes('blanc') || c.includes('écru') || c.includes('ecru') || c.includes('crème') || c.includes('creme') || c.includes('beige')) {
    return {
      front: '/mannequin/mannequin_caramel_front.png',
      side: '/mannequin/mannequin_caramel_side.png',
      back: '/mannequin/mannequin_caramel_back.png',
      colorName: colorName || 'Blanc Crème & Carreaux',
      hex: hex || '#f5ebe0',
    };
  }

  // 5. Rose Poudré / Pastel / Lilas / Saumon (Signature Eya)
  return {
    front: '/mannequin/mannequin_salon_front.png',
    side: '/mannequin/mannequin_salon_side.png',
    back: '/mannequin/mannequin_salon_back.png',
    colorName: colorName || 'Rose Poudré & Carreaux',
    hex: hex || '#f4b8c9',
  };
}
