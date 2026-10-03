# Configuration de Firebase Admin SDK pour la création d'utilisateurs

Pour permettre à l'admin de créer des utilisateurs directement depuis l'application, vous devez configurer Firebase Admin SDK.

## Étape 1 : Télécharger la clé de service

1. Allez sur la [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet (secours-sarlu-1920f)
3. Cliquez sur l'icône ⚙️ (Paramètres) → **Project Settings**
4. Dans l'onglet **Service Accounts**, cliquez sur **Generate new private key**
5. Confirmez en cliquant sur **Generate key**
6. Le fichier JSON sera téléchargé automatiquement

## Étape 2 : Ajouter la clé au fichier .env.local

1. Ouvrez le fichier `.env.local` à la racine du projet
2. Ouvrez le fichier JSON téléchargé avec un éditeur de texte
3. Copiez tout le contenu du fichier JSON
4. Collez-le dans la variable `FIREBASE_SERVICE_ACCOUNT_KEY` entre les guillemets

**Exemple :**
```env
FIREBASE_SERVICE_ACCOUNT_KEY='{
  "type": "service_account",
  "project_id": "secours-sarlu-1920f",
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}'
```

⚠️ **Important :**
- Ne commitez jamais ce fichier JSON dans un dépôt public
- Ne partagez jamais cette clé avec des personnes non autorisées
- Cette clé donne un accès administrateur complet à votre projet Firebase

## Étape 3 : Redémarrer l'application

Après avoir ajouté la clé, redémarrez l'application :

```bash
npm run dev
```

## Utilisation

Une fois configuré, l'admin peut :

1. Se connecter à l'application
2. Aller dans **Paramètres** → **Gestion des utilisateurs**
3. Cliquer sur **+ Ajouter un utilisateur**
4. Remplir le formulaire avec :
   - **Email** : l'adresse email de l'utilisateur
   - **Nom d'utilisateur** : le nom d'affichage
   - **Mot de passe** : minimum 6 caractères
   - **Rôle** : Administrateur, Superviseur, Auditrice, Caissière, ou Contrôleur Financier
5. Cliquer sur **Ajouter**

L'utilisateur sera créé automatiquement dans :
- ✅ Firebase Authentication (pour la connexion)
- ✅ Firestore (avec le rôle assigné)

## Dépannage

### Erreur : "Firebase API key not found"
- Vérifiez que le fichier `.env.local` existe
- Vérifiez que les variables Firebase sont correctement définies

### Erreur : "Error: Error while making request: getaddrinfo ENOTFOUND"
- Vérifiez que la clé de service est correctement formatée
- Assurez-vous que le JSON est entre guillemets simples dans le fichier .env.local

### Erreur : "auth/email-already-exists"
- Cet email est déjà utilisé dans Firebase Authentication
- Utilisez un autre email ou supprimez l'utilisateur existant d'abord
