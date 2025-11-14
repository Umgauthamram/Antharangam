import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';

jsPDF.API.autoTable = autoTable;

export const exportSummaryToPDF = (summaryHTML, query) => {
  const doc = new jsPDF('p', 'pt', 'a4');               
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const maxWidth = pageWidth - 2 * margin;

  // ---- Header -------------------------------------------------
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Strike Analysis: "${query}"`, margin, 50);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 70);

  // ---- Strip HTML, keep line-breaks ---------------------------
  const plain = summaryHTML
    .replace(/<br\s*\/?>/gi, '\n')          // <br> → newline
    .replace(/<\/?[^>]+>/g, '')            // remove every tag
    .replace(/\*\*(.*?)\*\*/g, '$1')       // **bold** → plain
    .trim();

  // ---- Split into lines that fit the page --------------------
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(plain, maxWidth);

  // ---- Add text, add pages when needed -----------------------
  let y = 100;
  const lineHeight = 14;

  lines.forEach(line => {
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  });

  doc.save(`strike-summary-${query.replace(/\s+/g, '_').toLowerCase()}.pdf`);
};


/* --------------------------------------------------------------
   3. Excel – Source Data (unchanged – works with 50+ rows)
   -------------------------------------------------------------- */
export const exportPostsToExcel = (posts, query) => {
  const data = posts.map(p => ({
    Platform: p.platform,
    Username: p.username,
    Content: p.content,
    URL: p.url,
    Timestamp: p.timestamp,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Posts');

  ws['!cols'] = [
    { wch: 12 },
    { wch: 20 },
    { wch: 90 },
    { wch: 55 },
    { wch: 22 },
  ];

  XLSX.writeFile(wb, `strike-posts-${query.replace(/\s+/g, '_').toLowerCase()}.xlsx`);
};




export const exportPostsToPDF = (posts, query) => {
  // ---- Guard clause: no posts ----
  if (!posts || posts.length === 0) {
    toast.error('No posts to export');
    return;
  }

  try {
    const doc = new jsPDF('l', 'pt', 'a4'); // landscape

    // ---------- Header ----------
    const title = `Source Data – "${query}" (${posts.length} posts)`;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 40, 40);

    // ---------- Sanitize data (prevent undefined crash) ----------
    const safePosts = posts.map(p => ({
      platform: p.platform || 'N/A',
      username: p.username || 'N/A',
      content: (p.content || '').toString(),
      url: p.url || '',
      timestamp: p.timestamp || 'N/A',
    }));

    const rows = safePosts.map(p => [
      p.platform,
      p.username,
      p.content,
      p.url,
      p.timestamp,
    ]);

    // ---------- autoTable ----------
    doc.autoTable({
      head: [['Platform', 'Username', 'Content', 'URL', 'Timestamp']],
      body: rows,
      startY: 70,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 5,
        overflow: 'linebreak',
        lineWidth: 0.5,
        lineColor: [200, 200, 200],
      },
      headStyles: {
        fillColor: [13, 148, 136],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 100 },
        2: { cellWidth: 300 },  // Content – wraps
        3: { cellWidth: 180 },
        4: { cellWidth: 120 },
      },
      pageBreak: 'auto',
      margin: { top: 60, left: 30, right: 30 },
      didParseCell: (data) => {
        // Optional: truncate very long content for performance
        if (data.column.index === 2 && data.cell.raw && data.cell.raw.length > 1000) {
          data.cell.text = data.cell.raw.substring(0, 1000) + '...';
        }
      },
    });

    // ---------- Save ----------
    const fileName = `strike-posts-${query.replace(/\s+/g, '_').toLowerCase()}.pdf`;
    doc.save(fileName);
    toast.success(`PDF saved: ${fileName}`);
  } catch (err) {
    console.error('PDF generation error:', err);
    toast.error(`PDF failed: ${err.message || 'Unknown error'}`);
  }
};