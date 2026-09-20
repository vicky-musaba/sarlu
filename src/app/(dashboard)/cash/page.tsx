'use client';

import React, { useEffect, useState } from 'react';
import { getCashBalance, getAllCashEntries, createCashEntry, setInitialBalance, getCompanySettings, getAllOutputs } from '@/lib/firestore';
import { CashBalance, CashEntry, CompanySettings, Output } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { formatCurrency as formatCurrencyUtil } from '@/utils/currency';

export default function CashPage() {
  const { isAdmin } = useAuth();
  const [balance, setBalance] = useState<CashBalance | null>(null);
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [showSetBalanceModal, setShowSetBalanceModal] = useState(false);
  const [entryFormData, setEntryFormData] = useState({ amount: '', description: '', currency: '$' });
  const [balanceFormData, setBalanceFormData] = useState({ amount: '' });

  useEffect(() => {
    loadData();
    loadCompanySettings();
  }, []);

  const loadData = async () => {
    try {
      const [balanceData, entriesData, outputsData] = await Promise.all([
        getCashBalance(),
        getAllCashEntries(),
        getAllOutputs(),
      ]);
      setBalance(balanceData);
      setEntries(entriesData);
      setOutputs(outputsData);
    } catch (error) {
      console.error('Failed to load cash data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanySettings = async () => {
    try {
      const settings = await getCompanySettings();
      setCompanySettings(settings);
    } catch (error) {
      console.error('Failed to load company settings:', error);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCashEntry({
        date: new Date().toISOString().split('T')[0],
        amount: parseFloat(entryFormData.amount),
        currency: entryFormData.currency,
        description: entryFormData.description,
        created_by: 'current_user', // TODO: Get from auth
        created_at: new Date().toISOString(),
      });
      await loadData();
      setShowAddEntryModal(false);
      setEntryFormData({ amount: '', description: '', currency: '$' });
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

  const formatCurrency = (amount: number, currency?: string) => {
    return formatCurrencyUtil(amount, currency || companySettings?.currency || '$');
  };

  const formatPreviewAmount = () => {
    if (!entryFormData.amount) return '';
    const amount = parseFloat(entryFormData.amount);
    if (isNaN(amount)) return '';
    return formatCurrencyUtil(amount, entryFormData.currency || '$');
  };

  const calculateBalancesByCurrency = () => {
    const balances: Record<string, {
      initial_balance: number;
      current_balance: number;
      total_entries: number;
      total_outputs: number;
    }> = {};

    // Calculate from entries
    entries.forEach(entry => {
      const currency = entry.currency || '$';
      if (!balances[currency]) {
        balances[currency] = { initial_balance: 0, current_balance: 0, total_entries: 0, total_outputs: 0 };
      }
      balances[currency].total_entries += entry.amount;
      balances[currency].current_balance += entry.amount;
    });

    // Calculate from outputs (only approved ones)
    const approvedOutputs = outputs.filter(o => o.status === 'approved');
    approvedOutputs.forEach(output => {
      const currency = output.currency || '$';
      if (!balances[currency]) {
        balances[currency] = { initial_balance: 0, current_balance: 0, total_entries: 0, total_outputs: 0 };
      }
      balances[currency].total_outputs += output.amount;
      balances[currency].current_balance -= output.amount;
    });

    // Set initial balance from total data
    if (balance) {
      Object.keys(balances).forEach(currency => {
        const totalInitial = balance.initial_balance;
        const totalCurrent = balance.current_balance;
        const ratio = balances[currency].current_balance / (totalCurrent || 1);
        balances[currency].initial_balance = totalInitial * ratio;
      });
    }

    return balances;
  };

  const balancesByCurrency = calculateBalancesByCurrency();

  if (loading) {
    return <div className="flex items-center justify-center h-full">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Caisse</h1>

      {/* Balance Cards by Currency */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800">Soldes par devise</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(balancesByCurrency)
            .filter(([_, currencyBalance]) => currencyBalance.total_entries > 0 || currencyBalance.total_outputs > 0)
            .map(([currency, currencyBalance]) => (
            <div key={currency} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">{currency}</h3>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Solde initial</p>
                      <p className="text-2xl font-bold text-gray-800">{formatCurrency(currencyBalance.initial_balance, currency)}</p>
                    </div>
                    <div className="text-3xl">💰</div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Solde actuel</p>
                      <p className={`text-2xl font-bold ${currencyBalance.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(currencyBalance.current_balance, currency)}
                      </p>
                    </div>
                    <div className="text-3xl">💵</div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total entrées</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(currencyBalance.total_entries, currency)}</p>
                    </div>
                    <div className="text-3xl">📈</div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total sorties</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(currencyBalance.total_outputs, currency)}</p>
                    </div>
                    <div className="text-3xl">📉</div>
                  </div>
                </Card>
              </div>
            </div>
          ))}
        </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Devise</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créé par</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.length > 0 ? (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">{formatCurrency(entry.amount, entry.currency || '$')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.currency || '$'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.created_by}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
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
              <Select
                label="Devise"
                value={entryFormData.currency}
                onChange={(e) => setEntryFormData({ ...entryFormData, currency: e.target.value })}
                options={[
                  { value: '$', label: 'Dollar ($)' },
                  { value: 'CDF', label: 'Franc Congolais (CDF)' },
                ]}
                required
              />

              {/* Aperçu du montant */}
              {entryFormData.amount && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Aperçu du montant :</strong> {formatPreviewAmount()}
                  </p>
                </div>
              )}

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
                    setEntryFormData({ amount: '', description: '', currency: '$' });
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
