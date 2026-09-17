import dotenv from 'dotenv';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';

dotenv.config({ path: '../.env.local' });

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

// Default categories
const defaultCategories = [
  { name: 'Achat papier', is_default: true },
  { name: 'Achat poudre DTF', is_default: true },
  { name: 'Achat film DTF', is_default: true },
  { name: 'Achat encre DTF', is_default: true },
  { name: 'Achat rouleau bâche', is_default: true },
  { name: 'Achat rouleau vinyl', is_default: true },
  { name: 'Achat rouleau papier photo', is_default: true },
  { name: 'Achat rouleau one way', is_default: true },
  { name: 'Achat structure roll up petit pied', is_default: true },
  { name: 'Achat roll up grand pied', is_default: true },
  { name: 'Autres', is_default: true },
  { name: 'Transport', is_default: true },
  { name: 'Paiement loyer', is_default: true },
  { name: 'Paiement courant', is_default: true },
  { name: 'Paiement carburant', is_default: true },
  { name: 'Paiement huile moteur', is_default: true },
  { name: 'Entretien machine', is_default: true },
  { name: 'Entretien moteur', is_default: true },
];

async function createUsers() {
  console.log('🔐 Création des utilisateurs dans Firebase Authentication...');

  const users = [
    { email: 'admin@lesecours.com', password: 'admin123', username: 'admin', role: 'admin' },
    { email: 'caissiere@lesecours.com', password: 'cashier123', username: 'caissiere', role: 'cashier' },
  ];

  const createdUsers = [];

  for (const userData of users) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      console.log(`✅ Utilisateur créé : ${userData.email}`);
      createdUsers.push({
        uid: userCredential.user.uid,
        ...userData,
      });
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  Utilisateur existe déjà : ${userData.email}`);
        // Pour obtenir l'UID d'un utilisateur existant, nous devons utiliser une autre méthode
        // Pour l'instant, nous allons skipper et documenter
        createdUsers.push({
          uid: null,
          ...userData,
          exists: true,
        });
      } else {
        console.error(`❌ Erreur création utilisateur ${userData.email}:`, error.message);
      }
    }
  }

  return createdUsers;
}

async function initializeFirestore() {
  console.log('🗄️  Initialisation de Firestore...');

  const batch = writeBatch(db);

  // Initialize categories
  console.log('📁 Création des catégories par défaut...');
  const categoriesRef = collection(db, 'categories');
  defaultCategories.forEach((category, index) => {
    const docRef = doc(categoriesRef);
    batch.set(docRef, {
      ...category,
      created_at: new Date().toISOString(),
    });
  });
  console.log(`✅ ${defaultCategories.length} catégories ajoutées`);

  // Initialize cash balance
  console.log('💵 Initialisation du solde de caisse...');
  const balanceRef = doc(db, 'cash_balance', 'current');
  batch.set(balanceRef, {
    initial_balance: 0,
    current_balance: 0,
    total_entries: 0,
    total_outputs: 0,
  });
  console.log('✅ Solde de caisse initialisé');

  // Initialize company settings
  console.log('⚙️  Initialisation des paramètres entreprise...');
  const settingsRef = doc(db, 'company_settings', 'current');
  batch.set(settingsRef, {
    name: 'LE SECOURS SARLU',
    address: '',
    phone: '',
    email: '',
    currency: 'FC',
    logo_path: null,
    updated_at: new Date().toISOString(),
  });
  console.log('✅ Paramètres entreprise initialisés');

  await batch.commit();
  console.log('✅ Firestore initialisé avec succès');
}

async function createUsersInFirestore(createdUsers) {
  console.log('📝 Création des utilisateurs dans Firestore...');

  const usersRef = collection(db, 'users');

  for (const user of createdUsers) {
    if (user.exists) {
      console.log(`⏭️  Skip Firestore pour ${user.email} (existe déjà)`);
      continue;
    }

    if (user.uid) {
      try {
        await setDoc(doc(usersRef, user.uid), {
          username: user.username,
          role: user.role,
          created_at: new Date().toISOString(),
        });
        console.log(`✅ Utilisateur Firestore créé : ${user.username}`);
      } catch (error) {
        console.error(`❌ Erreur création Firestore pour ${user.username}:`, error.message);
      }
    }
  }
}

async function main() {
  console.log('🚀 Initialisation de Firebase pour LE SECOURS SARLU');
  console.log('=====================================\n');

  try {
    // Check if Firebase config is set
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      throw new Error('Firebase API key not found in .env.local');
    }

    console.log('📋 Configuration Firebase chargée');
    console.log(`Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}\n`);

    // Create users in Firebase Authentication
    const createdUsers = await createUsers();

    // Initialize Firestore data
    await initializeFirestore();

    // Create users in Firestore
    await createUsersInFirestore(createdUsers);

    console.log('\n=====================================');
    console.log('✅ Initialisation terminée avec succès !');
    console.log('\n👤 Comptes créés :');
    console.log('   Admin : admin@lesecours.com / admin123');
    console.log('   Caissière : caissiere@lesecours.com / cashier123');
    console.log('\n📊 Données initialisées :');
    console.log('   - 18 catégories par défaut');
    console.log('   - Solde de caisse initialisé à 0');
    console.log('   - Paramètres entreprise configurés');
    console.log('\n🎯 Prochaine étape :');
    console.log('   npm run dev');
    console.log('   Puis ouvrez http://localhost:3000\n');

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'initialisation:', error.message);
    console.error('\n💡 Vérifiez que :');
    console.error('   1. .env.local contient vos clés Firebase');
    console.error('   2. Firebase Authentication est activé');
    console.error('   3. Firestore Database est activé');
    console.error('   4. Les règles de sécurité permettent l\'écriture\n');
    process.exit(1);
  }
}

main();
