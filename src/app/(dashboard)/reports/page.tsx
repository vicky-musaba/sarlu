'use client';

import React, { useEffect, useState } from 'react';
import { getOutputsByDateRange, getCompanySettings } from '@/lib/firestore';
import { Output, ReportData, CompanySettings } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { formatCurrency as formatCurrencyUtil } from '@/utils/currency';

export default function ReportsPage() {
  const { isAdmin, isAuditor, isFinancialController } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (reportType !== 'custom') {
      setDatesForType(reportType);
    }
    loadCompanySettings();
  }, [reportType]);

  const setDatesForType = (type: string) => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (type) {
      case 'daily':
        start = new Date(now);
        end = new Date(now);
        break;
      case 'weekly':
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        end = new Date(now);
        break;
      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now);
        break;
      default:
        return;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const loadCompanySettings = async () => {
    try {
      const settings = await getCompanySettings();
      setCompanySettings(settings);
    } catch (error) {
      console.error('Failed to load company settings:', error);
    }
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      alert('Veuillez sélectionner les dates');
      return;
    }

    setLoading(true);
    try {
      const outputs = await getOutputsByDateRange(startDate, endDate);
      const total = outputs.reduce((sum, o) => sum + o.amount, 0);
      setReportData({
        outputs,
        total,
        count: outputs.length,
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Erreur lors de la génération du rapport');
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport de Sorties', pageWidth / 2, 20, { align: 'center' });

    // Date range
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Période: ${startDate} - ${endDate}`, 14, 30);

    // Summary
    doc.text(`Total des sorties: ${reportData.count}`, 14, 40);
    doc.text(`Montant total: ${formatCurrencyUtil(reportData.total, companySettings?.currency || '$')}`, 14, 50);

    // Table
    const tableData = reportData.outputs.map(output => [
      output.number,
      output.date,
      output.category_name,
      output.description,
      formatCurrencyUtil(output.amount, output.currency || '$'),
      output.currency || '$',
      output.responsible,
      output.payment_mode,
      output.created_by_username,
    ]);

    autoTable(doc, {
      head: [['N°', 'Date', 'Catégorie', 'Description', 'Montant', 'Devise', 'Responsable', 'Mode Paiement', 'Créé par']],
      body: tableData,
      startY: 60,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`rapport_sorties_${startDate}_${endDate}.pdf`);
  };

  const exportExcel = async () => {
    if (!reportData) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rapport');

    // Headers
    worksheet.columns = [
      { header: 'N°', key: 'number', width: 15 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Catégorie', key: 'category_name', width: 20 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Montant', key: 'amount', width: 15 },
      { header: 'Responsable', key: 'responsible', width: 20 },
      { header: 'Mode Paiement', key: 'payment_mode', width: 15 },
      { header: 'Créé par', key: 'created_by_username', width: 15 },
    ];

    // Data
    worksheet.addRows(reportData.outputs);

    // Total row
    const lastRow = worksheet.lastRow?.number || 0;
    worksheet.addRow(['', '', '', 'Total:', reportData.total, '', '', '']);

    // Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `rapport_sorties_${startDate}_${endDate}.xlsx`);
  };

  const formatCurrency = (amount: number, currency?: string) => {
    return formatCurrencyUtil(amount, currency || companySettings?.currency || '$');
  };

  if (!isAdmin && !isAuditor && !isFinancialController) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-600">Accès non autorisé. Cette page est réservée aux administrateurs, auditeurs et contrôleurs financiers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Rapports</h1>

      {/* Report Settings */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type de rapport</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
            >
              <option value="daily">Journalier</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
              <option value="custom">Personnalisé</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={reportType !== 'custom'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={reportType !== 'custom'}
            />
          </div>
        </div>

        <div className="mt-4">
          <Button onClick={generateReport} disabled={loading}>
            {loading ? 'Génération...' : 'Générer le rapport'}
          </Button>
        </div>
      </Card>

      {/* Report Results */}
      {reportData && (
        <>
          <Card>
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-gray-600">Nombre de sorties: {reportData.count}</p>
                <p className="text-2xl font-bold text-gray-800">Total: {formatCurrency(reportData.total)}</p>
              </div>
              <div className="flex space-x-4">
                <Button onClick={exportPDF}>📄 Export PDF</Button>
                <Button onClick={exportExcel} variant="secondary">📊 Export Excel</Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N°</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Devise</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode paiement</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créé par</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.outputs.map((output) => (
                    <tr key={output.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{output.number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{output.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{output.category_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{output.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(output.amount, output.currency)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{output.currency || '$'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{output.responsible}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{output.payment_mode}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{output.created_by_username}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
