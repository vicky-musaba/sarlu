import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config({ path: '../.env.local' });

async function createSupervisorEduard() {
  console.log('🔐 Création du compte superviseur eduard avec Firebase Admin SDK...');

  const userData = {
    email: 'eduard@lesecours.com',
    password: 'eduard123',
    username: 'eduard',
    role: 'supervisor',
  };

  try {
    // Check if service account key is set
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local');
    }

    // Parse service account key
    const serviceAccount = JSON.parse(serviceAccountKey);

    // Initialize Firebase Admin
    // @ts-ignore
    if (!admin.apps || !admin.apps.length) {
      // @ts-ignore
      admin.initializeApp({
        // @ts-ignore
        credential: admin.credential.cert(serviceAccount),
      });
    }

    // @ts-ignore
    const auth = admin.auth();
    // @ts-ignore
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
    if (error.code === 'auth/email-already-exists') {
      console.log(`⚠️  L'email ${userData.email} existe déjà dans Firebase Authentication`);
      console.log('💡 Si l\'utilisateur existe déjà mais que vous voulez mettre à jour son rôle dans Firestore,');
      console.log('   vous devez le faire manuellement via Firebase Console.\n');
    } else if (error.code === 'auth/invalid-email') {
      console.error(`❌ Format d'email invalide : ${userData.email}`);
    } else if (error.code === 'auth/weak-password') {
      console.error('❌ Le mot de passe doit contenir au moins 6 caractères');
    } else if (error.message.includes('FIREBASE_SERVICE_ACCOUNT_KEY')) {
      console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local');
      console.error('\n💡 Pour configurer Firebase Admin SDK :');
      console.error('   1. Consultez FIREBASE_ADMIN_SETUP.md');
      console.error('   2. Téléchargez la clé de service depuis Firebase Console');
      console.error('   3. Ajoutez-la à votre fichier .env.local\n');
    } else {
      console.error('❌ Erreur lors de la création de l\'utilisateur:', error.message);
    }
    console.error('\n💡 Vérifiez que :');
    console.error('   1. .env.local contient FIREBASE_SERVICE_ACCOUNT_KEY');
    console.error('   2. Firebase Authentication est activé');
    console.error('   3. Firestore Database est activé');
    console.error('   4. Les règles de sécurité permettent l\'écriture\n');
    process.exit(1);
  }
}

createSupervisorEduard();
