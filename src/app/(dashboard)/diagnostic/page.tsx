'use client';

import React, { useEffect, useState } from 'react';
import { getAllUsers, getAllCategories, getCashBalance } from '@/lib/firestore';
import { User } from '@/types';
import { Card } from '@/components/ui/Card';

export default function DiagnosticPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState([]);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiag();
  }, []);

  const loadDiag = async () => {
    try {
      const [usersData, categoriesData, balanceData] = await Promise.all([
        getAllUsers(),
        getAllCategories(),
        getCashBalance(),
      ]);
      setUsers(usersData);
      setCategories(categoriesData);
      setBalance(balanceData);
    } catch (error) {
      console.error('Failed to load diagnostic data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Diagnostic Firebase</h1>

      <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Utilisateurs dans Firestore</h2>
        {users.length > 0 ? (
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="p-4 bg-gray-50 rounded-lg">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Rôle:</strong> {user.role}</p>
                <p><strong>Créé le:</strong> {new Date(user.created_at).toLocaleString('fr-FR')}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-red-600">Aucun utilisateur trouvé dans Firestore</p>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Catégories</h2>
        <p className="text-gray-600">Nombre de catégories: {categories.length}</p>
        {categories.length > 0 && (
          <div className="mt-4 space-y-2">
            {categories.slice(0, 5).map((cat) => (
              <div key={cat.id} className="p-2 bg-gray-50 rounded">
                {cat.name} {cat.is_default ? '(par défaut)' : '(personnalisée)'}
              </div>
            ))}
            {categories.length > 5 && <p className="text-sm text-gray-500">... et {categories.length - 5} autres</p>}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Solde de caisse</h2>
        {balance ? (
          <div className="space-y-2">
            <p><strong>Solde initial:</strong> {balance.initial_balance}</p>
            <p><strong>Solde actuel:</strong> {balance.current_balance}</p>
            <p><strong>Total entrées:</strong> {balance.total_entries}</p>
            <p><strong>Total sorties:</strong> {balance.total_outputs}</p>
          </div>
        ) : (
          <p className="text-red-600">Solde de caisse non initialisé</p>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Instructions</h2>
        <div className="space-y-4 text-gray-600">
          <p>Si vous ne voyez pas les utilisateurs ci-dessous :</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Exécutez le script d&apos;initialisation: <code className="bg-gray-100 px-2 py-1 rounded">npm run init-firebase</code></li>
            <li>Créez manuellement les utilisateurs dans Firebase Console puis Authentication puis Users</li>
            <li>Puis créez les documents correspondants dans Firestore</li>
          </ol>
          <p>Si les utilisateurs existent mais le rôle est incorrect :</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Allez dans Firebase Console puis Firestore Database</li>
            <li>Collection: users</li>
            <li>Modifiez le champ role de cashier à admin</li>
          </ol>
        </div>
      </Card>
    </div>
  );
}
