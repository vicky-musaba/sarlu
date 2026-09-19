'use client';

import React, { useEffect, useState } from 'react';
import { getAllOutputs, getCashBalance, getCompanySettings } from '@/lib/firestore';
import { DashboardStats, CompanySettings, Output } from '@/types';
import { Card } from '@/components/ui/Card';
import { formatCurrency as formatCurrencyUtil } from '@/utils/currency';

interface StatsByCurrency {
  [currency: string]: {
    today_total: number;
    week_total: number;
    month_total: number;
    year_total: number;
    general_total: number;
    count: number;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [statsByCurrency, setStatsByCurrency] = useState<StatsByCurrency>({});
  const [outputsByCurrency, setOutputsByCurrency] = useState<Record<string, Output[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [outputs, balance, settings] = await Promise.all([
        getAllOutputs(),
        getCashBalance(),
        getCompanySettings(),
      ]);

      if (settings) {
        setCompanySettings(settings);
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split('T')[0];
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearStartStr = yearStart.toISOString().split('T')[0];

      const todayTotal = outputs
        .filter(o => o.date === today)
        .reduce((sum, o) => sum + o.amount, 0);

      const weekTotal = outputs
        .filter(o => o.date >= weekStartStr)
        .reduce((sum, o) => sum + o.amount, 0);

      const monthTotal = outputs
        .filter(o => o.date >= monthStartStr)
        .reduce((sum, o) => sum + o.amount, 0);

      const yearTotal = outputs
        .filter(o => o.date >= yearStartStr)
        .reduce((sum, o) => sum + o.amount, 0);

      const generalTotal = outputs.reduce((sum, o) => sum + o.amount, 0);

      // Calculate stats by currency
      const statsByCurrency: StatsByCurrency = {};
      outputs.forEach(o => {
        const currency = o.currency || '$';
        if (!statsByCurrency[currency]) {
          statsByCurrency[currency] = {
            today_total: 0,
            week_total: 0,
            month_total: 0,
            year_total: 0,
            general_total: 0,
            count: 0,
          };
        }

        if (o.date === today) {
          statsByCurrency[currency].today_total += o.amount;
        }
        if (o.date >= weekStartStr) {
          statsByCurrency[currency].week_total += o.amount;
        }
        if (o.date >= monthStartStr) {
          statsByCurrency[currency].month_total += o.amount;
        }
        if (o.date >= yearStartStr) {
          statsByCurrency[currency].year_total += o.amount;
        }
        statsByCurrency[currency].general_total += o.amount;
        statsByCurrency[currency].count += 1;
      });

      // Initialize with default currencies (like cash page)
      const defaultCurrencies = ['$' , 'CDF'];
      defaultCurrencies.forEach(currency => {
        if (!statsByCurrency[currency]) {
          statsByCurrency[currency] = {
            today_total: 0,
            week_total: 0,
            month_total: 0,
            year_total: 0,
            general_total: 0,
            count: 0,
          };
        }
      });

      setStatsByCurrency(statsByCurrency);

      // Group outputs by currency for display
      const outputsByCurrencyData = outputs.reduce((acc, output) => {
        const currency = output.currency || '$';
        if (!acc[currency]) {
          acc[currency] = [];
        }
        acc[currency].push(output);
        return acc;
      }, {} as Record<string, Output[]>);

      // Initialize with default currencies (like cash page)
      defaultCurrencies.forEach(currency => {
        if (!outputsByCurrencyData[currency]) {
          outputsByCurrencyData[currency] = [];
        }
      });

      setOutputsByCurrency(outputsByCurrencyData);

      // Calculate category totals
      const categoryMap = new Map<string, { count: number; total: number }>();
      outputs.forEach(o => {
        const existing = categoryMap.get(o.category_name) || { count: 0, total: 0 };
        categoryMap.set(o.category_name, {
          count: existing.count + 1,
          total: existing.total + o.amount,
        });
      });

      const categories = Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        count: data.count,
        total: data.total,
      }));

      setStats({
        today_total: todayTotal,
        week_total: weekTotal,
        month_total: monthTotal,
        year_total: yearTotal,
        general_total: generalTotal,
        current_balance: balance?.current_balance || 0,
        output_count: outputs.length,
        categories,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrencyWithSettings = (amount: number, currency?: string) => {
    return formatCurrencyUtil(amount, currency || companySettings?.currency || '$');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Chargement...</div>;
  }

  if (!stats) {
    return <div className="text-red-600">Erreur lors du chargement des statistiques</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <img src="/logo.png" alt="LE SECOURS SARLU" className="h-12 w-auto" />
        <h1 className="text-3xl font-bold text-gray-800">Tableau de bord</h1>
      </div>

      {/* Stats Cards by Currency */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800">Statistiques par devise</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(statsByCurrency).map(([currency, currencyStats]) => (
            <div key={currency} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">{currency}</h3>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Aujourd'hui</p>
                      <p className="text-2xl font-bold text-gray-800">{formatCurrencyWithSettings(currencyStats.today_total, currency)}</p>
                    </div>
                    <div className="text-3xl">�</div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Cette semaine</p>
                      <p className="text-2xl font-bold text-gray-800">{formatCurrencyWithSettings(currencyStats.week_total, currency)}</p>
                    </div>
                    <div className="text-3xl">�</div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Ce mois</p>
                      <p className="text-2xl font-bold text-gray-800">{formatCurrencyWithSettings(currencyStats.month_total, currency)}</p>
                    </div>
                    <div className="text-3xl">�</div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Cette année</p>
                      <p className="text-2xl font-bold text-gray-800">{formatCurrencyWithSettings(currencyStats.year_total, currency)}</p>
                    </div>
                    <div className="text-3xl">�</div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total général</p>
                      <p className="text-2xl font-bold text-gray-800">{formatCurrencyWithSettings(currencyStats.general_total, currency)}</p>
                    </div>
                    <div className="text-3xl">�</div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Nombre de sorties</p>
                      <p className="text-2xl font-bold text-gray-800">{currencyStats.count}</p>
                    </div>
                    <div className="text-3xl">📋</div>
                  </div>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats by Currency */}
      <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Statistiques par devise</h2>
        {Object.keys(statsByCurrency).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(statsByCurrency).map(([currency, currencyStats]) => (
              <div key={currency} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{currency}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aujourd'hui:</span>
                    <span className="font-medium">{formatCurrencyWithSettings(currencyStats.today_total, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cette semaine:</span>
                    <span className="font-medium">{formatCurrencyWithSettings(currencyStats.week_total, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ce mois:</span>
                    <span className="font-medium">{formatCurrencyWithSettings(currencyStats.month_total, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cette année:</span>
                    <span className="font-medium">{formatCurrencyWithSettings(currencyStats.year_total, currency)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-gray-600 font-medium">Total général:</span>
                    <span className="font-bold">{formatCurrencyWithSettings(currencyStats.general_total, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nombre de sorties:</span>
                    <span className="font-medium">{currencyStats.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Aucune donnée disponible</p>
        )}
      </Card>

      {/* Recent Outputs by Currency */}
      <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Sorties récentes par devise</h2>
        {Object.keys(outputsByCurrency).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(outputsByCurrency).map(([currency, currencyOutputs]) => (
              <div key={currency} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {currency} ({currencyOutputs.length} sortie{currencyOutputs.length > 1 ? 's' : ''})
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">N°</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currencyOutputs.slice(0, 5).map((output) => (
                        <tr key={output.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{output.number}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{output.date}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{output.category_name}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{output.description}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-gray-900">
                            {formatCurrencyWithSettings(output.amount, output.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {currencyOutputs.length > 5 && (
                  <p className="text-sm text-gray-500 mt-2">... et {currencyOutputs.length - 5} autre(s) sortie(s)</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Aucune sortie disponible</p>
        )}
      </Card>

      {/* Categories Table */}
      <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Catégories les plus utilisées</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.categories.length > 0 ? (
                stats.categories.map((cat, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cat.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cat.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrencyWithSettings(cat.total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                    Aucune donnée disponible
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
