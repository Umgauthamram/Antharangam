import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateCaseReport = (project, posts, summary) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Helper for colors
    const colors = {
        primary: [44, 62, 80], // Dark Blue
        secondary: [52, 152, 219], // Light Blue
        accent: [231, 76, 60], // Red
        lightGray: [236, 240, 241],
        darkGray: [127, 140, 141]
    };

    // --- HEADER ---
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("FORENSIC INTELLIGENCE REPORT", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text("CONFIDENTIAL / LAW ENFORCEMENT USE ONLY", pageWidth - 14, 28, { align: 'right' });

    // --- METADATA ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);

    doc.setFont("helvetica", "bold");
    doc.text("CASE DETAILS", 14, 50);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 52, pageWidth - 14, 52);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Case ID: ${project._id || 'N/A'}`, 14, 60);
    doc.text(`Project Name: ${project.name}`, 14, 66);
    doc.text(`Primary Keyword: ${project.keyword}`, 14, 72);

    doc.text(`Total Analysts: 1 (Automated)`, pageWidth / 2, 60);
    doc.text(`Total Artifacts: ${posts.length}`, pageWidth / 2, 66);
    doc.text(`Platform(s): Global Scan`, pageWidth / 2, 72);

    // --- RISK MATRIX VISUAL ---
    const highRisk = posts.filter(p => p.risk === 'High').length;
    const medRisk = posts.filter(p => p.risk === 'Medium').length;
    const lowRisk = posts.filter(p => p.risk === 'Low').length;

    const startY = 85;

    // High Risk Box
    doc.setFillColor(252, 230, 230); // Light Red
    doc.setDrawColor(192, 57, 43);
    doc.roundedRect(14, startY, 50, 25, 2, 2, 'FD');
    doc.setTextColor(192, 57, 43);
    doc.setFont("helvetica", "bold");
    doc.text(`${highRisk}`, 39, startY + 12, { align: 'center' });
    doc.setFontSize(9);
    doc.text("CRITICAL THREATS", 39, startY + 20, { align: 'center' });

    // Med Risk Box
    doc.setFillColor(254, 249, 231); // Light Orange
    doc.setDrawColor(243, 156, 18);
    doc.roundedRect(74, startY, 50, 25, 2, 2, 'FD');
    doc.setTextColor(211, 84, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`${medRisk}`, 99, startY + 12, { align: 'center' });
    doc.setFontSize(9);
    doc.text("MODERATE RISK", 99, startY + 20, { align: 'center' });

    // Low Risk Box
    doc.setFillColor(232, 248, 245); // Light Green
    doc.setDrawColor(22, 160, 133);
    doc.roundedRect(134, startY, 50, 25, 2, 2, 'FD');
    doc.setTextColor(22, 160, 133);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`${lowRisk}`, 159, startY + 12, { align: 'center' });
    doc.setFontSize(9);
    doc.text("LOW PRIORITY", 159, startY + 20, { align: 'center' });

    // --- EXECUTIVE SUMMARY ---
    let summaryY = startY + 35;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("EXECUTIVE INTELLIGENCE SUMMARY", 14, summaryY);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, summaryY + 2, pageWidth - 14, summaryY + 2);

    if (summary) {
        doc.setFont("times", "normal");
        doc.setFontSize(11);

        // Strip HTML tags roughly but keep structure
        const cleanSummary = summary
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<[^>]+>/g, '')
            .trim();

        const splitSummary = doc.splitTextToSize(cleanSummary, pageWidth - 28);
        doc.text(splitSummary, 14, summaryY + 10);
        summaryY += (splitSummary.length * 5) + 20;
    } else {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.text("No automated summary generated for this batch.", 14, summaryY + 10);
        summaryY += 20;
    }

    // --- CRITICAL EVIDENCE TABLE ---
    const highRiskPosts = posts.filter(p => p.risk === 'High');

    if (highRiskPosts.length > 0) {
        doc.addPage();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(192, 57, 43); // Red header
        doc.text("CRITICAL THREAT EVIDENCE LOG", 14, 20);

        const tableRows = highRiskPosts.map(post => {
            const intel = post.enrichmentData || {};
            const entities = [
                ...(intel.extracted_phones || []).map(p => `Ph:${p}`),
                ...(intel.extracted_upis || []).map(u => `UPI:${u}`)
            ].join(', ');

            return [
                post.timestamp?.split('T')[0],
                `@${post.username}\n(${post.platform})`,
                entities || 'None',
                post.content ? post.content.substring(0, 100) : 'No text'
            ];
        });

        autoTable(doc, {
            startY: 25,
            head: [['Date', 'Target Profile', 'Forensic Data', 'Content Evidence']],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [192, 57, 43], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 35 },
                2: { cellWidth: 40 },
                3: { cellWidth: 'auto' }
            }
        });
    }

    // --- FULL DATA DUMP (ALL POSTS) ---
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...colors.primary);
    doc.text("FULL DATASET LOG", 14, 20);

    const allRows = posts.map(post => [
        post.risk?.toUpperCase() || 'UNK',
        post.platform,
        `@${post.username}`,
        post.content ? post.content.substring(0, 60) + '...' : ''
    ]);

    autoTable(doc, {
        startY: 25,
        head: [['Risk', 'Platform', 'User', 'Content']],
        body: allRows,
        theme: 'striped',
        headStyles: { fillColor: [...colors.primary] },
        styles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 20 }, // Risk
            1: { cellWidth: 25 }, // Platform
            2: { cellWidth: 35 }, // User
            3: { cellWidth: 'auto' }
        },
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 0) {
                if (data.cell.raw === 'HIGH') {
                    data.cell.styles.textColor = [192, 57, 43];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        }
    });

    // --- FOOTER FOR ALL PAGES ---
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${totalPages} - Generated by Antharangam Intel System`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // Save File
    doc.save(`Forensic_Report_${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};