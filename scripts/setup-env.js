/**
 * Script pour configurer FIREBASE_SERVICE_ACCOUNT_KEY dans .env.local
 */

const fs = require('fs');
const path = require('path');

async function setupEnv() {
  console.log('🔧 Configuration de FIREBASE_SERVICE_ACCOUNT_KEY dans .env.local...');

  const envPath = path.join(process.cwd(), '.env.local');
  const serviceAccountPath = path.join(process.cwd(), 'scripts', 'service-account.json');

  try {
    // Read service account key
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    const serviceAccountString = JSON.stringify(serviceAccount);

    // Read existing .env.local or create new one
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Check if FIREBASE_SERVICE_ACCOUNT_KEY already exists
    if (envContent.includes('FIREBASE_SERVICE_ACCOUNT_KEY=')) {
      console.log('⚠️  FIREBASE_SERVICE_ACCOUNT_KEY existe déjà dans .env.local');
      console.log('💡 Supprimez la ligne existante si vous voulez la mettre à jour\n');
      return;
    }

    // Add the key to .env.local
    const newLine = `\nFIREBASE_SERVICE_ACCOUNT_KEY='${serviceAccountString}'`;
    fs.appendFileSync(envPath, newLine);

    console.log('✅ FIREBASE_SERVICE_ACCOUNT_KEY ajouté à .env.local');
    console.log('\n🎯 Prochaine étape :');
    console.log('   1. Redémarrez le serveur : npm run dev');
    console.log('   2. Connectez-vous en tant qu\'admin');
    console.log('   3. Allez dans Paramètres > Gestion des utilisateurs');
    console.log('   4. Créez le compte superviseur\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\n💡 Assurez-vous que :');
    console.error('   1. scripts/service-account.json existe');
    console.error('   2. Vous avez les droits d\'écriture sur .env.local\n');
  }
}

setupEnv();
