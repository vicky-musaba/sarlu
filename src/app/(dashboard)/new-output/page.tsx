'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createOutput, getAllCategories, getCompanySettings } from '@/lib/firestore';
import { CompanySettings } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatCurrency as formatCurrencyUtil } from '@/utils/currency';

export default function NewOutputPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);
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

  React.useEffect(() => {
    loadCategories();
    loadCompanySettings();
  }, []);

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
      if (settings) {
        setFormData(prev => ({ ...prev, currency: settings.currency }));
      }
    } catch (error) {
      console.error('Failed to load company settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const category = categories.find(c => c.value === formData.category_id);
      await createOutput({
        date: new Date().toISOString().split('T')[0],
        category_id: formData.category_id,
        category_name: category?.label || '',
        description: formData.description,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        responsible: formData.responsible,
        payment_mode: formData.payment_mode,
        reference: formData.reference,
        observation: formData.observation,
        created_by: user?.id || '',
        created_by_username: user?.username || '',
        created_at: new Date().toISOString(),
      });
      router.push('/history');
    } catch (error) {
      console.error('Failed to create output:', error);
      alert('Erreur lors de la création de la sortie');
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Nouvelle Sortie</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              placeholder="Montant"
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
              <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Aperçu du montant :</strong> {formatPreviewAmount()}
                </p>
              </div>
            )}

            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Motif"
              required
            />

            <Input
              label="Responsable"
              value={formData.responsible}
              onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
              placeholder="Responsable"
              required
            />

            <Select
              label="Mode paiement"
              value={formData.payment_mode}
              onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
              options={[
                { value: 'especes', label: 'Espèces' },
                { value: 'cheque', label: 'Chèque' },
                { value: 'virement', label: 'Virement' },
                { value: 'carte', label: 'Carte' },
                { value: 'autre', label: 'Autre' },
              ]}
              required
            />

            <Input
              label="Référence"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="Référence (optionnel)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observation (optionnel)
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.observation}
              onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
              placeholder="Observations"
              rows={2}
            />
          </div>

          <div className="flex space-x-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer'}
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
