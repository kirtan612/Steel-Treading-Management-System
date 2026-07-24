import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { companyConfig } from '../config/company';


const formatINR = (amount) => {
  const num = parseFloat(amount) || 0;
  return 'Rs. ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const generateInvoicePDF = (invoice) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const navy = [27, 58, 92];
  const orange = [232, 93, 38];
  const gray = [107, 114, 128];
  const black = [0, 0, 0];
  const white = [255, 255, 255];

  let y = margin;

  // ── HEADER ──────────────────────────────────────────────
  // Company name
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.text(companyConfig.name.toUpperCase(), margin, y);

  // INVOICE label
  doc.setFontSize(26);
  doc.setTextColor(...orange);
  doc.text('INVOICE', pageWidth - margin, y, { align: 'right' });

  y += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text(`${companyConfig.address}, ${companyConfig.city} - ${companyConfig.pincode}, ${companyConfig.state}`, margin, y);
  doc.text(invoice.invoiceNumber, pageWidth - margin, y, { align: 'right' });

  y += 4;
  doc.text(`GSTIN: ${companyConfig.gstNumber}  |  Phone: ${companyConfig.phone}`, margin, y);
  doc.text('Date: ' + formatDate(invoice.issueDate), pageWidth - margin, y, { align: 'right' });

  y += 4;
  doc.text('Due Date: ' + formatDate(invoice.dueDate), pageWidth - margin, y, { align: 'right' });

  y += 5;
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // ── BILL TO ─────────────────────────────────────────────
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...gray);
  doc.text('BILL TO:', margin, y);
  y += 5;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text(invoice.customer?.name || 'N/A', margin, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);

  if (invoice.customer?.company) {
    doc.text(invoice.customer.company, margin, y);
    y += 4;
  }
  if (invoice.customer?.gstNumber) {
    doc.text('GSTIN: ' + invoice.customer.gstNumber, margin, y);
    y += 4;
  }
  if (invoice.customer?.panNumber) {
    doc.text('PAN: ' + invoice.customer.panNumber, margin, y);
    y += 4;
  }
  if (invoice.customer?.billingAddress) {
    const a = invoice.customer.billingAddress;
    if (a.street) { doc.text(a.street, margin, y); y += 4; }
    const cityLine = [a.city, a.state, a.pincode].filter(Boolean).join(', ');
    if (cityLine) { doc.text(cityLine, margin, y); y += 4; }
  }

  y += 4;

  // ── ITEMS TABLE ─────────────────────────────────────────
  const tableRows = (invoice.items || []).map((item, i) => {
    const hsn = item.hsnCode || '73063010';
    const desc = [item.itemName, item.grade].filter(Boolean).join(' - ') + `\nHSN: ${hsn}`;
    const qty  = parseFloat(item.quantity || 0).toLocaleString('en-IN');
    const unit = item.unit || '';
    const rate = formatINR(item.unitPrice || item.rate || 0);
    const disc = parseFloat(item.discount || 0);
    const discStr = disc > 0 ? disc + '%' : '-';
    const amount = formatINR(item.subtotal || item.amount || 0);
    return [(i + 1).toString(), desc, qty, unit, rate, discStr, amount];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'Description', 'Qty', 'Unit', 'Rate', 'Disc%', 'Amount']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: navy,
      textColor: white,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: black,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
    alternateRowStyles: { fillColor: [247, 248, 250] },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      1: { cellWidth: 65, halign: 'left'   },
      2: { cellWidth: 16, halign: 'right'  },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 28, halign: 'right'  },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 32, halign: 'right'  },
    },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 8;

  // ── TOTALS ───────────────────────────────────────────────
  const labelX  = pageWidth - margin - 75;
  const valueX  = pageWidth - margin;
  const lineGap = 6;

  const drawRow = (label, value, bold = false, color = black) => {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...black);
    doc.text(label, labelX, y);
    doc.setTextColor(...color);
    doc.text(value, valueX, y, { align: 'right' });
    doc.setTextColor(...black);
    y += lineGap;
  };

  // light background box for totals
  const boxH = lineGap * (3 + (invoice.cgst > 0 ? 1 : 0) + (invoice.sgst > 0 ? 1 : 0) + (invoice.igst > 0 ? 1 : 0)) + 8;
  doc.setFillColor(247, 248, 250);
  doc.rect(labelX - 4, y - 4, valueX - labelX + 8, boxH, 'F');

  drawRow('Subtotal:', formatINR(invoice.subtotal || 0));
  if (parseFloat(invoice.discountAmount) > 0)
    drawRow('Discount:', '- ' + formatINR(invoice.discountAmount));
  if (parseFloat(invoice.cgst) > 0) drawRow('CGST (9%):', formatINR(invoice.cgst));
  if (parseFloat(invoice.sgst) > 0) drawRow('SGST (9%):', formatINR(invoice.sgst));
  if (parseFloat(invoice.igst) > 0) drawRow('IGST (18%):', formatINR(invoice.igst));

  // divider
  doc.setDrawColor(...gray);
  doc.setLineWidth(0.3);
  doc.line(labelX, y - 2, valueX, y - 2);
  y += 2;

  // Grand total row — bigger
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.text('Grand Total:', labelX, y);
  doc.text(formatINR(invoice.grandTotal || 0), valueX, y, { align: 'right' });
  y += 7;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129); // green
  doc.text('Amount Paid:', labelX, y);
  doc.text(formatINR(invoice.amountPaid || 0), valueX, y, { align: 'right' });
  y += 6;

  const balance = parseFloat(invoice.balance ?? (invoice.grandTotal - invoice.amountPaid)) || 0;
  doc.setTextColor(balance > 0 ? 239 : 16, balance > 0 ? 68 : 185, balance > 0 ? 68 : 129);
  doc.text('Balance Due:', labelX, y);
  doc.text(formatINR(balance), valueX, y, { align: 'right' });
  y += 8;

  // ── STATUS BADGE ─────────────────────────────────────────
  const status = invoice.status?.toLowerCase();
  const badgeColors = {
    paid:    [16, 185, 129],
    partial: [245, 158, 11],
    overdue: [239, 68, 68],
    unpaid:  [239, 68, 68],
  };
  const badgeLabels = { paid: 'PAID', partial: 'PARTIAL PAYMENT', overdue: 'OVERDUE', unpaid: 'UNPAID' };
  const bColor = badgeColors[status] || badgeColors.unpaid;
  const bLabel = badgeLabels[status] || 'UNPAID';

  doc.setFillColor(...bColor);
  doc.roundedRect(labelX, y - 5, 65, 9, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...white);
  doc.text(bLabel, labelX + 32.5, y + 0.5, { align: 'center' });
  y += 12;

  // ── FOOTER ───────────────────────────────────────────────
  if (y > pageHeight - 55) { doc.addPage(); y = margin; }

  doc.setDrawColor(...gray);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Two column footer
  const col2X = pageWidth / 2 + 5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text('Payment Terms:', margin, y);
  doc.text('Bank Details:', col2X, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  const terms = invoice.termsAndConditions || 'Payment due within 30 days';
  const splitTerms = doc.splitTextToSize(terms, pageWidth / 2 - margin - 5);
  doc.text(splitTerms, margin, y);

  doc.text(`Bank Name: ${companyConfig.bankName}`, col2X, y);     y += 4;
  doc.text(`Account: ${companyConfig.accountNumber}`,       col2X, y);     y += 4;
  doc.text(`IFSC: ${companyConfig.ifscCode}`,               col2X, y);

  y += Math.max(splitTerms.length * 4, 12) + 4;

  if (invoice.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text('Notes:', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
    doc.text(splitNotes, margin, y);
    y += splitNotes.length * 4 + 4;
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('Thank you for your business!', margin, y);

  // bottom line
  doc.setDrawColor(...gray);
  doc.setLineWidth(0.2);
  doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text('Generated by SteelTrack ERP', pageWidth / 2, pageHeight - 6, { align: 'center' });

  const fileName = `Invoice-${invoice.invoiceNumber}-${(invoice.customer?.name || 'Customer').replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
};
