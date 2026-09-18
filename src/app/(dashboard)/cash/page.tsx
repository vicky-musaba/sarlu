'use client';

import React, { useEffect, useState } from 'react';
import { getCashBalance, getAllCashEntries, createCashEntry, setInitialBalance } from '@/lib/firestore';
import { CashBalance, CashEntry } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function CashPage() {
  const { isAdmin } = useAuth();
  const [balance, setBalance] = useState<CashBalance | null>(null);
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [showSetBalanceModal, setShowSetBalanceModal] = useState(false);
  const [entryFormData, setEntryFormData] = useState({ amount: '', description: '' });
  const [balanceFormData, setBalanceFormData] = useState({ amount: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [balanceData, entriesData] = await Promise.all([
        getCashBalance(),
        getAllCashEntries(),
      ]);
      setBalance(balanceData);
      setEntries(entriesData);
    } catch (error) {
      console.error('Failed to load cash data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCashEntry({
        date: new Date().toISOString().split('T')[0],
        amount: parseFloat(entryFormData.amount),
        description: entryFormData.description,
        created_by: 'current_user', // TODO: Get from auth
        created_at: new Date().toISOString(),
      });
      await loadData();
      setShowAddEntryModal(false);
      setEntryFormData({ amount: '', description: '' });
    } catch (error) {
      console.error('Failed to add entry:', error);
      alert('Erreur lors de l\'ajout');
    }
  };

  const handleSetBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirm('Cette action va réinitialiser le solde actuel. Continuer ?')) {
      try {
        await setInitialBalance(parseFloat(balanceFormData.amount));
        await loadData();
        setShowSetBalanceModal(false);
        setBalanceFormData({ amount: '' });
      } catch (error) {
        console.error('Failed to set balance:', error);
        alert('Erreur lors de la modification');
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Caisse</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Solde initial</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(balance?.initial_balance || 0)}</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Solde actuel</p>
              <p className={`text-2xl font-bold ${balance?.current_balance && balance.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(balance?.current_balance || 0)}
              </p>
            </div>
            <div className="text-3xl">💵</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total entrées</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(balance?.total_entries || 0)}</p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total sorties</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(balance?.total_outputs || 0)}</p>
            </div>
            <div className="text-3xl">📉</div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex space-x-4">
        {isAdmin && (
          <Button onClick={() => setShowAddEntryModal(true)}>+ Ajouter une entrée</Button>
        )}
        {isAdmin && (
          <Button variant="secondary" onClick={() => setShowSetBalanceModal(true)}>
            Définir solde initial
          </Button>
        )}
      </div>

      {/* Entries Table */}
      <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Historique des entrées</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créé par</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.length > 0 ? (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">{formatCurrency(entry.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.created_by}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    Aucune entrée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Entry Modal */}
      {showAddEntryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Ajouter une entrée de caisse</h2>
            <form onSubmit={handleAddEntry} className="space-y-4">
              <Input
                label="Montant"
                type="number"
                value={entryFormData.amount}
                onChange={(e) => setEntryFormData({ ...entryFormData, amount: e.target.value })}
                placeholder="Entrez le montant"
                required
                min="0"
                step="0.01"
              />
              <Input
                label="Description"
                value={entryFormData.description}
                onChange={(e) => setEntryFormData({ ...entryFormData, description: e.target.value })}
                placeholder="Description de l'entrée"
                required
              />
              <div className="flex space-x-4">
                <Button type="submit">Ajouter</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowAddEntryModal(false);
                    setEntryFormData({ amount: '', description: '' });
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Set Balance Modal */}
      {showSetBalanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Définir le solde initial</h2>
            <form onSubmit={handleSetBalance} className="space-y-4">
              <Input
                label="Solde initial"
                type="number"
                value={balanceFormData.amount}
                onChange={(e) => setBalanceFormData({ ...balanceFormData, amount: e.target.value })}
                placeholder="Entrez le solde initial"
                required
                min="0"
                step="0.01"
              />
              <div className="flex space-x-4">
                <Button type="submit">Définir</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowSetBalanceModal(false);
                    setBalanceFormData({ amount: '' });
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
