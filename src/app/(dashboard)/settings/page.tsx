'use client';

import React, { useEffect, useState } from 'react';
import { getAllUsers, createUser, updateUser, deleteUser, getCompanySettings, updateCompanySettings, clearAllOperationalData } from '@/lib/firestore';
import { User, CompanySettings } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({ username: '', password: '', role: 'cashier' });
  const [settingsFormData, setSettingsFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    currency: 'FC',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, settingsData] = await Promise.all([
        getAllUsers(),
        getCompanySettings(),
      ]);
      setUsers(usersData);
      if (settingsData) {
        setCompanySettings(settingsData);
        setSettingsFormData({
          name: settingsData.name,
          address: settingsData.address,
          phone: settingsData.phone,
          email: settingsData.email,
          currency: settingsData.currency,
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearOperationalData = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données d\'exploitation ? Cette action est irréversible et va économiser l\'espace de stockage Firebase.')) {
      try {
        await clearAllOperationalData();
        setSuccess('Toutes les données d\'exploitation ont été supprimées avec succès');
        // Reload to reflect changes
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        console.error('Failed to clear operational data:', error);
        setError('Erreur lors de la suppression des données');
      }
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create user in Firebase Auth first (needs to be done via Firebase Console for now)
      // Then create in Firestore
      await createUser({
        username: userFormData.username,
        role: userFormData.role as 'admin' | 'cashier',
        created_at: new Date().toISOString(),
      });
      await loadData();
      setShowAddUserModal(false);
      setUserFormData({ username: '', password: '', role: 'cashier' });
      setSuccess('Utilisateur créé avec succès');
    } catch (error) {
      console.error('Failed to add user:', error);
      setError('Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateUser(editingUser.id, {
        username: userFormData.username,
        role: userFormData.role as 'admin' | 'cashier',
      });
      await loadData();
      setShowEditUserModal(false);
      setEditingUser(null);
      setUserFormData({ username: '', password: '', role: 'cashier' });
      setSuccess('Utilisateur modifié avec succès');
    } catch (error) {
      console.error('Failed to update user:', error);
      setError('Erreur lors de la modification de l\'utilisateur');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await deleteUser(userId);
        await loadData();
        setSuccess('Utilisateur supprimé avec succès');
      } catch (error) {
        console.error('Failed to delete user:', error);
        setError('Erreur lors de la suppression de l\'utilisateur');
      }
    }
  };

  const handleSaveCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCompanySettings(settingsFormData);
      await loadData();
      setSuccess('Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('Erreur lors de la sauvegarde des paramètres');
    }
  };

  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setUserFormData({ username: user.username, password: '', role: user.role });
    setShowEditUserModal(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Paramètres</h1>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Company Settings */}
      <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Paramètres de l'entreprise</h2>
        <form onSubmit={handleSaveCompanySettings} className="space-y-4">
          <Input
            label="Nom de l'entreprise"
            value={settingsFormData.name}
            onChange={(e) => setSettingsFormData({ ...settingsFormData, name: e.target.value })}
            required
          />
          <Input
            label="Adresse"
            value={settingsFormData.address}
            onChange={(e) => setSettingsFormData({ ...settingsFormData, address: e.target.value })}
          />
          <Input
            label="Téléphone"
            value={settingsFormData.phone}
            onChange={(e) => setSettingsFormData({ ...settingsFormData, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={settingsFormData.email}
            onChange={(e) => setSettingsFormData({ ...settingsFormData, email: e.target.value })}
          />
          <Select
            label="Devise"
            value={settingsFormData.currency}
            onChange={(e) => setSettingsFormData({ ...settingsFormData, currency: e.target.value })}
            options={[
              { value: '$', label: 'Dollar ($)' },
              { value: '€', label: 'Euro (€)' },
              { value: '£', label: 'Livre (£)' },
              { value: 'FC', label: 'Franc Congolais (FC)' },
            ]}
          />
          <Button type="submit">Sauvegarder les paramètres</Button>
        </form>
      </Card>

      {/* User Management */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Gestion des utilisateurs</h2>
          <Button onClick={() => setShowAddUserModal(true)}>+ Ajouter un utilisateur</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom d'utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de création</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {u.role === 'admin' ? 'Administrateur' : 'Caissière'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => openEditUserModal(u)}>
                        ✏️
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDeleteUser(u.id)}>
                        🗑️
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Ajouter un utilisateur</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <Input
                label="Nom d'utilisateur"
                value={userFormData.username}
                onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                required
              />
              <Input
                label="Mot de passe"
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                required
              />
              <Select
                label="Rôle"
                value={userFormData.role}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                options={[
                  { value: 'admin', label: 'Administrateur' },
                  { value: 'cashier', label: 'Caissière' },
                ]}
              />
              <div className="flex space-x-4">
                <Button type="submit">Ajouter</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setUserFormData({ username: '', password: '', role: 'cashier' });
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Modifier l'utilisateur</h2>
            <form onSubmit={handleEditUser} className="space-y-4">
              <Input
                label="Nom d'utilisateur"
                value={userFormData.username}
                onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                required
              />
              <Select
                label="Rôle"
                value={userFormData.role}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                options={[
                  { value: 'admin', label: 'Administrateur' },
                  { value: 'cashier', label: 'Caissière' },
                ]}
              />
              <div className="flex space-x-4">
                <Button type="submit">Modifier</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowEditUserModal(false);
                    setEditingUser(null);
                    setUserFormData({ username: '', password: '', role: 'cashier' });
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Clear Operational Data */}
      <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Gestion des données d'exploitation</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">
            <strong>Attention :</strong> Cette action va supprimer toutes les données d'exploitation pour économiser l'espace de stockage Firebase.
          </p>
          <ul className="list-disc list-inside mt-2 text-red-700">
            <li>Toutes les sorties d'argent</li>
            <li>Toutes les entrées de caisse</li>
            <li>Tous les journaux d'audit</li>
            <li>Le solde de caisse sera réinitialisé à 0</li>
          </ul>
          <p className="mt-2 text-red-600">
            Les données conservées : utilisateurs, catégories, paramètres entreprise
          </p>
        </div>
        <Button onClick={handleClearOperationalData} variant="danger">
          🗑️ Supprimer toutes les données d'exploitation
        </Button>
      </Card>
    </div>
  );
}
