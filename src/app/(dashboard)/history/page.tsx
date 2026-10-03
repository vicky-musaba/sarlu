'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllOutputs, deleteOutput, getCompanySettings, logAuditAction } from '@/lib/firestore';
import { Output, CompanySettings } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { formatCurrency as formatCurrencyUtil } from '@/utils/currency';

export default function HistoryPage() {
  const router = useRouter();
  const { isAdmin, user, isFinancialController } = useAuth();
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [filteredOutputs, setFilteredOutputs] = useState<Output[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    paymentMode: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadOutputs();
    loadCompanySettings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [outputs, filters]);

  const loadOutputs = async () => {
    try {
      const data = await getAllOutputs();
      setOutputs(data);
    } catch (error) {
      console.error('Failed to load outputs:', error);
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

  const applyFilters = () => {
    let filtered = [...outputs];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.number.toLowerCase().includes(search) ||
          o.description.toLowerCase().includes(search) ||
          o.responsible.toLowerCase().includes(search)
      );
    }

    if (filters.category) {
      filtered = filtered.filter((o) => o.category_id === filters.category);
    }

    if (filters.paymentMode) {
      filtered = filtered.filter((o) => o.payment_mode === filters.paymentMode);
    }

    if (filters.startDate) {
      filtered = filtered.filter((o) => o.date >= filters.startDate);
    }

    if (filters.endDate) {
      filtered = filtered.filter((o) => o.date <= filters.endDate);
    }

    setFilteredOutputs(filtered);
  };

  const handleDelete = async (id: string, amount: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette sortie ?')) {
      try {
        const outputToDelete = outputs.find(o => o.id === id);
        await deleteOutput(id, amount);

        // Log de suppression de sortie
        if (user && outputToDelete) {
          try {
            await logAuditAction(
              user.id,
              user.username,
              user.role,
              'Suppression',
              'Sortie',
              outputToDelete.number,
              `${outputToDelete.amount} ${outputToDelete.currency}`,
              undefined
            );
          } catch (error) {
            console.error('Failed to log delete output action:', error);
          }
        }

        await loadOutputs();
      } catch (error) {
        console.error('Failed to delete output:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handlePrint = (output: Output) => {
    router.push(`/print-receipt?id=${output.id}`);
  };

  const handleEdit = (output: Output) => {
    router.push(`/edit-output?id=${output.id}`);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      paymentMode: '',
      startDate: '',
      endDate: '',
    });
  };

  const formatCurrency = (amount: number, currency?: string) => {
    return formatCurrencyUtil(amount, currency || companySettings?.currency || '$');
  };

  const paymentModeOptions = [
    { value: '', label: 'Tous' },
    { value: 'especes', label: 'Espèces' },
    { value: 'cheque', label: 'Chèque' },
    { value: 'virement', label: 'Virement' },
    { value: 'carte', label: 'Carte bancaire' },
    { value: 'autre', label: 'Autre' },
  ];

  // Calculate totals by currency
  const totalsByCurrency = filteredOutputs.reduce((acc, output) => {
    // Normalize FC to CDF
    const currency = output.currency === 'FC' ? 'CDF' : (output.currency || '$');
    if (!acc[currency]) {
      acc[currency] = 0;
    }
    acc[currency] += output.amount;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return <div className="flex items-center justify-center h-full">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Historique</h1>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Recherche"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="N°, description, responsable..."
          />

          <Input
            label="Date début"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />

          <Input
            label="Date fin"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />

          <Select
            label="Mode de paiement"
            value={filters.paymentMode}
            onChange={(e) => setFilters({ ...filters, paymentMode: e.target.value })}
            options={paymentModeOptions}
          />
        </div>

        <div className="flex space-x-4 mt-4">
          <Button onClick={resetFilters} variant="secondary">
            Réinitialiser les filtres
          </Button>
        </div>
      </Card>

      {/* Results Summary */}
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600">Résultats : {filteredOutputs.length} sortie(s)</p>
            <div className="space-y-1">
              {Object.entries(totalsByCurrency)
                .filter(([_, total]) => total > 0)
                .map(([currency, total]) => (
                <p key={currency} className="text-2xl font-bold text-gray-800">
                  Total : {formatCurrency(total, currency)}
                </p>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N°</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Devise</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode paiement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créé par</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOutputs.length > 0 ? (
                filteredOutputs.map((output) => (
                  <tr key={output.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{output.number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{output.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {output.status === 'pending' && <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">En attente</span>}
                      {output.status === 'approved' && <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Approuvé</span>}
                      {output.status === 'rejected' && <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Rejeté</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{output.category_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{output.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(output.amount, output.currency)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{output.currency || '$'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{output.responsible}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{output.payment_mode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{output.created_by_username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => handlePrint(output)}>
                          🖨️
                        </Button>
                        {isAdmin && (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => handleEdit(output)}>
                              ✏️
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(output.id, output.amount)}>
                              🗑️
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-6 py-4 text-center text-sm text-gray-500">
                    Aucune sortie trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
