/**
 * Script pour créer le compte superviseur eduard avec Firebase Admin SDK
 *
 * Utilisation: node scripts/create-eduard-supervisor.js
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
    const serviceAccountPath = path.join(__dirname, 'service-account.json');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    console.log('✅ Clé de service chargée');

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.cert(serviceAccount),
    });

    const auth = admin.auth();
    const db = admin.firestore();

    console.log('✅ Firebase Admin SDK initialisé');

    // Check if user already exists
    try {
      const existingUser = await auth.getUserByEmail(userData.email);
      console.log(`⚠️  L'utilisateur ${userData.email} existe déjà (UID: ${existingUser.uid})`);

      // Update user in Firestore
      await db.collection('users').doc(existingUser.uid).set({
        username: userData.username,
        role: userData.role,
        created_at: new Date().toISOString(),
      }, { merge: true });
      console.log(`✅ Utilisateur Firestore mis à jour avec le rôle ${userData.role}`);

    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, create it
        console.log('📝 Création du nouvel utilisateur...');

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
        console.log(`✅ Utilisateur Firestore créé : ${userData.username} avec rôle ${userData.role}`);
      } else {
        throw error;
      }
    }

    console.log('\n=====================================');
    console.log('✅ Compte superviseur eduard configuré avec succès !');
    console.log('\n👤 Identifiants de connexion :');
    console.log('   Email : eduard@lesecours.com');
    console.log('   Mot de passe : eduard123');
    console.log('   Rôle : supervisor');
    console.log('\n🎯 Prochaine étape :');
    console.log('   Déconnectez-vous et reconnectez-vous avec ces identifiants\n');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error.message);
    if (error.code) {
      console.error('   Code d\'erreur:', error.code);
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
