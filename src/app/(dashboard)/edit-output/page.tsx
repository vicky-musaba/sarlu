'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { updateOutput, getAllCategories, getOutputById, getCompanySettings } from '@/lib/firestore';
import { Output, CompanySettings } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { formatCurrency as formatCurrencyUtil } from '@/utils/currency';

function EditOutputContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);
  const [output, setOutput] = useState<Output | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    description: '',
    currency: '$',
    responsible: '',
    payment_mode: 'especes',
    reference: '',
    observation: '',
  });

  useEffect(() => {
    const outputId = searchParams.get('id');
    if (outputId) {
      loadOutput(outputId);
    }
    loadCategories();
    loadCompanySettings();
  }, [searchParams]);

  const loadOutput = async (id: string) => {
    try {
      const outputData = await getOutputById(id);
      if (outputData) {
        setOutput(outputData);
        setFormData({
          category_id: outputData.category_id,
          amount: outputData.amount.toString(),
          description: outputData.description,
          currency: outputData.currency || '$',
          responsible: outputData.responsible,
          payment_mode: outputData.payment_mode,
          reference: outputData.reference,
          observation: outputData.observation,
        });
      }
    } catch (error) {
      console.error('Failed to load output:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await getAllCategories();
      setCategories(cats.map(c => ({ value: c.id, label: c.name })));
    } catch (error) {
      console.error('Failed to load categories:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!output) return;

    setLoading(true);
    try {
      const category = categories.find(c => c.value === formData.category_id);
      const oldAmount = output.amount;
      const newAmount = parseFloat(formData.amount);

      await updateOutput(output.id, {
        category_id: formData.category_id,
        category_name: category?.label || '',
        description: formData.description,
        amount: newAmount,
        currency: formData.currency,
        responsible: formData.responsible,
        payment_mode: formData.payment_mode,
        reference: formData.reference,
        observation: formData.observation,
      });

      // Adjust cash balance if amount changed
      if (oldAmount !== newAmount) {
        // TODO: Implement balance adjustment in updateOutput
        console.log('Balance adjustment needed:', newAmount - oldAmount);
      }

      router.push('/history');
    } catch (error) {
      console.error('Failed to update output:', error);
      alert('Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  const formatPreviewAmount = () => {
    if (!formData.amount) return '';
    const amount = parseFloat(formData.amount);
    if (isNaN(amount)) return '';
    return formatCurrencyUtil(amount, formData.currency);
  };

  if (!output) {
    return (
      <div className="text-center">
        <p className="text-red-600 mb-4">Aucune sortie à modifier</p>
        <Button onClick={() => router.push('/history')}>Retour à l'historique</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Modifier la Sortie</h1>
        <Button onClick={() => router.push('/history')}>Retour</Button>
      </div>

      <Card>
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Créé par :</strong> {output.created_by_username}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Date de création :</strong> {new Date(output.created_at).toLocaleString('fr-FR')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Select
            label="Catégorie"
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            options={categories}
            required
          />

          <Input
            label="Montant"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="Entrez le montant"
            required
            min="0"
            step="0.01"
          />

          <Select
            label="Devise"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            options={[
              { value: '$', label: 'Dollar ($)' },
              { value: 'CDF', label: 'Franc Congolais (CDF)' },
            ]}
            required
          />

          {/* Aperçu du montant */}
          {formData.amount && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Aperçu du montant :</strong> {formatPreviewAmount()}
              </p>
            </div>
          )}

          <Input
            label="Description / Motif"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Entrez la description"
            required
          />

          <Input
            label="Responsable"
            value={formData.responsible}
            onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
            placeholder="Entrez le responsable"
            required
          />

          <Select
            label="Mode de paiement"
            value={formData.payment_mode}
            onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
            options={[
              { value: 'especes', label: 'Espèces' },
              { value: 'cheque', label: 'Chèque' },
              { value: 'virement', label: 'Virement' },
              { value: 'carte', label: 'Carte bancaire' },
              { value: 'autre', label: 'Autre' },
            ]}
            required
          />

          <Input
            label="Référence (optionnel)"
            value={formData.reference}
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            placeholder="Numéro de référence"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observation (optionnel)
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.observation}
              onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
              placeholder="Observations supplémentaires"
              rows={3}
            />
          </div>

          <div className="flex space-x-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Modification...' : 'Modifier la sortie'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/history')}
            >
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function EditOutputPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Chargement...</div>}>
      <EditOutputContent />
    </Suspense>
  );
}
