import dotenv from 'dotenv';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

async function createFinancialController() {
  console.log('🔐 Création du Contrôleur Financier...');

  // Récupérer les arguments de la ligne de commande
  const args = process.argv.slice(2);
  const email = args[0] || 'controller@lesecours.com';
  const password = args[1] || 'controller123';
  const username = args[2] || 'controller';

  console.log(`📧 Email: ${email}`);
  console.log(`👤 Username: ${username}`);

  try {
    // Créer l'utilisateur dans Firebase Authentication
    console.log('\n1️⃣ Création dans Firebase Authentication...');
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log(`✅ Utilisateur Firebase créé avec UID: ${userCredential.user.uid}`);

    // Créer l'utilisateur dans Firestore avec le rôle financial_controller
    console.log('\n2️⃣ Création dans Firestore...');
    const usersRef = collection(db, 'users');
    await setDoc(doc(usersRef, userCredential.user.uid), {
      username: username,
      role: 'financial_controller',
      created_at: new Date().toISOString(),
    });
    console.log(`✅ Utilisateur Firestore créé avec le rôle: financial_controller`);

    console.log('\n=====================================');
    console.log('✅ Contrôleur Financier créé avec succès !');
    console.log('\n👤 Identifiants de connexion :');
    console.log(`   Email: ${email}`);
    console.log(`   Mot de passe: ${password}`);
    console.log(`   Username: ${username}`);
    console.log(`   Rôle: Contrôleur Financier`);
    console.log('\n🎯 Prochaine étape :');
    console.log('   npm run dev');
    console.log('   Puis connectez-vous avec ces identifiants\n');

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.error('\n❌ Erreur: Cet email est déjà utilisé.');
      console.error('💡 Si l\'utilisateur existe déjà, vous devez mettre à jour son rôle manuellement dans Firestore.');
    } else if (error.code === 'auth/invalid-email') {
      console.error('\n❌ Erreur: Format d\'email invalide.');
    } else if (error.code === 'auth/weak-password') {
      console.error('\n❌ Erreur: Le mot de passe est trop faible (minimum 6 caractères).');
    } else {
      console.error('\n❌ Erreur lors de la création:', error.message);
    }
    console.error('\n💡 Vérifiez que :');
    console.error('   1. .env.local contient vos clés Firebase');
    console.error('   2. Firebase Authentication est activé');
    console.error('   3. Firestore Database est activé');
    console.error('   4. Les règles de sécurité permettent l\'écriture\n');
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Script de création de Contrôleur Financier');
  console.log('=====================================\n');

  // Check if Firebase config is set
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.error('❌ Firebase API key not found in .env.local');
    console.error('💡 Assurez-vous que le fichier .env.local existe et contient vos clés Firebase\n');
    process.exit(1);
  }

  console.log('📋 Configuration Firebase chargée');
  console.log(`Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}\n`);

  await createFinancialController();
}

main();
