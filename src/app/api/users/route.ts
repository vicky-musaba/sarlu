import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

// Initialize Firebase Admin
let auth: any;
let db: any;

try {
  if (!admin.apps.length) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      console.warn('FIREBASE_SERVICE_ACCOUNT_KEY not set - User creation API will not work');
    } else {
      const serviceAccount = JSON.parse(serviceAccountKey);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  }

  if (admin.apps.length > 0) {
    auth = getAuth();
    db = getFirestore();
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

export async function POST(request: NextRequest) {
  // Check if Firebase Admin is initialized
  if (!auth || !db) {
    return NextResponse.json(
      { error: 'Firebase Admin SDK not configured. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { email, password, username, role } = body;

    // Validation
    if (!email || !password || !username || !role) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'supervisor', 'auditor', 'cashier', 'financial_controller'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide' },
        { status: 400 }
      );
    }

    // Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: username,
    });

    // Create user in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      username,
      role,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        username,
        role,
      },
    });

  } catch (error: any) {
    console.error('Error creating user:', error);

    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 409 }
      );
    }

    if (error.code === 'auth/invalid-email') {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    );
  }
}
