import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Formats a number as Indian currency
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formats a date as DD MMM YYYY
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * Generates and downloads an invoice PDF
 * @param {Object} invoice - The invoice object containing all invoice data
 */
export const generateInvoicePDF = (invoice) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Colors
  const navyColor = '#1B3A5C';
  const orangeColor = '#E85D26';
  const grayColor = '#6B7280';
  const lightGrayBg = '#F7F8FA';

  let yPos = margin;

  // ============ HEADER SECTION ============
  // Company Name
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navyColor);
  doc.text('STEELTRACK PVT. LTD.', margin, yPos);
  yPos += 6;

  // Company Details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(grayColor);
  doc.text('123 Industrial Area, Phase 2, Mumbai - 400001', margin, yPos);
  yPos += 4;
  doc.text('GST: 27AABCU9603R1ZX | Phone: +91 98765 43210', margin, yPos);

  // INVOICE Title (Right Side)
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(orangeColor);
  doc.text('INVOICE', pageWidth - margin, margin, { align: 'right' });

  // Invoice Number
  doc.setFontSize(10);
  doc.setFont('courier', 'normal');
  doc.setTextColor(grayColor);
  doc.text(invoice.invoiceNumber, pageWidth - margin, margin + 8, { align: 'right' });

  // Dates
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${formatDate(invoice.issueDate)}`, pageWidth - margin, margin + 13, { align: 'right' });
  doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, pageWidth - margin, margin + 18, { align: 'right' });

  yPos += 10;

  // Horizontal Divider
  doc.setDrawColor(navyColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // ============ BILL TO SECTION ============
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(grayColor);
  doc.text('BILL TO:', margin, yPos);
  yPos += 5;

  // Customer Name
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#000000');
  doc.text(invoice.customer?.name || 'N/A', margin, yPos);
  yPos += 5;

  // Company Name
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(grayColor);
  if (invoice.customer?.company) {
    doc.text(invoice.customer.company, margin, yPos);
    yPos += 4;
  }

  // GST Number
  if (invoice.customer?.gstNumber) {
    doc.setFontSize(9);
    doc.text(`GSTIN: ${invoice.customer.gstNumber}`, margin, yPos);
    yPos += 4;
  }

  // Billing Address
  if (invoice.customer?.billingAddress) {
    doc.setFontSize(9);
    const address = invoice.customer.billingAddress;
    doc.text(address.street || '', margin, yPos);
    yPos += 4;
    doc.text(`${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}`, margin, yPos);
    yPos += 4;
  }

  yPos += 5;

  // ============ ITEMS TABLE ============
  const tableData = invoice.items?.map((item, index) => [
    (index + 1).toString(),
    `${item.itemName || ''}\n${item.size || ''} ${item.grade || ''}`.trim(),
    item.quantity?.toString() || '0',
    item.unit || '',
    formatCurrency(item.rate || 0),
    formatCurrency(item.amount || 0),
  ]) || [];

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Description', 'Qty', 'Unit', 'Rate', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: navyColor,
      textColor: '#FFFFFF',
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: '#000000',
    },
    alternateRowStyles: {
      fillColor: lightGrayBg,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // ============ TAX SUMMARY SECTION ============
  const summaryX = pageWidth - margin - 70;
  const labelX = summaryX;
  const valueX = pageWidth - margin;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#000000');

  // Subtotal
  doc.text('Subtotal:', labelX, yPos);
  doc.text(formatCurrency(invoice.subtotal || 0), valueX, yPos, { align: 'right' });
  yPos += 5;

  // CGST (only if > 0)
  if (invoice.cgst > 0) {
    doc.text('CGST (9%):', labelX, yPos);
    doc.text(formatCurrency(invoice.cgst), valueX, yPos, { align: 'right' });
    yPos += 5;
  }

  // SGST (only if > 0)
  if (invoice.sgst > 0) {
    doc.text('SGST (9%):', labelX, yPos);
    doc.text(formatCurrency(invoice.sgst), valueX, yPos, { align: 'right' });
    yPos += 5;
  }

  // IGST (only if > 0)
  if (invoice.igst > 0) {
    doc.text('IGST (18%):', labelX, yPos);
    doc.text(formatCurrency(invoice.igst), valueX, yPos, { align: 'right' });
    yPos += 5;
  }

  // Divider line
  doc.setDrawColor(grayColor);
  doc.setLineWidth(0.3);
  doc.line(labelX, yPos, valueX, yPos);
  yPos += 5;

  // Grand Total
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', labelX, yPos);
  doc.text(formatCurrency(invoice.grandTotal || 0), valueX, yPos, { align: 'right' });
  yPos += 6;

  // Amount Paid
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#10B981'); // Green
  doc.text('Amount Paid:', labelX, yPos);
  doc.text(formatCurrency(invoice.amountPaid || 0), valueX, yPos, { align: 'right' });
  yPos += 5;

  // Balance Due
  doc.setTextColor('#EF4444'); // Red
  doc.text('Balance Due:', labelX, yPos);
  doc.text(formatCurrency(invoice.balance || 0), valueX, yPos, { align: 'right' });
  yPos += 8;

  // ============ PAYMENT STATUS BADGE ============
  doc.setTextColor('#000000');
  const status = invoice.status?.toLowerCase();
  let badgeColor, badgeText;

  if (status === 'paid') {
    badgeColor = '#10B981';
    badgeText = 'PAID ✓';
  } else if (status === 'partial') {
    badgeColor = '#F59E0B';
    badgeText = 'PARTIAL PAYMENT';
  } else if (status === 'overdue') {
    badgeColor = '#EF4444';
    badgeText = 'OVERDUE';
  } else {
    badgeColor = '#EF4444';
    badgeText = 'UNPAID';
  }

  doc.setFillColor(badgeColor);
  doc.roundedRect(labelX, yPos - 5, 60, 8, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#FFFFFF');
  doc.text(badgeText, labelX + 30, yPos, { align: 'center' });

  yPos += 10;

  // ============ FOOTER SECTION ============
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#000000');

  // Check if there's enough space, otherwise add new page
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = margin;
  }

  // Payment Terms
  doc.text('Payment Terms:', margin, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(grayColor);
  const termsText = invoice.termsAndConditions || 'Payment due within 30 days';
  const splitTerms = doc.splitTextToSize(termsText, pageWidth - 2 * margin);
  doc.text(splitTerms, margin, yPos);
  yPos += splitTerms.length * 4 + 3;

  // Bank Details
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#000000');
  doc.text('Bank Details:', margin, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(grayColor);
  doc.text('Bank Name: State Bank of India', margin, yPos);
  yPos += 4;
  doc.text('Account Number: 1234567890123456', margin, yPos);
  yPos += 4;
  doc.text('IFSC Code: SBIN0001234', margin, yPos);
  yPos += 6;

  // Notes (if present)
  if (invoice.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#000000');
    doc.text('Notes:', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayColor);
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
    doc.text(splitNotes, margin, yPos);
    yPos += splitNotes.length * 4 + 3;
  }

  // Thank you message
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(grayColor);
  doc.setFontSize(10);
  doc.text('Thank you for your business!', margin, yPos);
  yPos += 8;

  // Bottom divider and footer
  doc.setDrawColor(grayColor);
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 4;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated by SteelTrack ERP', pageWidth / 2, yPos, { align: 'center' });

  // ============ DOWNLOAD PDF ============
  const customerName = invoice.customer?.name?.replace(/\s+/g, '-') || 'Customer';
  const fileName = `Invoice-${invoice.invoiceNumber}-${customerName}.pdf`;
  doc.save(fileName);
};
