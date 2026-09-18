# 🧪 Le Laboratoire - E-commerce & Maximisation de la Fayda

Application e-commerce multi-administrateurs conçue pour tester la rentabilité d'un stock initial (*sel3a*) sur un cycle rigoureux de **6 jours** avec un budget Ads contrôlé (ex: 2 000 DA), tout en calculant le bénéfice net (**Fayda**) en temps réel et en ajustant les prix via intelligence artificielle.

---

## 🌟 Caractéristiques Clés & Choix d'Architecture (0 DA)

* **Architecture Découplée Cloud** :
  * **Frontend** : Progressive Web App (PWA) Mobile-First développée en **React 19 + Vite.js**, prête pour déploiement mondial sur **Vercel** (HTTPS, CDN gratuit).
  * **Backend** : Web API en **C# ASP.NET Core** (.NET 8 LTS) conteneurisée via **Docker** pour déploiement gratuit sur **Render.com** ou **Koyeb**.
  * **Base de Données** : **PostgreSQL** hébergé sur **Neon.tech** (0.5 Go gratuit, SSL natif, stockage JSONB pour les attributs dynamiques).
  * **Stockage Photos** : Téléversement direct sur **Cloudinary** via unsigned preset. Seules les URLs pérennes sont enregistrées en base (aucune perte d'images lors du redémarrage du conteneur gratuit).
  * **Moteur IA 24/7** : Inférence sur **Groq Cloud API** (`llama-3.3-70b-versatile` ou `deepseek-r1-distill-llama-70b`) à vitesse ultra-rapide.
  * **Scraping Réseaux Sociaux** : Requêtage de recherche ciblé via **DuckDuckGo Search API** (100% gratuit, sans token, non bloqué par les Captchas).
  * **Système Anti-Veille** : Endpoint `/api/health` compatible avec **Cron-Job.org** (ping toutes les 14 min pour éliminer les latences de réveil).

---

## 🔐 Accès Administrateurs

L'application ne dispose d'**aucun formulaire d'inscription public**. Deux comptes gérants uniques sont automatiquement initialisés en base avec hachage cryptographique BCrypt :

| Associé | Identifiant | Mot de Passe par Défaut | Rôle |
| :--- | :--- | :--- | :--- |
| **Associé 1 (Terrain)** | `admin1` | `Laboratoire1@2026` | Gestion du stock et photos sur smartphone |
| **Associé 2 (Bureau)** | `admin2` | `Laboratoire2@2026` | Direction, campagnes Ads et analyse financière |

*(Les identifiants et mots de passe peuvent être personnalisés via variables d'environnement `AdminSeed:Admin1:Password` et `AdminSeed:Admin2:Password`)*.

---

## 📱 Ergonomie Mobile Terrain (PWA)

* **Bottom Navigation Bar** : Barre tactile basse permettant de naviguer à une main entre :
  * 🧪 **Laboratoire** : Suivi du test 6 jours, Fayda en direct, timeline quotidienne et saisie rapide du soir.
  * 📦 **Sel3a** : Gestion du catalogue, spécifications dynamiques (tailles, couleurs), et module IA de recherche de prix concurrentiels.
  * 📊 **Fayda** : Tableau de bord financier consolidé (Ras Lmal, Ads, Logistique, ROI global).
  * 🛡️ **Gérants** : Statut du serveur cloud, astuces d'installation smartphone et sécurité.
* **Fast-Input Numérique** : Utilisation forcée de `inputMode="decimal"` pour afficher instantanément le pavé numérique natif sur smartphone pour tous les montants en Dinars Algériens (DA).
* **Caméra Dorsale Directe** : Capture photo immédiate via `capture="environment"` pour photographier le stock reçu directement depuis le smartphone.

---

## 🧠 Les 3 Règles d'Arbitrage des Sentinelles (Cycle 6 Jours)

1. **Alerte Prix Trop Élevé (Jour $\ge$ 3)** :
   * Si CTR $\ge$ 2.0% et 0 vente au Jour 3 $\rightarrow$ Recommandation d'une baisse immédiate du prix de 10% à 15% avec calcul de l'arrondi psychologique (ex: 2 900 DA).
2. **Opportunité de Maximisation** :
   * Si stock restant $\le$ 25% avant Jour 4 avec faible coût par acquisition (CPA) $\rightarrow$ Recommandation d'augmenter le prix unitaire sur le stock restant.
3. **Arrêt d'Urgence (Cut-Loss)** :
   * Si plus de 60% du budget publicitaire (soit $\ge 1\,200$ DA sur les 2 000 DA) est consommé sans aucune commande $\rightarrow$ Alerte rouge impérative pour couper immédiatement la campagne Meta.

---

## 🚀 Démarrage en Local

### 1. Lancer le Backend API (.NET)
```bash
# Se placer dans le répertoire backend
cd src/backend/LeLaboratoire.Api

# Lancer l'API sur http://localhost:5000
dotnet run --launch-profile http
```
L'API vérifie automatiquement la base de données, applique les tables et initialise les comptes administrateurs.

### 2. Lancer le Frontend (React PWA)
```bash
# Se placer dans le répertoire frontend
cd src/frontend

# Lancer le serveur de développement Vite sur http://localhost:3000
npm run dev
```

### 3. Exécuter les Tests Unitaires
```bash
dotnet test
```

---

## ☁️ Guide de Déploiement en Ligne (Coût : 0 DA)

### Étape 1 : Base de Données sur Neon.tech
1. Créez un compte gratuit sur [Neon.tech](https://neon.tech).
2. Créez un projet PostgreSQL gratuit et copiez la chaîne de connexion (`postgres://...` ou `Host=...;Database=...`).

### Étape 2 : Backend sur Render.com
1. Créez un compte sur [Render.com](https://render.com).
2. Créez un **New Web Service**, connectez votre dépôt GitHub.
3. Choisissez l'environnement **Docker**.
4. Spécifiez le chemin du Dockerfile : `src/backend/LeLaboratoire.Api/Dockerfile`.
5. Ajoutez les variables d'environnement :
   * `DATABASE_URL` = Votre chaîne Neon.tech.
   * `Jwt__Key` = Votre clé de signature secrète.
   * `Groq__ApiKey` = Votre clé gratuite obtenue sur [Groq Console](https://console.groq.com).

### Étape 3 : Frontend sur Vercel
1. Créez un compte sur [Vercel.com](https://vercel.com).
2. Importez le projet en sélectionnant le sous-dossier `src/frontend` comme racine (**Root Directory**).
3. Ajoutez la variable d'environnement :
   * `VITE_API_URL` = L'URL HTTPS de votre backend Render (ex: `https://le-laboratoire-api.onrender.com`).
4. Cliquez sur **Deploy**.

### Étape 4 : Élimination du Cold-Start sur Cron-Job.org
1. Rendez-vous sur [Cron-Job.org](https://cron-job.org).
2. Créez une tâche planifiée exécutant un appel HTTP `GET` sur `https://votre-api.onrender.com/api/health` toutes les **14 minutes**.
3. Votre API restera ainsi toujours active et réactive 24h/24 sans frais.
