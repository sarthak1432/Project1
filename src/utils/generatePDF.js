// src/utils/generatePDF.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Loads an image from a URL and returns its base64 data URL.
 */
function loadImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Generates the "Modern Minimalism" V8 PDF Invoice.
 * Focuses on clean whitespace, high-end typography, and a simple but professional UI.
 */
const generatePDF = async (data) => {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;
  const margin = 20;
  const rightCol = pageWidth - margin;

  // ── Colors (Original KITS Brand Palette) ──────────
  const cNavyHeader = [40, 55, 85]; // Dark Navy from template
  const cOrange = [215, 115, 40];   // Muted Orange for accents
  const cTextBlack = [40, 40, 40];
  const cTextGray = [100, 100, 100];
  const cLightBg = [248, 248, 250];
  const cWhite = [255, 255, 255];

  // Formatting helper
  const formatCurrency = (num) => {
    return "INR " + (Number(num) || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Simple Number to Words
  const toWords = (num) => {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const convert = (n) => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
      if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
      if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
      return n.toString();
    };
    const amt = Math.floor(Math.abs(num));
    if (amt === 0) return "Zero Only";
    return convert(amt) + " Only";
  };

  let currentY = 0;

  // ── 1. Top Navy Header with Slant ───────────────
  const headerHeight = 45;
  doc.setFillColor(...cNavyHeader);
  doc.rect(0, 0, pageWidth, headerHeight, "F");

  // White slant/cutout at bottom-left of header
  doc.setFillColor(...cWhite);
  doc.rect(0, headerHeight - 12, 55, 12, "F");
  doc.triangle(55, headerHeight, 70, headerHeight, 55, headerHeight - 12, "F");

  // Logo (Left-aligned)
  try {
    const logoBase64 = await loadImageAsBase64("/kits3d.png");
    doc.addImage(logoBase64, "PNG", 30, 5, 45, 25);
  } catch (e) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...cWhite);
    doc.text("KITS", 30, 22);
  }

  // "INVOICE" Title (Right-aligned)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(30);
  doc.setTextColor(...cWhite);
  doc.text("INVOICE", rightCol, 25, { align: "right" });

  currentY = headerHeight + 15;

  // ── 2. Contact Details & Invoice Summary ──────────
  // Address & Identity (Left)
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...cTextBlack);
  doc.text("KITS TECH SOLUTIONS", margin, currentY);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...cTextGray);
  doc.text("1st Floor, Mukta Plaza, KITS Square,", margin, currentY + 6);
  doc.text("Gaurakshan Road, Akola-444001", margin, currentY + 11);

  doc.text("info@kitstechsolutions.com", margin + 5, currentY + 18);
  doc.text("+91 7385582242", margin + 5, currentY + 24);

  // Subtle dots for contact
  doc.setFillColor(...cOrange);
  doc.circle(margin + 1, currentY + 17.5, 0.6, "F");
  doc.circle(margin + 1, currentY + 23.5, 0.6, "F");

  // Summary Box (Right) - Professional structure
  const summaryBoxW = 65;
  const summaryBoxX = rightCol - summaryBoxW;
  doc.setFillColor(...cLightBg);
  doc.rect(summaryBoxX, currentY - 5, summaryBoxW, 32, "F");

  doc.setDrawColor(...cOrange);
  doc.setLineWidth(1);
  doc.line(summaryBoxX, currentY - 5, summaryBoxX, currentY + 27);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...cTextGray);
  doc.text("INVOICE NO", summaryBoxX + 5, currentY + 2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...cTextBlack);
  doc.text(`INV-${new Date().getFullYear()}-${data.invoiceNumber || 1}`, summaryBoxX + 5, currentY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...cTextGray);
  doc.text("DATE OF ISSUE", summaryBoxX + 5, currentY + 14);
  doc.text("PAYMENT STATUS", summaryBoxX + 5, currentY + 21);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...cTextBlack);
  doc.text(data.date || new Date().toLocaleDateString(), summaryBoxX + 32, currentY + 14);
  doc.setTextColor(34, 139, 34); // Forest Green for Paid
  doc.text("PAID", summaryBoxX + 32, currentY + 21);

  currentY += 45;

  // ── 3. Bill To ──────────────────────────────────
  doc.setDrawColor(230, 230, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY - 5, rightCol, currentY - 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...cOrange);
  doc.text("BILL TO", margin, currentY + 2);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...cTextGray);
  doc.text("Client Name:", margin, currentY + 12);
  doc.setTextColor(...cTextBlack);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(data.customer, margin + 25, currentY + 12);

  if (data.clientPhone) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...cTextGray);
    doc.text("Contact:", margin, currentY + 18);
    doc.setTextColor(...cTextBlack);
    doc.text(`+91 ${data.clientPhone}`, margin + 25, currentY + 18);
  }

  currentY += 25;

  // ── 4. The Table ─────────────────────────────────
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["SERVICE DESCRIPTION", "MATERIAL", "DESIGN", "PRINT", "WEIGHT", "RATE", "TOTAL"]],
    body: [[
      { content: data.model, styles: { fontStyle: 'bold' } },
      data.filament,
      `${data.designTime || 0}m`,
      `${data.printTime || 0}h`,
      `${data.grams}g`,
      (data.price || 0).toFixed(2),
      (data.total || 0).toFixed(2)
    ]],
    theme: "striped",
    headStyles: {
      fillColor: [240, 240, 245],
      textColor: cNavyHeader,
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: cTextBlack,
      halign: "center",
      cellPadding: 6,
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 45 },
      6: { fontStyle: "bold" }
    }
  });

  currentY = doc.lastAutoTable.finalY + 15;

  // ── 5. BOX MODE GRAND TOTAL (Refined) ─────────────
  const summaryBoxX2 = rightCol - 70;
  doc.setFillColor(...cNavyHeader);
  doc.rect(summaryBoxX2, currentY, 70, 15, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...cWhite);
  doc.text("GRAND TOTAL", summaryBoxX2 + 5, currentY + 9.5);

  doc.setFontSize(11);
  doc.text(formatCurrency(data.total), rightCol - 5, currentY + 9.5, { align: "right" });

  // Amount in Words
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...cTextGray);
  doc.text(toWords(data.total).toUpperCase(), rightCol, currentY + 23, { align: "right" });

  // ── 6. Signatory & Thank You ────────────────────
  let finalY = currentY + 45;

  doc.setDrawColor(...cTextGray);
  doc.setLineWidth(0.2);
  doc.line(rightCol - 60, finalY, rightCol, finalY);
  doc.setFontSize(8);
  doc.text("Authorised Signatory", rightCol - 30, finalY + 5, { align: "center" });

  // Thank you centered under signature area
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...cTextBlack);
  doc.text("Thank you for your business!", centerX, finalY + 18, { align: "center" });

  // ── 7. Professional Footer Bar ───────────────────
  const footerBarH = 15;
  const footerY = pageHeight - footerBarH;

  // Solid Professional Navy Footer
  doc.setFillColor(...cNavyHeader);
  doc.rect(0, footerY, pageWidth, footerBarH, "F");

  // Brand Name in Footer
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...cWhite);
  doc.text("KITS TECH SOLUTIONS", centerX, footerY + 6, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("info@kitstechsolutions.com", centerX, footerY + 11.5, { align: "center" });

  return doc.output("blob");
};

export default generatePDF;