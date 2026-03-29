import jsPDF from "jspdf";

interface LedgerRow {
  sn: number;
  date: string;
  type: string;
  reference: string;
  description: string;
  note: string;
  debit: number;
  credit: number;
  running_balance: number;
}

interface LedgerPdfOptions {
  accountName: string;
  accountCode: string;
  accountType: string;
  dateFrom: string;
  dateTo: string;
  rows: LedgerRow[];
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  companyName?: string;
}

const fmt = (v: number) =>
  Math.abs(v).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function generateLedgerStatementPdf(opts: LedgerPdfOptions) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const mL = 6;
  const mR = 6;
  const tableW = pageW - mL - mR;

  const cols = [
    { label: "SN", w: 10, align: "center" as const },
    { label: "Vch. Date", w: 22, align: "left" as const },
    { label: "Vch Type", w: 20, align: "left" as const },
    { label: "Vch No", w: 28, align: "left" as const },
    { label: "Ref No", w: 28, align: "left" as const },
    { label: "Particulars", w: 55, align: "left" as const },
    { label: "Note", w: 38, align: "left" as const },
    { label: "Cost Centre", w: 22, align: "left" as const },
    { label: "Qty", w: 14, align: "right" as const },
    { label: "Debit", w: 24, align: "right" as const },
    { label: "Credit", w: 24, align: "right" as const },
    { label: "Balance", w: 26, align: "right" as const },
  ];

  // Scale columns to fit
  const totalColW = cols.reduce((s, c) => s + c.w, 0);
  const scale = tableW / totalColW;
  cols.forEach((c) => (c.w *= scale));

  const hdrClr = [200, 100, 20]; // orange-brown
  const hdrTxt = [180, 80, 0];
  const rowH = 5.5;
  const headerH = 6.5;
  let curY = 8;
  let pageNum = 1;

  // ─── Page Header (matching reference image) ───────────────────
  function drawPageHeader() {
    const company = opts.companyName || "Company Name";

    // Company name - centered, bold
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(company, pageW / 2, curY, { align: "center" });
    curY += 6;

    // Statement subtitle - centered
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    const subtitle = `Statement of ${opts.accountCode ? opts.accountCode + " - " : ""}${opts.accountName}`;
    doc.text(subtitle, pageW / 2, curY, { align: "center" });
    curY += 5;

    // Period line
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Period: ${opts.dateFrom}  to  ${opts.dateTo}`, pageW / 2, curY, { align: "center" });

    // ─── Summary box (top-right) ────────────────────────────────
    const sumX = pageW - mR - 70;
    const sumY = 8;
    const sumW = 68;
    const sumH = 20;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text("Summary", sumX + sumW / 2, sumY, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(`Total Credit: ${fmt(opts.totalCredit)}`, sumX + sumW - 2, sumY + 5, { align: "right" });
    doc.text(`Total Debit: ${fmt(opts.totalDebit)}`, sumX + sumW - 2, sumY + 9.5, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.text(`Cur. Balance: ${fmt(opts.closingBalance)}`, sumX + sumW - 2, sumY + 14, { align: "right" });

    curY += 5;
  }

  // ─── Table Header ─────────────────────────────────────────────
  function drawTableHeader() {
    doc.setFillColor(255, 243, 224);
    doc.rect(mL, curY, tableW, headerH, "F");
    doc.setDrawColor(hdrClr[0], hdrClr[1], hdrClr[2]);
    doc.setLineWidth(0.3);
    doc.rect(mL, curY, tableW, headerH);

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(hdrTxt[0], hdrTxt[1], hdrTxt[2]);

    let x = mL;
    cols.forEach((col) => {
      const tx = col.align === "center" ? x + col.w / 2 : col.align === "right" ? x + col.w - 2 : x + 1.5;
      doc.text(col.label, tx, curY + headerH / 2, { align: col.align, baseline: "middle" });
      // Vertical line
      doc.line(x, curY, x, curY + headerH);
      x += col.w;
    });
    doc.line(x, curY, x, curY + headerH); // right edge

    curY += headerH;
  }

  // ─── Opening Balance Row ──────────────────────────────────────
  function drawOpeningBalanceRow() {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.15);
    doc.rect(mL, curY, tableW, rowH);

    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(80, 80, 80);

    // Particulars column position
    let x = mL;
    for (let i = 0; i < 5; i++) x += cols[i].w;
    doc.text("Opening Balance", x + 1.5, curY + rowH / 2, { baseline: "middle" });

    // Balance column - show 0.00 or first balance
    const balX = mL + cols.reduce((s, c) => s + c.w, 0) - cols[11].w;
    doc.setFont("helvetica", "bold");
    doc.text("0.00", balX + cols[11].w - 2, curY + rowH / 2, { align: "right", baseline: "middle" });

    // Vertical lines
    let vx = mL;
    cols.forEach((col) => {
      doc.line(vx, curY, vx, curY + rowH);
      vx += col.w;
    });
    doc.line(vx, curY, vx, curY + rowH);

    curY += rowH;
  }

  // ─── Data Row ─────────────────────────────────────────────────
  function drawRow(row: LedgerRow) {
    if (curY + rowH > pageH - 12) {
      drawPageFooter();
      doc.addPage();
      pageNum++;
      curY = 8;
      drawTableHeader();
    }

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.15);

    // Alternating background
    if (row.sn % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(mL, curY, tableW, rowH, "F");
    }
    doc.rect(mL, curY, tableW, rowH);

    const cellValues = [
      row.sn.toString(),
      row.date,
      row.type,
      "", // Vch No
      row.reference,
      row.description,
      row.note,
      "", // Cost Centre
      "0.00", // Qty
      row.debit > 0 ? fmt(row.debit) : "0.00",
      row.credit > 0 ? fmt(row.credit) : "0.00",
      fmt(row.running_balance),
    ];

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);

    let x = mL;
    cols.forEach((col, i) => {
      doc.line(x, curY, x, curY + rowH);
      const tx = col.align === "center" ? x + col.w / 2 : col.align === "right" ? x + col.w - 2 : x + 1.5;

      let text = cellValues[i];
      const maxW = col.w - 3;
      while (doc.getTextWidth(text) > maxW && text.length > 3) {
        text = text.slice(0, -4) + "..";
      }

      doc.text(text, tx, curY + rowH / 2, { align: col.align, baseline: "middle" });
      x += col.w;
    });
    doc.line(x, curY, x, curY + rowH); // right edge

    curY += rowH;
  }

  // ─── Note sub-row (description detail under main row) ─────────
  function drawNoteRow(noteText: string) {
    if (curY + rowH > pageH - 12) {
      drawPageFooter();
      doc.addPage();
      pageNum++;
      curY = 8;
      drawTableHeader();
    }

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.15);
    doc.rect(mL, curY, tableW, rowH);

    doc.setFontSize(6);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text("      " + noteText, mL + 2, curY + rowH / 2, { baseline: "middle" });

    // Vertical lines
    let vx = mL;
    cols.forEach((col) => {
      doc.line(vx, curY, vx, curY + rowH);
      vx += col.w;
    });
    doc.line(vx, curY, vx, curY + rowH);

    curY += rowH;
  }

  // ─── Total Row ────────────────────────────────────────────────
  function drawTotalRow() {
    const h = headerH + 1;
    doc.setFillColor(255, 243, 224);
    doc.rect(mL, curY, tableW, h, "F");
    doc.setDrawColor(hdrClr[0], hdrClr[1], hdrClr[2]);
    doc.setLineWidth(0.4);
    doc.rect(mL, curY, tableW, h);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(hdrClr[0], hdrClr[1], hdrClr[2]);

    // "Total" label
    doc.text("Total", mL + 4, curY + h / 2, { baseline: "middle" });

    // Debit
    const debitX = mL + cols.slice(0, 9).reduce((s, c) => s + c.w, 0);
    doc.text(fmt(opts.totalDebit), debitX + cols[9].w - 2, curY + h / 2, { align: "right", baseline: "middle" });

    // Credit
    const creditX = debitX + cols[9].w;
    doc.text(fmt(opts.totalCredit), creditX + cols[10].w - 2, curY + h / 2, { align: "right", baseline: "middle" });

    // Balance
    const balX = creditX + cols[10].w;
    doc.text(fmt(opts.closingBalance), balX + cols[11].w - 2, curY + h / 2, { align: "right", baseline: "middle" });

    // Vertical lines
    let vx = mL;
    cols.forEach((col) => {
      doc.line(vx, curY, vx, curY + h);
      vx += col.w;
    });
    doc.line(vx, curY, vx, curY + h);

    curY += h + 2;
  }

  // ─── Page Footer ──────────────────────────────────────────────
  function drawPageFooter() {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${pageNum}`, pageW / 2, pageH - 5, { align: "center" });
  }

  // ═══════════════════════════════════════════════════════════════
  // BUILD PDF
  // ═══════════════════════════════════════════════════════════════
  drawPageHeader();
  drawTableHeader();
  drawOpeningBalanceRow();

  opts.rows.forEach((row) => {
    drawRow(row);
    // If note exists, draw sub-row
    if (row.note) {
      drawNoteRow(row.note);
    }
  });

  if (opts.rows.length > 0) {
    drawTotalRow();
  }

  drawPageFooter();

  const accountSlug = opts.accountName.replace(/\s+/g, "-").toLowerCase();
  doc.save(`ledger-statement-${accountSlug}.pdf`);
}
