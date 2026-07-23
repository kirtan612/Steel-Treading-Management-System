import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatINR = (amount) => {
  const num = parseFloat(amount) || 0;
  return 'Rs. ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const generateChallanPDF = (challan) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const navy   = [27, 58, 92];
  const orange = [232, 93, 38];
  const gray   = [107, 114, 128];
  const black  = [0, 0, 0];
  const white  = [255, 255, 255];
  const lightBg = [247, 248, 250];

  let y = margin;

  // ── HEADER ──────────────────────────────────────────────
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.text('STEELTRACK PVT. LTD.', margin, y);

  doc.setFontSize(22);
  doc.setTextColor(...orange);
  doc.text('DELIVERY CHALLAN', pageWidth - margin, y, { align: 'right' });

  y += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text('123 Industrial Area, Steel City, Gujarat - 380001', margin, y);
  doc.text(challan.challanNumber, pageWidth - margin, y, { align: 'right' });

  y += 4;
  doc.text('GST: 24ABCDE1234F1Z5  |  Phone: +91 98765 43210', margin, y);
  doc.text('Date: ' + formatDate(challan.createdAt), pageWidth - margin, y, { align: 'right' });

  y += 5;
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // ── TWO COLUMN: CONSIGNEE + TRANSPORT ───────────────────
  const colW   = (pageWidth - 2 * margin - 6) / 2;
  const col1X  = margin;
  const col2X  = margin + colW + 6;
  const boxTop = y;

  // Consignee box
  doc.setFillColor(...lightBg);
  doc.rect(col1X, boxTop, colW, 42, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.rect(col1X, boxTop, colW, 42);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.text('CONSIGNEE DETAILS', col1X + 3, boxTop + 5);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text(challan.order?.customer?.name || 'N/A', col1X + 3, boxTop + 11);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  let cy = boxTop + 16;
  if (challan.order?.customer?.company) {
    doc.text(challan.order.customer.company, col1X + 3, cy); cy += 4;
  }
  if (challan.order?.customer?.billingStreet) {
    doc.text(challan.order.customer.billingStreet, col1X + 3, cy); cy += 4;
  }
  const cityLine = [challan.order?.customer?.billingCity, challan.order?.customer?.billingState].filter(Boolean).join(', ');
  if (cityLine) { doc.text(cityLine, col1X + 3, cy); cy += 4; }
  if (challan.order?.customer?.billingPincode) {
    doc.text('PIN: ' + challan.order.customer.billingPincode, col1X + 3, cy); cy += 4;
  }
  if (challan.order?.customer?.gstNumber) {
    doc.text('GST: ' + challan.order.customer.gstNumber, col1X + 3, cy);
  }

  // Transport box
  doc.setFillColor(...lightBg);
  doc.rect(col2X, boxTop, colW, 42, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.rect(col2X, boxTop, colW, 42);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.text('TRANSPORT DETAILS', col2X + 3, boxTop + 5);

  const transportRows = [
    ['Vehicle No:', challan.vehicleNumber || '-'],
    ['Driver:', challan.driverName || '-'],
    ['Phone:', challan.driverPhone || '-'],
    ['Transporter:', challan.transporterName || '-'],
    ['Dispatch Date:', formatDate(challan.dispatchDate)],
    ['Order Ref:', challan.order?.orderNumber || '-'],
  ];

  doc.setFontSize(8);
  let ty = boxTop + 11;
  transportRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text(label, col2X + 3, ty);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text(value, col2X + colW - 3, ty, { align: 'right' });
    ty += 5;
  });

  y = boxTop + 48;

  // ── E-WAY BILL (if present) ──────────────────────────────
  if (challan.eWayBillNo) {
    doc.setFillColor(...lightBg);
    doc.rect(margin, y, pageWidth - 2 * margin, 18, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.rect(margin, y, pageWidth - 2 * margin, 18);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text('E-WAY BILL DETAILS', margin + 3, y + 5);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('E-Way Bill No:', margin + 3, y + 11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text(challan.eWayBillNo, margin + 35, y + 11);

    if (challan.eWayBillDate) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...gray);
      doc.text('Date:', margin + 90, y + 11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...black);
      doc.text(formatDate(challan.eWayBillDate), margin + 103, y + 11);
    }
    if (challan.eWayBillValidUpto) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...gray);
      doc.text('Valid Until:', margin + 140, y + 11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...black);
      doc.text(formatDate(challan.eWayBillValidUpto), margin + 163, y + 11);
    }
    y += 24;
  }

  // ── MATERIAL DETAILS TABLE ───────────────────────────────
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.text('MATERIAL DETAILS', margin, y);
  y += 3;

  const tableRows = (challan.items || []).map((item, i) => {
    const name = item.itemName || item.name || '-';
    const grade = item.grade ? ` (${item.grade})` : '';
    return [
      (i + 1).toString(),
      name + grade,
      (parseFloat(item.quantity || 0)).toLocaleString('en-IN'),
      item.unit || '-',
      formatINR(item.unitPrice || 0),
      formatINR(item.subtotal || item.totalPrice || 0),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'Description', 'Qty', 'Unit', 'Rate', 'Amount']],
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
    alternateRowStyles: { fillColor: lightBg },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 70, halign: 'left'   },
      2: { cellWidth: 18, halign: 'right'  },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 30, halign: 'right'  },
      5: { cellWidth: 35, halign: 'right'  },
    },
    margin: { left: margin, right: margin },
    foot: [[
      { content: 'Total', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fillColor: [235, 241, 248], textColor: navy } },
      { content: formatINR(challan.subtotal || 0), styles: { halign: 'right', fontStyle: 'bold', fillColor: [235, 241, 248], textColor: navy } },
    ]],
    footStyles: { fontSize: 9, cellPadding: 3 },
  });

  y = doc.lastAutoTable.finalY + 8;

  // ── NOTES ────────────────────────────────────────────────
  if (challan.notes) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text('Notes:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    const splitNotes = doc.splitTextToSize(challan.notes, pageWidth - 2 * margin - 20);
    doc.text(splitNotes, margin + 15, y);
    y += splitNotes.length * 4 + 6;
  }

  // ── SIGNATURE SECTION ────────────────────────────────────
  if (y > pageHeight - 55) { doc.addPage(); y = margin; }

  doc.setDrawColor(...gray);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  const sigW = (pageWidth - 2 * margin - 12) / 3;
  const sigBoxes = [
    { label: 'Prepared By', name: challan.creator?.name || '' },
    { label: 'Driver Signature', name: challan.driverName || '' },
    { label: 'Receiver Signature', name: challan.status === 'delivered' ? (challan.receivedBy || '') : '' },
  ];

  sigBoxes.forEach((sig, i) => {
    const sx = margin + i * (sigW + 6);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.rect(sx, y, sigW, 20);
    // signature line inside box
    doc.line(sx + 4, y + 14, sx + sigW - 4, y + 14);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text(sig.label, sx + sigW / 2, y + 18, { align: 'center' });
    if (sig.name) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...gray);
      doc.setFontSize(7);
      doc.text(sig.name, sx + sigW / 2, y + 22, { align: 'center' });
    }
  });

  y += 28;

  // ── FOOTER ───────────────────────────────────────────────
  doc.setDrawColor(...gray);
  doc.setLineWidth(0.2);
  doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text(
    'This is a computer generated delivery challan.  |  Generated by SteelTrack ERP',
    pageWidth / 2, pageHeight - 6, { align: 'center' }
  );

  const fileName = `Challan-${challan.challanNumber}.pdf`;
  doc.save(fileName);
};
