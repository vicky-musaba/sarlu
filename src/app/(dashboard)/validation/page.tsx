'use client';

import React, { useEffect, useState } from 'react';
import { getPendingOutputs, approveOutput, rejectOutput, getCompanySettings } from '@/lib/firestore';
import { Output, CompanySettings } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatCurrency as formatCurrencyUtil } from '@/utils/currency';

export default function ValidationPage() {
  const { user, isSupervisor, isAuditor, isAdmin } = useAuth();
  const canApproveReject = isSupervisor || isAdmin;
  const [pendingOutputs, setPendingOutputs] = useState<Output[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOutput, setSelectedOutput] = useState<Output | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadPendingOutputs();
    loadCompanySettings();
  }, []);

  const loadPendingOutputs = async () => {
    try {
      const outputs = await getPendingOutputs();
      setPendingOutputs(outputs);
    } catch (error) {
      console.error('Failed to load pending outputs:', error);
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

  const handleApprove = async (outputId: string) => {
    if (!user) return;
    try {
      await approveOutput(outputId, user.id, user.username);
      await loadPendingOutputs();
    } catch (error) {
      console.error('Failed to approve output:', error);
      alert('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async () => {
    if (!user || !selectedOutput) return;
    try {
      await rejectOutput(selectedOutput.id, user.id, user.username, rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedOutput(null);
      await loadPendingOutputs();
    } catch (error) {
      console.error('Failed to reject output:', error);
      alert('Erreur lors du rejet');
    }
  };

  const openRejectModal = (output: Output) => {
    setSelectedOutput(output);
    setShowRejectModal(true);
  };

  const formatCurrency = (amount: number, currency?: string) => {
    return formatCurrencyUtil(amount, currency || companySettings?.currency || '$');
  };

  if (!isSupervisor && !isAuditor && !isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-600">Accès non autorisé. Cette page est réservée aux superviseurs, auditeurs et administrateurs.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Validation des Sorties</h1>

      <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Sorties en attente ({pendingOutputs.length})
        </h2>

        {pendingOutputs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune sortie en attente de validation</p>
        ) : (
          <div className="space-y-4">
            {pendingOutputs.map((output) => (
              <div key={output.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="font-bold text-lg">{output.number}</span>
                      <span className="text-yellow-600 font-medium">En attente</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Date:</span> {output.date}
                      </div>
                      <div>
                        <span className="text-gray-500">Montant:</span>{' '}
                        <span className="font-bold text-green-600">{formatCurrency(output.amount, output.currency)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Devise:</span> {output.currency || '$'}
                      </div>
                      <div>
                        <span className="text-gray-500">Catégorie:</span> {output.category_name}
                      </div>
                      <div>
                        <span className="text-gray-500">Responsable:</span> {output.responsible}
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Description:</span> {output.description}
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Créé par:</span> {output.created_by_username}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    {canApproveReject && (
                      <>
                        <Button
                          onClick={() => handleApprove(output.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          ✓ Approuver
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => openRejectModal(output)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          ✗ Rejeter
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Reject Modal */}
      {showRejectModal && selectedOutput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Rejeter la sortie</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Sortie: {selectedOutput.number} - {formatCurrency(selectedOutput.amount, selectedOutput.currency)}
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif du rejet
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Expliquez pourquoi cette sortie est rejetée"
                rows={3}
                required
              />
            </div>
            <div className="flex space-x-4">
              <Button onClick={handleReject} className="bg-red-600 hover:bg-red-700">
                Confirmer le rejet
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedOutput(null);
                }}
              >
                Annuler
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
