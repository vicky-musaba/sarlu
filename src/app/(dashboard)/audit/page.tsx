'use client';

import React, { useEffect, useState } from 'react';
import { getAllAuditLogs, getAuditLogsByDate, deleteAuditLogsByDate } from '@/lib/firestore';
import { AuditLog } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [filterMode, setFilterMode] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await getAllAuditLogs();
      setLogs(data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogsByDate = async (date: string) => {
    try {
      const data = await getAuditLogsByDate(date);
      setLogs(data);
    } catch (error) {
      console.error('Failed to load audit logs by date:', error);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (date) {
      setFilterMode(true);
      loadLogsByDate(date);
    } else {
      setFilterMode(false);
      loadLogs();
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const dateToUse = selectedDate || new Date().toISOString().split('T')[0];
    const title = `Rapport d'Audit - ${dateToUse}`;

    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 30);

    const tableData = logs.map(log => [
      log.date,
      log.time,
      log.username,
      log.role,
      log.action,
      log.element,
      log.output_number || '-',
      log.old_value || '-',
      log.new_value || '-'
    ]);

    autoTable(doc, {
      head: [['Date', 'Heure', 'Utilisateur', 'Rôle', 'Action', 'Élément', 'N° Sortie', 'Ancienne Valeur', 'Nouvelle Valeur']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`audit-report-${dateToUse}.pdf`);
  };

  const deleteLogsByDate = async () => {
    if (!selectedDate) {
      alert('Veuillez sélectionner une date');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer tous les logs d'audit du ${selectedDate} ? Cette action est irréversible.`)) {
      try {
        await deleteAuditLogsByDate(selectedDate);
        setLogs([]);
        alert('Logs supprimés avec succès');
      } catch (error) {
        console.error('Failed to delete audit logs:', error);
        alert('Erreur lors de la suppression des logs');
      }
    }
  };

  const resetFilter = () => {
    setSelectedDate('');
    setFilterMode(false);
    loadLogs();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Connexion':
      case 'Déconnexion':
        return 'text-blue-600';
      case 'Création':
      case 'Ajout':
        return 'text-green-600';
      case 'Modification':
        return 'text-yellow-600';
      case 'Suppression':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Journal d'audit</h1>
        <div className="flex space-x-2">
          <Button onClick={generatePDF} disabled={logs.length === 0}>
            📄 Générer PDF
          </Button>
          {filterMode && (
            <Button onClick={deleteLogsByDate} variant="danger">
              🗑️ Supprimer logs du jour
            </Button>
          )}
        </div>
      </div>

      {/* Date Filter */}
      <Card>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              label="Filtrer par date"
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
            />
          </div>
          {filterMode && (
            <Button onClick={resetFilter} variant="secondary">
              Réinitialiser
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heure</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Élément</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Sortie</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ancienne Valeur</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nouvelle Valeur</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{log.date}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{log.time}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.username}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{log.role}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={getActionColor(log.action)}>{log.action}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{log.element}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{log.output_number || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{log.old_value || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{log.new_value || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-4 text-center text-sm text-gray-500">
                    Aucun log d'audit
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
