/**
 * Script pour créer un compte superviseur générique
 */

const http = require('http');

const userData = {
  email: 'supervisor@lesecours.com',
  password: 'supervisor123',
  username: 'supervisor',
  role: 'supervisor',
};

async function createSupervisor() {
  console.log('🔐 Création du compte superviseur via API locale...');

  const postData = JSON.stringify(userData);

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/users',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);

          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ Compte superviseur créé avec succès !');
            console.log('\n👤 Identifiants de connexion :');
            console.log('   Email : supervisor@lesecours.com');
            console.log('   Mot de passe : supervisor123');
            console.log('   Rôle : supervisor');
            console.log('\n🎯 Prochaine étape :');
            console.log('   Déconnectez-vous et reconnectez-vous avec ces identifiants\n');
            resolve(response);
          } else {
            console.error('❌ Erreur lors de la création :', response.error);
            console.error('\n💡 Assurez-vous que :');
            console.error('   1. Le serveur Next.js est démarré (npm run dev)');
            console.error('   2. FIREBASE_SERVICE_ACCOUNT_KEY est configuré dans .env.local\n');
            console.error('   3. Connectez-vous en tant qu\'admin pour créer l\'utilisateur via l\'interface\n');
            reject(new Error(response.error));
          }
        } catch (e) {
          console.error('❌ Erreur de parsing de la réponse:', e);
          console.error('Réponse brute:', body);
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erreur de connexion au serveur:', error.message);
      console.error('\n💡 Assurez-vous que :');
      console.error('   1. Le serveur Next.js est démarré sur le port 3000');
      console.error('   2. Exécutez: npm run dev');
      console.error('   3. FIREBASE_SERVICE_ACCOUNT_KEY est configuré dans .env.local\n');
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

createSupervisor();
