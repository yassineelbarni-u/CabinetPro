import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Génère et télécharge une facture PDF pour un paiement donné.
 * @param {Object} payment - L'objet paiement complet
 * @param {Object} cabinet - Les infos du cabinet (nom, adresse, téléphone, email)
 */
export function generateInvoicePDF(payment, cabinet = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const BLUE = [37, 99, 235];
  const DARK = [17, 24, 39];
  const GRAY = [107, 114, 128];
  const LIGHT_GRAY = [243, 244, 246];
  const WHITE = [255, 255, 255];
  const GREEN = [16, 185, 129];

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;

  // ── HEADER BAND ─────────────────────────────────────────────────────────────
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, pageW, 42, 'F');

  // Cabinet name
  doc.setTextColor(...WHITE);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(cabinet.name || 'Cabinet Dentaire', margin, 18);

  // Cabinet sub-info
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const subLines = [];
  if (cabinet.address) subLines.push(cabinet.address + (cabinet.city ? ', ' + cabinet.city : ''));
  if (cabinet.phone) subLines.push('Tél : ' + cabinet.phone);
  if (cabinet.email) subLines.push(cabinet.email);
  doc.text(subLines.join('   |   '), margin, 27);

  // FACTURE badge on the right
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('REÇU', pageW - margin, 18, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${payment.id?.slice(0, 8).toUpperCase()}`, pageW - margin, 26, { align: 'right' });

  // ── SECTION: Infos Patient + Date ──────────────────────────────────────────
  const boxY = 50;
  const boxH = 30;
  const halfW = (pageW - margin * 2 - 6) / 2;

  // Patient box
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(margin, boxY, halfW, boxH, 3, 3, 'F');
  doc.setTextColor(...GRAY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT', margin + 4, boxY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(
    `${payment.patient?.first_name || ''} ${payment.patient?.last_name || ''}`.trim() || 'N/A',
    margin + 4, boxY + 15
  );
  if (payment.patient?.phone_primary) {
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(payment.patient.phone_primary, margin + 4, boxY + 22);
  }

  // Date box
  const dateBoxX = margin + halfW + 6;
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(dateBoxX, boxY, halfW, boxH, 3, 3, 'F');
  doc.setTextColor(...GRAY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DATE DE PAIEMENT', dateBoxX + 4, boxY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  const payDate = new Date(payment.payment_date);
  doc.text(
    payDate.toLocaleDateString('fr-MA', { day: '2-digit', month: 'long', year: 'numeric' }),
    dateBoxX + 4, boxY + 15
  );

  // ── TABLE : Détail du paiement ──────────────────────────────────────────────
  const METHOD_LABELS = {
    especes: 'Espèces',
    virement: 'Virement bancaire',
    cheque: 'Chèque',
    assurance: 'Assurance / Tiers payant'
  };
  const PAYER_LABELS = {
    patient: 'Patient lui-même',
    cnss: 'CNSS',
    cnops: 'CNOPS',
    mutuelle: 'Mutuelle Privée'
  };

  autoTable(doc, {
    startY: boxY + boxH + 10,
    margin: { left: margin, right: margin },
    head: [['Description', 'Méthode de paiement', 'Payeur', 'Montant']],
    body: [[
      'Consultation / Acte médical' + (payment.session?.care_type ? `\n${payment.session.care_type}` : ''),
      METHOD_LABELS[payment.payment_method] || payment.payment_method,
      PAYER_LABELS[payment.payer_type] || payment.payer_type,
      `${parseFloat(payment.amount).toLocaleString('fr-MA')} MAD`,
    ]],
    headStyles: {
      fillColor: BLUE,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9.5,
      textColor: DARK,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 45 },
      2: { cellWidth: 35 },
      3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
  });

  const afterTable = doc.lastAutoTable.finalY + 6;

  // Notes
  if (payment.notes) {
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES / RÉFÉRENCE :', margin, afterTable + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(payment.notes, margin, afterTable + 12);
  }

  // ── TOTAL BOX ───────────────────────────────────────────────────────────────
  const totalBoxY = afterTable + (payment.notes ? 20 : 6);
  doc.setFillColor(...BLUE);
  doc.roundedRect(pageW - margin - 65, totalBoxY, 65, 22, 4, 4, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('TOTAL PAYÉ', pageW - margin - 5, totalBoxY + 8, { align: 'right' });
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `${parseFloat(payment.amount).toLocaleString('fr-MA')} MAD`,
    pageW - margin - 5, totalBoxY + 17, { align: 'right' }
  );

  // Status badge
  doc.setFillColor(...GREEN);
  doc.roundedRect(margin, totalBoxY + 3, 28, 10, 3, 3, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYÉ', margin + 14, totalBoxY + 10, { align: 'center' });

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 14;
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 4, pageW - margin, footerY - 4);
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.text('CabinetPro — Logiciel de gestion de cabinet médical', pageW / 2, footerY, { align: 'center' });
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-MA')}`, pageW / 2, footerY + 5, { align: 'center' });

  // ── SAVE ────────────────────────────────────────────────────────────────────
  const patientName = `${payment.patient?.first_name || ''}_${payment.patient?.last_name || ''}`.replace(/\s+/g, '_');
  const dateStr = payDate.toISOString().slice(0, 10);
  doc.save(`Recu_${patientName}_${dateStr}.pdf`);
}
