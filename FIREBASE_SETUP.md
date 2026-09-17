# Guide de Configuration Firebase

## 🚀 Méthode Rapide : Script d'Initialisation Automatique (Recommandé)

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

## 🔧 Méthode Manuelle : Configuration Étape par Étape

Si vous préférez configurer manuellement, suivez ces étapes :

## Étape 1 : Créer un projet Firebase

1. Allez sur https://console.firebase.google.com/
2. Cliquez sur "Add project"
3. Nom du projet : `le-secours-sarlu`
4. Activez Google Analytics (optionnel)
5. Cliquez sur "Create project"
6. Attendez que le projet soit créé

## Étape 2 : Activer Authentication

1. Dans le projet Firebase, allez dans "Build" > "Authentication"
2. Cliquez sur "Get started"
3. Sélectionnez "Email/Password"
4. Cliquez sur "Enable"
5. Cliquez sur "Save"

## Étape 3 : Activer Firestore Database

1. Allez dans "Build" > "Firestore Database"
2. Cliquez sur "Create database"
3. Choisissez une location (ex: europe-west)
4. Choisissez "Start in Test mode"
5. Cliquez sur "Enable"

## Étape 4 : Obtenir les clés de configuration

1. Allez dans "Project settings" (icône engrenage en haut à gauche)
2. Scrollez vers "Your apps"
3. Cliquez sur "</>" (Web app)
4. Donnez un nom : `le-secours-web`
5. Ne cochez PAS "Firebase Hosting" pour l'instant
6. Cliquez sur "Register app"
7. Copiez le code de configuration qui s'affiche

## Étape 5 : Mettre à jour .env.local

Ouvrez le fichier `E:/gestion/le-secours-firebase/.env.local` et remplacez les valeurs avec vos clés Firebase :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD votre_clé_ici
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=le-secours-sarlu.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=le-secours-sarlu
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=le-secours-sarlu.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=votre_app_id
```

## Étape 6 : Créer les utilisateurs dans Firebase Authentication

1. Allez dans "Build" > "Authentication" > "Users"
2. Cliquez sur "Add user"
3. Créez l'administrateur :
   - Email : `admin@lesecours.com`
   - Mot de passe : `admin123`
   - Cliquez sur "Add user"
4. Créez la caissière :
   - Email : `caissiere@lesecours.com`
   - Mot de passe : `cashier123`
   - Cliquez sur "Add user"

## Étape 7 : Initialiser les données dans Firestore

### Méthode 1 : Via Firebase Console (Recommandé)

1. Allez dans "Build" > "Firestore Database"
2. Cliquez sur "Start collection"
3. Nommez la collection : `users`
4. Ajoutez 2 documents :

**Document 1 (admin) :**
- ID : (auto)
- Champs :
  - username : "admin"
  - role : "admin"
  - created_at : (timestamp actuel)

**Document 2 (caissière) :**
- ID : (auto)
- Champs :
  - username : "caissiere"
  - role : "cashier"
  - created_at : (timestamp actuel)

5. Cliquez sur "Add collection" pour créer `categories`
6. Ajoutez les documents de catégories par défaut (copier depuis README.md)

7. Cliquez sur "Add collection" pour créer `cash_balance`
8. Ajoutez un document :
   - ID : `current`
   - Champs :
     - initial_balance : 0
     - current_balance : 0
     - total_entries : 0
     - total_outputs : 0

9. Cliquez sur "Add collection" pour créer `company_settings`
10. Ajoutez un document :
    - ID : `current`
    - Champs :
      - name : "LE SECOURS SARLU"
      - address : ""
      - phone : ""
      - email : ""
      - currency : "FC"
      - logo_path : null

### Méthode 2 : Via script (Avancé)

Si vous préférez, vous pouvez créer un script pour initialiser les données automatiquement. Contactez-moi pour créer ce script.

## Étape 8 : Configurer les règles de sécurité Firestore

1. Allez dans "Build" > "Firestore Database" > "Rules"
2. Remplacez les règles existantes par celles du README.md
3. Cliquez sur "Publish"

## Étape 9 : Tester l'application

1. Dans le terminal, exécutez :
   ```bash
   cd E:/gestion/le-secours-firebase
   npm run dev
   ```

2. Ouvrez votre navigateur sur http://localhost:3000

3. Connectez-vous avec :
   - Admin : admin@lesecours.com / admin123
   - Caissière : caissiere@lesecours.com / cashier123

## Étape 10 : Déploiement sur Vercel

### Option 1 : Via Vercel CLI

1. Installez Vercel CLI :
   ```bash
   npm install -g vercel
   ```

2. Déployez :
   ```bash
   cd E:/gestion/le-secours-firebase
   vercel
   ```

3. Suivez les instructions :
   - Connectez-vous à votre compte Vercel
   - Choisissez les options par défaut
   - L'application sera déployée

4. Ajoutez les variables d'environnement dans le dashboard Vercel

### Option 2 : Via Git

1. Créez un repository sur GitHub
2. Poussez le code
3. Importez le repository dans Vercel
4. Configurez les variables d'environnement

## 🔑 Variables d'environnement Vercel

Dans le dashboard Vercel > Settings > Environment Variables, ajoutez :

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## ✅ Vérification

Une fois configuré, vérifiez que :

- [ ] Firebase Authentication est activé
- [ ] Firestore Database est activé
- [ ] Les utilisateurs sont créés dans Authentication
- [ ] Les collections sont créées dans Firestore
- [ ] Les règles de sécurité sont publiées
- [ ] .env.local est configuré
- [ ] L'application fonctionne localement
- [ ] Le déploiement sur Vercel fonctionne

## 🆘 Problèmes courants

### Erreur "Firebase: Error (auth/user-not-found)"
- Vérifiez que les utilisateurs sont créés dans Firebase Authentication
- Vérifiez que les emails sont corrects

### Erreur "Firebase: Error (auth/wrong-password)"
- Vérifiez que les mots de passe sont corrects
- Réinitialisez le mot de passe dans Firebase Console

### Erreur "Firebase: Error (auth/configuration-not-found)"
- Vérifiez que .env.local contient les bonnes clés Firebase
- Vérifiez que les clés correspondent à votre projet Firebase

### Erreur "Permission denied"
- Vérifiez que les règles de sécurité Firestore sont publiées
- Vérifiez que l'utilisateur a le bon rôle dans la collection users

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez la console du navigateur pour les erreurs
2. Vérifiez les logs Firebase Console
3. Contactez-moi pour de l'aide

---

Une fois configuré, l'application sera prête à être utilisée et déployée sur Vercel !
