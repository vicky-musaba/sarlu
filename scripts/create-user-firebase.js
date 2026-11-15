/**
 * Script pour créer un utilisateur directement sur Firebase via API REST
 * Utilise la clé de service pour s'authentifier
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const serviceAccountPath = path.join(__dirname, 'service-account.json');
const project_id = 'secours-sarlu-1920f';

const userData = {
  email: 'eduard@lesecours.com',
  password: 'eduard123',
  displayName: 'eduard',
};

async function getAccessToken() {
  console.log('🔑 Obtention du token d\'accès...');

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: generateJWT(serviceAccount),
    });

    const options = {
      hostname: 'oauth2.googleapis.com',
      port: 443,
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response.access_token);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function generateJWT(serviceAccount) {
  // Pour simplifier, on va utiliser une approche directe avec Firebase Admin SDK
  // Mais comme ça ne fonctionne pas, on va utiliser gcloud SDK si disponible
  // Sinon, on va créer l'utilisateur via Firebase Console
  console.log('⚠️  La génération JWT manuelle est complexe.');
  console.log('💡 Utilisation alternative : Firebase Console');
  return null;
}

async function createUserViaAPI() {
  console.log('🔐 Création du compte superviseur eduard via Firebase API...');

  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    console.log('✅ Clé de service chargée');

    // Utiliser gcloud si disponible
    console.log('\n⚠️  L\'API REST Firebase nécessite une authentification complexe.');
    console.log('💡 Solution recommandée :');
    console.log('   1. Allez sur Firebase Console');
    console.log('   2. Build > Authentication > Users');
    console.log('   3. Cliquez sur "Add user"');
    console.log('   4. Email: eduard@lesecours.com');
    console.log('   5. Password: eduard123');
    console.log('   6. Cliquez sur "Add user"');
    console.log('   7. Allez dans Firestore Database > collection "users"');
    console.log('   8. Ajoutez un document avec:');
    console.log('      - username: "eduard"');
    console.log('      - role: "supervisor"');
    console.log('      - created_at: (timestamp actuel)\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Alternative: utiliser Firebase CLI si installé
async function createUserViaFirebaseCLI() {
  console.log('🔐 Tentative avec Firebase CLI...');

  const { exec } = require('child_process');

  // Vérifier si firebase CLI est installé
  exec('firebase --version', (error, stdout, stderr) => {
    if (error) {
      console.log('⚠️  Firebase CLI n\'est pas installé');
      console.log('💡 Pour installer: npm install -g firebase-tools');
      createUserViaAPI();
      return;
    }

    console.log('✅ Firebase CLI est installé');
    console.log('⚠️  Firebase CLI n\'a pas de commande directe pour créer des utilisateurs');
    console.log('💡 Utilisez Firebase Console comme indiqué ci-dessus\n');
    createUserViaAPI();
  });
}

createUserViaFirebaseCLI();
