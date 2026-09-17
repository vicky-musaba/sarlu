'use client';

import React, { useEffect, useState } from 'react';
import { getAllOutputs, getCashBalance } from '@/lib/firestore';
import { DashboardStats } from '@/types';
import { Card } from '@/components/ui/Card';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [outputs, balance] = await Promise.all([
        getAllOutputs(),
        getCashBalance(),
      ]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(amount);
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.today_total)}</p>
            </div>
            <div className="text-3xl">📅</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Cette semaine</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.week_total)}</p>
            </div>
            <div className="text-3xl">📆</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Ce mois</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.month_total)}</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Cette année</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.year_total)}</p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total général</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.general_total)}</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Solde actuel</p>
              <p className={`text-2xl font-bold ${stats.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.current_balance)}
              </p>
            </div>
            <div className="text-3xl">💵</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Nombre de sorties</p>
              <p className="text-2xl font-bold text-gray-800">{stats.output_count}</p>
            </div>
            <div className="text-3xl">📋</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Moyenne par sortie</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats.output_count > 0 ? formatCurrency(stats.general_total / stats.output_count) : formatCurrency(0)}
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </Card>
      </div>

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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(cat.total)}</td>
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
