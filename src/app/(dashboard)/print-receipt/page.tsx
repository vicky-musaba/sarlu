'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCompanySettings, getOutputById } from '@/lib/firestore';
import { Output, CompanySettings } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import jsPDF from 'jspdf';
import { formatCurrency as formatCurrencyUtil } from '@/utils/currency';

function PrintReceiptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [output, setOutput] = useState<Output | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [paperSize, setPaperSize] = useState<'58mm' | '80mm' | 'A4'>('80mm');

  useEffect(() => {
    const outputId = searchParams.get('id');
    if (outputId) {
      loadOutput(outputId);
    }
    loadCompanySettings();
  }, [searchParams]);

  const loadOutput = async (id: string) => {
    try {
      const outputData = await getOutputById(id);
      setOutput(outputData);
    } catch (error) {
      console.error('Failed to load output:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanySettings = async () => {
    try {
      const data = await getCompanySettings();
      setCompanySettings(data);
    } catch (error) {
      console.error('Failed to load company settings:', error);
    }
  };

  const handlePrint = async () => {
    if (!output || !companySettings) return;

    const doc = new jsPDF();

    let pageWidth, fontSize, lineHeight;

    switch (paperSize) {
      case '58mm':
        pageWidth = 58;
        fontSize = 8;
        lineHeight = 4;
        break;
      case '80mm':
        pageWidth = 80;
        fontSize = 10;
        lineHeight = 5;
        break;
      case 'A4':
        pageWidth = 210;
        fontSize = 12;
        lineHeight = 7;
        break;
    }

    doc.setPage(1);

    let y = 10;

    // Company header
    doc.setFontSize(fontSize + 4);
    doc.setFont('helvetica', 'bold');
    doc.text(companySettings.name, pageWidth / 2, y, { align: 'center' });
    y += lineHeight;

    if (companySettings.address) {
      doc.setFontSize(fontSize - 1);
      doc.setFont('helvetica', 'normal');
      doc.text(companySettings.address, pageWidth / 2, y, { align: 'center' });
      y += lineHeight;
    }

    if (companySettings.phone) {
      doc.text(`Tel: ${companySettings.phone}`, pageWidth / 2, y, { align: 'center' });
      y += lineHeight;
    }

    y += lineHeight;

    // Divider
    doc.setLineWidth(0.1);
    doc.line(5, y, pageWidth - 5, y);
    y += lineHeight;

    // Receipt title
    doc.setFontSize(fontSize + 2);
    doc.setFont('helvetica', 'bold');
    doc.text('BON DE SORTIE', pageWidth / 2, y, { align: 'center' });
    y += lineHeight + 2;

    // Receipt details
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    doc.text(`N°: ${output.number}`, 5, y);
    y += lineHeight;
    doc.text(`Date: ${output.date}`, 5, y);
    y += lineHeight;
    doc.text(`Catégorie: ${output.category_name}`, 5, y);
    y += lineHeight;

    y += lineHeight;

    // Amount
    doc.setFontSize(fontSize + 4);
    doc.setFont('helvetica', 'bold');
    const formattedAmount = formatCurrencyUtil(output.amount, companySettings.currency);
    doc.text(formattedAmount, pageWidth / 2, y, { align: 'center' });
    y += lineHeight + 2;

    y += lineHeight;

    // Details
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    doc.text(`Motif: ${output.description}`, 5, y);
    y += lineHeight;
    doc.text(`Responsable: ${output.responsible}`, 5, y);
    y += lineHeight;
    doc.text(`Mode paiement: ${output.payment_mode}`, 5, y);
    y += lineHeight;

    if (output.reference) {
      doc.text(`Référence: ${output.reference}`, 5, y);
      y += lineHeight;
    }

    if (output.observation) {
      doc.text(`Observation: ${output.observation}`, 5, y);
      y += lineHeight;
    }

    y += lineHeight;

    // Divider
    doc.line(5, y, pageWidth - 5, y);
    y += lineHeight;

    // Created by
    doc.setFontSize(fontSize - 1);
    doc.text(`Créé par: ${output.created_by_username}`, 5, y);
    y += lineHeight;

    y += lineHeight;

    // Signatures
    doc.text('Bénéficiaire: _______________', 5, y);
    y += lineHeight;
    doc.text('Caissière: _______________', 5, y);
    y += lineHeight;

    if (paperSize === 'A4') {
      doc.text('Administrateur: _______________', 5, y);
      y += lineHeight;
    }

    y += lineHeight;

    // Footer
    doc.setFontSize(fontSize - 1);
    doc.text('Merci pour votre confiance!', pageWidth / 2, y, { align: 'center' });

    doc.save(`bon_sortie_${output.number}.pdf`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number, currency?: string) => {
    return formatCurrencyUtil(amount, currency || companySettings?.currency || '$');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Chargement...</div>;
  }

  if (!output) {
    return (
      <div className="text-center">
        <p className="text-red-600 mb-4">Aucune sortie à imprimer</p>
        <Button onClick={() => router.push('/history')}>Retour à l'historique</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Bon de Sortie</h1>
        <Button onClick={() => router.push('/history')}>Retour</Button>
      </div>

      <Card>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Taille du papier</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={paperSize}
            onChange={(e) => setPaperSize(e.target.value as any)}
          >
            <option value="58mm">58mm</option>
            <option value="80mm">80mm</option>
            <option value="A4">A4</option>
          </select>
        </div>

        {/* Receipt Preview */}
        <div className="border-2 border-gray-300 p-6 max-w-md mx-auto">
          {companySettings && (
            <div className="text-center mb-4">
              <img src="/logo.png" alt="Logo" className="mx-auto h-16 w-auto mb-2" />
              <h2 className="text-xl font-bold">{companySettings.name}</h2>
              {companySettings.address && <p className="text-sm text-gray-600">{companySettings.address}</p>}
              {companySettings.phone && <p className="text-sm text-gray-600">Tel: {companySettings.phone}</p>}
            </div>
          )}

          <div className="border-t border-b border-gray-300 py-4 my-4">
            <h3 className="text-center font-bold mb-4">BON DE SORTIE</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>N°:</span>
                <span className="font-medium">{output.number}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-medium">{formatDate(output.date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Catégorie:</span>
                <span className="font-medium">{output.category_name}</span>
              </div>
            </div>
          </div>

          <div className="text-center my-4">
            <p className="text-2xl font-bold">{formatCurrency(output.amount, output.currency)}</p>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Motif:</span> {output.description}
            </div>
            <div>
              <span className="font-medium">Responsable:</span> {output.responsible}
            </div>
            <div>
              <span className="font-medium">Mode paiement:</span> {output.payment_mode}
            </div>
            {output.reference && (
              <div>
                <span className="font-medium">Référence:</span> {output.reference}
              </div>
            )}
            {output.observation && (
              <div>
                <span className="font-medium">Observation:</span> {output.observation}
              </div>
            )}
          </div>

          <div className="border-t border-gray-300 pt-4 mt-4 text-sm">
            <p>Créé par: {output.created_by_username}</p>
          </div>
        </div>
      </Card>

      <div className="flex justify-center">
        <Button onClick={() => handlePrint()}>🖨️ Imprimer le bon</Button>
      </div>
    </div>
  );
}

export default function PrintReceiptPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Chargement...</div>}>
      <PrintReceiptContent />
    </Suspense>
  );
}
