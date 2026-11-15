/**
 * Script pour créer le compte superviseur eduard
 *
 * Prérequis :
 * 1. Téléchargez la clé de service depuis Firebase Console
 *    - Project Settings > Service Accounts > Generate new private key
 * 2. Sauvegardez le fichier JSON téléchargé dans le dossier scripts/ avec le nom "service-account.json"
 * 3. Exécutez ce script : node scripts/create-supervisor-eduard.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

async function createSupervisorEduard() {
  console.log('🔐 Création du compte superviseur eduard avec Firebase Admin SDK...');

  const userData = {
    email: 'eduard@lesecours.com',
    password: 'eduard123',
    username: 'eduard',
    role: 'supervisor',
  };

  try {
    // Load service account key from file
    const serviceAccountPath = path.join(process.cwd(), 'scripts', 'service-account.json');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    console.log('✅ Clé de service chargée');

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.cert(serviceAccount),
    });

    const auth = admin.auth();
    const db = admin.firestore();

    console.log('✅ Firebase Admin SDK initialisé');

    // Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.username,
    });
    console.log(`✅ Utilisateur Firebase Auth créé : ${userData.email}`);
    console.log(`   UID: ${userRecord.uid}`);

    // Create user in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      username: userData.username,
      role: userData.role,
      created_at: new Date().toISOString(),
    });
    console.log(`✅ Utilisateur Firestore créé : ${userData.username}`);

    console.log('\n=====================================');
    console.log('✅ Compte superviseur eduard créé avec succès !');
    console.log('\n👤 Identifiants de connexion :');
    console.log('   Email : eduard@lesecours.com');
    console.log('   Mot de passe : eduard123');
    console.log('   Rôle : supervisor');
    console.log('\n🎯 Prochaine étape :');
    console.log('   npm run dev');
    console.log('   Puis connectez-vous avec les identifiants ci-dessus\n');

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('❌ Fichier service-account.json non trouvé dans le dossier scripts/');
      console.error('\n💡 Pour configurer :');
      console.error('   1. Allez sur Firebase Console > Project Settings > Service Accounts');
      console.error('   2. Cliquez sur "Generate new private key"');
      console.error('   3. Sauvegardez le fichier JSON dans E:/gestion/le-secours-firebase/scripts/');
      console.error('   4. Renommez-le en "service-account.json"');
      console.error('   5. Réexécutez ce script\n');
    } else if (error.code === 'auth/email-already-exists') {
      console.log(`⚠️  L'email ${userData.email} existe déjà dans Firebase Authentication`);
      console.log('💡 Pour mettre à jour le rôle dans Firestore :');
      console.error('   1. Allez sur Firebase Console > Firestore Database');
      console.error('   2. Naviguez vers la collection "users"');
      console.error('   3. Trouvez le document avec l\'email eduard@lesecours.com');
      console.error('   4. Mettez à jour le champ "role" à "supervisor"\n');
    } else if (error.code === 'auth/invalid-email') {
      console.error(`❌ Format d'email invalide : ${userData.email}`);
    } else if (error.code === 'auth/weak-password') {
      console.error('❌ Le mot de passe doit contenir au moins 6 caractères');
    } else {
      console.error('❌ Erreur lors de la création de l\'utilisateur:', error.message);
    }
    console.error('\n💡 Vérifiez que :');
    console.error('   1. Le fichier service-account.json existe dans scripts/');
    console.error('   2. Firebase Authentication est activé');
    console.error('   3. Firestore Database est activé');
    console.error('   4. Les règles de sécurité permettent l\'écriture\n');
    process.exit(1);
  }
}

createSupervisorEduard();
