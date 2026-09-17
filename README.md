# LE SECOURS SARLU - Application Web Firebase

Application web moderne de gestion de caisse avec Next.js, Firebase et Vercel.

## 🚀 Installation

### 1. Installer les dépendances

```bash
cd E:/gestion/le-secours-firebase
npm install
```

### 2. Configuration Firebase

#### Créer un projet Firebase

1. Allez sur https://console.firebase.google.com/
2. Cliquez sur "Add project"
3. Nom du projet : "le-secours-sarlu"
4. Activez Google Analytics (optionnel)
5. Cliquez sur "Create project"

#### Activer les services Firebase

**Authentication :**
1. Allez dans "Build" > "Authentication"
2. Cliquez sur "Get started"
3. Activez "Email/Password" provider
4. Cliquez sur "Enable"

**Firestore Database :**
1. Allez dans "Build" > "Firestore Database"
2. Cliquez sur "Create database"
3. Choisissez une location (ex: europe-west)
4. Choisissez "Start in Test mode"
5. Cliquez sur "Enable"

#### Obtenir les clés de configuration

1. Allez dans "Project settings" (engrenage)
2. Scrollez vers "Your apps"
3. Cliquez sur "</>" (Web app)
4. Donnez un nom : "le-secours-web"
5. Cochez "Firebase Hosting" (optionnel)
6. Cliquez sur "Register app"
7. Copiez le code de configuration (firebaseConfig)

#### Mettre à jour .env.local

Remplacez les valeurs dans `.env.local` avec vos clés Firebase :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=votre_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=votre_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=votre_app_id
```

### 3. Initialiser Firebase automatiquement (Option recommandée)

Le plus simple est d'utiliser le script d'initialisation automatique :

```bash
cd E:/gestion/le-secours-firebase
npm run init-firebase
```

Ce script va automatiquement :
- ✅ Créer les utilisateurs admin et caissière dans Firebase Authentication
- ✅ Créer les utilisateurs dans Firestore
- ✅ Créer les 18 catégories par défaut
- ✅ Initialiser le solde de caisse à 0
- ✅ Configurer les paramètres entreprise

**Comptes créés :**
- Admin : admin@lesecours.com / admin123
- Caissière : caissiere@lesecours.com / cashier123

### 4. Alternative : Créer manuellement (Option avancée)

Si vous préférez créer les données manuellement, suivez les instructions de FIREBASE_SETUP.md

Vous devez créer les collections initiales dans Firestore :

**Categories par défaut :**
```javascript
// Collection: categories
// Documents par défaut :
[
  { name: "Achat papier", is_default: true },
  { name: "Achat poudre DTF", is_default: true },
  { name: "Achat film DTF", is_default: true },
  { name: "Achat encre DTF", is_default: true },
  { name: "Achat rouleau bâche", is_default: true },
  { name: "Achat rouleau vinyl", is_default: true },
  { name: "Achat rouleau papier photo", is_default: true },
  { name: "Achat rouleau one way", is_default: true },
  { name: "Achat structure roll up petit pied", is_default: true },
  { name: "Achat roll up grand pied", is_default: true },
  { name: "Autres", is_default: true },
  { name: "Transport", is_default: true },
  { name: "Paiement loyer", is_default: true },
  { name: "Paiement courant", is_default: true },
  { name: "Paiement carburant", is_default: true },
  { name: "Paiement huile moteur", is_default: true },
  { name: "Entretien machine", is_default: true },
  { name: "Entretien moteur", is_default: true },
]
```

**Utilisants :**
```javascript
// Collection: users
// Documents :
[
  { username: "admin", role: "admin" },
  { username: "caissiere", role: "cashier" },
]
```

**Solde caisse initial :**
```javascript
// Collection: cash_balance
// Document: current
{
  initial_balance: 0,
  current_balance: 0,
  total_entries: 0,
  total_outputs: 0,
}
```

**Paramètres entreprise :**
```javascript
// Collection: company_settings
// Document: current
{
  name: "LE SECOURS SARLU",
  address: "",
  phone: "",
  email: "",
  currency: "FC",
}
```

## 🏃 Lancer l'application

```bash
npm run dev
```

L'application sera accessible sur http://localhost:3000

## 🚀 Déploiement sur Vercel

### 1. Installer Vercel CLI

```bash
npm install -g vercel
```

### 2. Déployer

```bash
vercel
```

Suivez les instructions :
1. Connectez-vous à votre compte Vercel
2. Choisissez les options par défaut
3. L'application sera déployée sur Vercel

### 3. Variables d'environnement sur Vercel

Ajoutez les variables Firebase dans le dashboard Vercel :
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## 📁 Structure du projet

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/ - Page de connexion
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/ - Tableau de bord
│   │   ├── new-output/ - Nouvelle sortie
│   │   ├── history/ - Historique
│   │   ├── categories/ - Gestion catégories
│   │   ├── cash/ - Gestion caisse
│   │   ├── audit/ - Journal d'audit
│   │   ├── reports/ - Rapports
│   │   ├── backup/ - Sauvegardes
│   │   ├── settings/ - Paramètres
│   │   ├── print-receipt/ - Impression reçu
│   │   ├── edit-output/ - Modification sortie
│   │   └── layout.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Layout.tsx
│   ├── Sidebar.tsx
│   └── ui/ - Composants UI réutilisables
├── lib/
│   ├── firebase.ts - Configuration Firebase
│   └── firestore.ts - Opérations Firestore
├── types/
│   └── index.ts - Types TypeScript
└── contexts/
    └── AuthContext.tsx - Contexte d'authentification
```

## 🔐 Règles de sécurité Firestore

Les règles de sécurité doivent être configurées dans Firebase Console > Firestore Database > Rules pour protéger les données :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users: uniquement l'utilisateur lui-même peut lire/écrire son profil
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Categories: admin peut tout, cashier peut lire
    match /categories/{categoryId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Outputs: admin peut tout, cashier peut lire et créer
    match /outputs/{outputId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Cash balance: admin peut tout, cashier peut lire
    match /cash_balance/{balanceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Cash entries: admin peut tout, cashier peut lire et créer
    match /cash_entries/{entryId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Audit logs: admin peut tout
    match /audit_logs/{logId} {
      allow read, write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Company settings: admin peut tout
    match /company_settings/{settingsId} {
      allow read, write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 📝 Pages implémentées

Toutes les pages principales sont maintenant implémentées :

- ✅ Dashboard - Statistiques temps réel avec graphiques
- ✅ New Output - Création de sorties avec numérotation automatique
- ✅ History - Historique avec filtres et actions (imprimer, modifier, supprimer)
- ✅ Categories - CRUD complet des catégories (par défaut et personnalisées)
- ✅ Cash - Gestion du solde de caisse et entrées
- ✅ Audit - Journal d'audit complet avec logs colorés
- ✅ Reports - Rapports avec exports PDF et Excel
- ✅ Backup - Export JSON des données (restauration à implémenter)
- ✅ Settings - Gestion utilisateurs et paramètres entreprise
- ✅ Print Receipt - Impression de reçus (58mm, 80mm, A4)
- ✅ Edit Output - Modification des sorties existantes

## 🎯 Prochaines étapes

1. Configurer Firebase avec vos clés
2. Créer les utilisateurs dans Firebase Authentication
3. Initialiser les données dans Firestore
4. Tester l'application localement
5. Compléter les pages restantes
6. Déployer sur Vercel

## 💡 Comptes de test

**Administrateur :**
- Email : admin@lesecours.com
- Mot de passe : admin123

**Caissière :**
- Email : caissiere@lesecours.com
- Mot de passe : cashier123

---

**LE SECOURS SARLU** - © 2024
