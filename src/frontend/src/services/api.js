const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeader() {
  const token = localStorage.getItem('laboratoire_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });
    
    if (res.status === 401) {
      localStorage.removeItem('laboratoire_token');
      localStorage.removeItem('laboratoire_user');
      window.dispatchEvent(new Event('auth-logout'));
      throw new Error('Session expirée ou non autorisée.');
    }

    if (!res.ok) {
      let errMessage = 'Une erreur est survenue';
      try {
        const errData = await res.json();
        errMessage = errData.message || JSON.stringify(errData);
      } catch (_) {
        errMessage = `Erreur ${res.status}: ${res.statusText}`;
      }
      throw new Error(errMessage);
    }

    if (res.status === 204) return null;
    return await res.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // --- AUTHENTIFICATION ---
  async login(username, password) {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.token) {
      localStorage.setItem('laboratoire_token', data.token);
      localStorage.setItem('laboratoire_user', JSON.stringify(data.user));
    }
    return data;
  },

  logout() {
    localStorage.removeItem('laboratoire_token');
    localStorage.removeItem('laboratoire_user');
    window.dispatchEvent(new Event('auth-logout'));
  },

  getUser() {
    try {
      const user = localStorage.getItem('laboratoire_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  async getMe() {
    return request('/api/auth/me');
  },

  // --- PRODUITS (SEL3A) ---
  async getProducts() {
    return request('/api/products');
  },

  async getProduct(id) {
    return request(`/api/products/${id}`);
  },

  async createProduct(productData) {
    return request('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  async updateProduct(id, productData) {
    return request(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  async deleteProduct(id) {
    return request(`/api/products/${id}`, {
      method: 'DELETE',
    });
  },

  // --- LE LABORATOIRE (TESTS 6 JOURS) ---
  async getTests() {
    return request('/api/tests');
  },

  async getActiveTest() {
    try {
      return await request('/api/tests/active');
    } catch (err) {
      if (err.message?.includes('Aucun test actif')) return null;
      throw err;
    }
  },

  async getTest(id) {
    return request(`/api/tests/${id}`);
  },

  async startTest(testData) {
    return request('/api/tests/start', {
      method: 'POST',
      body: JSON.stringify(testData),
    });
  },

  async logDailyMetric(testId, metricData) {
    return request(`/api/tests/${testId}/metrics`, {
      method: 'POST',
      body: JSON.stringify(metricData),
    });
  },

  async completeTest(testId) {
    return request(`/api/tests/${testId}/complete`, {
      method: 'POST',
    });
  },

  async abortTest(testId) {
    return request(`/api/tests/${testId}/abort`, {
      method: 'POST',
    });
  },

  async getGlobalSummary() {
    return request('/api/tests/summary/global');
  },

  // --- IA & PRICING CONCURRENTIEL ---
  async runMarketResearch(productId, customQuery = null) {
    return request('/api/ai/market-research', {
      method: 'POST',
      body: JSON.stringify({ productId, customSearchQuery: customQuery }),
    });
  },

  // --- SANTÉ DU SERVEUR ---
  async checkHealth() {
    return request('/api/health');
  },

  // --- UPLOAD CLOUDINARY (Direct Preset Unsigned) ---
  async uploadToCloudinary(file, cloudName = 'laboratoire-dz', uploadPreset = 'laboratoire_preset') {
    // Si Cloudinary non configuré, convertit temporairement en Base64 ou simule l'URL
    const envCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || cloudName;
    const envPreset = import.meta.env.VITE_CLOUDINARY_PRESET || uploadPreset;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', envPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${envCloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Cloudinary non disponible ou preset non configuré.');
      const data = await res.json();
      return data.secure_url;
    } catch (e) {
      console.warn('Fallback: conversion image en URL Data Base64 locale...', e);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }
  }
};
