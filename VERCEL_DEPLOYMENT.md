# Déploiement sur Vercel

## Configuration des variables d'environnement

Pour déployer l'application sur Vercel, vous devez configurer les variables d'environnement suivantes dans les paramètres de votre projet Vercel :

### Variables Firebase (obligatoires)

Aller dans : Vercel Dashboard → votre projet → Settings → Environment Variables

#### Variables publiques (commencent par NEXT_PUBLIC_)
- `NEXT_PUBLIC_FIREBASE_API_KEY` : Votre clé API Firebase
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` : Domaine d'authentification Firebase
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` : ID de votre projet Firebase
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` : Bucket de stockage Firebase
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` : ID d'expéditeur de messages
- `NEXT_PUBLIC_FIREBASE_APP_ID` : ID de l'application Firebase

#### Variable privée (pour Firebase Admin SDK)
- `FIREBASE_SERVICE_ACCOUNT_KEY` : Le contenu JSON complet de votre clé de service Firebase (entre guillemets)

**Note :** La variable `FIREBASE_SERVICE_ACCOUNT_KEY` est **optionnelle**. Si elle n'est pas configurée, l'API de création d'utilisateurs ne fonctionnera pas, mais le reste de l'application continuera de fonctionner normalement.

## Étapes de déploiement

### 1. Configurer les variables sur Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Cliquez sur **Settings** → **Environment Variables**
4. Ajoutez chaque variable une par une :
   - Cliquez sur **Add New**
   - Entrez le nom de la variable
   - Entrez la valeur
   - Sélectionnez l'environnement (Production, Preview, Development)
   - Cliquez sur **Save**

### 2. Redéployer

Après avoir ajouté les variables, redéployez votre projet :
- Allez dans **Deployments**
- Cliquez sur les trois points (...) à côté du dernier déploiement
- Cliquez sur **Redeploy**

## Résolution des problèmes courants

### Erreur : "Firebase API key not found"
- Vérifiez que toutes les variables `NEXT_PUBLIC_FIREBASE_*` sont configurées
- Assurez-vous que les valeurs sont correctes (copiées depuis Firebase Console)

### Erreur : "Firebase Admin SDK not configured"
- La variable `FIREBASE_SERVICE_ACCOUNT_KEY` n'est pas configurée
- Cette erreur n'empêche pas le fonctionnement de l'application, seule la création d'utilisateurs depuis l'interface sera désactivée
- Pour activer cette fonctionnalité, ajoutez la clé de service Firebase

### Erreur de build
- Vérifiez que `package.json` contient toutes les dépendances nécessaires
- Assurez-vous que Node.js version est compatible (version 20 ou supérieure recommandée)

## Test en local avant déploiement

Avant de déployer sur Vercel, testez localement :

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
# Copiez .env.local.example vers .env.local et remplissez les valeurs

# Démarrer en développement
npm run dev

# Tester le build
npm run build
```

## Déploiement automatique

Chaque push sur la branche `main` déclenchera automatiquement un déploiement sur Vercel si vous avez connecté votre dépôt GitHub à Vercel.
