import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // 🔧 CHANGE 1: Import as variable

export const generateCaseReport = (project, posts, summary) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // --- TITLE HEADER ---
    doc.setFillColor(41, 128, 185); 
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("FORENSIC INTELLIGENCE REPORT", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
    doc.text("Confidential / Law Enforcement Use Only", pageWidth - 14, 32, { align: 'right' });

    // --- CASE DETAILS ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`Case Name: ${project.name}`, 14, 50);
    
    doc.setFontSize(10);
    doc.text(`Keyword(s): ${project.keyword}`, 14, 58);
    doc.text(`Total Posts Analyzed: ${posts.length}`, 14, 64);

    // --- RISK SUMMARY ---
    const highRisk = posts.filter(p => p.risk === 'High').length;
    const medRisk = posts.filter(p => p.risk === 'Medium').length;
    const lowRisk = posts.filter(p => p.risk === 'Low').length;

    // 🔧 CHANGE 2: Use autoTable(doc, ...) instead of doc.autoTable(...)
    autoTable(doc, {
        startY: 70,
        head: [['Risk Level', 'Count', 'Action Required']],
        body: [
            ['HIGH', highRisk, 'Immediate Review'],
            ['MEDIUM', medRisk, 'Monitor'],
            ['LOW', lowRisk, 'Archive']
        ],
        theme: 'striped',
        headStyles: { fillColor: [52, 73, 94] }
    });

    // --- AI EXECUTIVE SUMMARY ---
    if (summary) {
        doc.setFontSize(14);
        // doc.lastAutoTable.finalY works even with functional usage
        doc.text("AI Executive Summary", 14, doc.lastAutoTable.finalY + 15);
        doc.setFontSize(10);
        
        const cleanSummary = summary.replace(/<[^>]+>/g, '');
        const splitSummary = doc.splitTextToSize(cleanSummary, pageWidth - 28);
        doc.text(splitSummary, 14, doc.lastAutoTable.finalY + 22);
    }

    // --- EVIDENCE LOG (HIGH RISK ONLY) ---
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Critical Evidence Log (High Risk)", 14, 20);

    const highRiskPosts = posts.filter(p => p.risk === 'High');

    const tableRows = highRiskPosts.map(post => {
        const intel = post.enrichmentData || {};
        const phones = (intel.extracted_phones || []).join(', ');
        const upis = (intel.extracted_upis || []).join(', ');
        
        return [
            post.timestamp?.split('T')[0] || 'N/A',
            post.username,
            phones || upis || 'No specific entity',
            post.evidenceHash ? `${post.evidenceHash.substring(0, 10)}...` : 'Pending',
            post.content ? (post.content.substring(0, 50) + '...') : 'No text'
        ];
    });

    // 🔧 CHANGE 3: Use autoTable(doc, ...) here too
    autoTable(doc, {
        startY: 25,
        head: [['Date', 'User', 'Entities Found', 'Forensic Hash', 'Content Snippet']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [192, 57, 43] }, // Red for High Risk
        styles: { fontSize: 8 }
    });

    // --- FOOTER ---
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    // Save File
    doc.save(`Forensic_Report_${project.name.replace(/\s+/g, '_')}.pdf`);
};