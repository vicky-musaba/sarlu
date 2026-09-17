'use client';

import React, { useState } from 'react';
import { getAllOutputs, getAllCashEntries, getCashBalance, getAllCategories, getAllUsers, getCompanySettings } from '@/lib/firestore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const createBackup = async () => {
    setLoading(true);
    try {
      const [outputs, cashEntries, balance, categories, users, settings] = await Promise.all([
        getAllOutputs(),
        getAllCashEntries(),
        getCashBalance(),
        getAllCategories(),
        getAllUsers(),
        getCompanySettings(),
      ]);

      const backup = {
        version: '1.0',
        date: new Date().toISOString(),
        data: {
          outputs,
          cashEntries,
          balance,
          categories,
          users,
          settings,
        },
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_lesecours_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setLastBackup(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error('Failed to create backup:', error);
      alert('Erreur lors de la création de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (confirm('Attention : Cette action va remplacer toutes les données actuelles. Continuer ?')) {
      setLoading(true);
      try {
        const text = await file.text();
        const backup = JSON.parse(text);

        // TODO: Implement restore logic
        // This would require write operations to Firestore
        alert('La restauration n\'est pas encore implémentée. Contactez le développeur.');
      } catch (error) {
        console.error('Failed to restore backup:', error);
        alert('Erreur lors de la restauration');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Sauvegardes</h1>

      <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Créer une sauvegarde</h2>
        <p className="text-gray-600 mb-4">
          Exportez toutes les données de l'application dans un fichier JSON.
        </p>
        <Button onClick={createBackup} disabled={loading}>
          {loading ? 'Création...' : 'Créer une sauvegarde'}
        </Button>
        {lastBackup && (
          <p className="mt-4 text-sm text-gray-500">Dernière sauvegarde : {lastBackup}</p>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Restaurer une sauvegarde</h2>
        <p className="text-gray-600 mb-4">
          Importez un fichier de sauvegarde pour restaurer les données.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800">
            <strong>Attention :</strong> La restauration remplacera toutes les données actuelles.
          </p>
        </div>
        <input
          type="file"
          accept=".json"
          onChange={restoreBackup}
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Informations importantes</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Les sauvegardes contiennent toutes les données : sorties, caisse, utilisateurs, catégories, paramètres</li>
          <li>Conservez vos sauvegardes dans un endroit sûr</li>
          <li>Effectuez des sauvegardes régulières avant les modifications importantes</li>
          <li>La restauration nécessite une implémentation complète côté serveur</li>
        </ul>
      </Card>
    </div>
  );
}
