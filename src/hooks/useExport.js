// src/hooks/useExport.js
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BRAND_INDIGO = [79, 70, 229];
const BRAND_LIGHT  = [238, 242, 255];

export function useExport() {

  // ─── EXCEL ──────────────────────────────────────────────────────
  // sheets: [{ name, columns: [{key, label}], rows: [...], totals?: {...} }]
  async function exportExcel(sheets, filename = "reporte") {
    const wb = new ExcelJS.Workbook();
    wb.creator  = "Delasoft";
    wb.created  = new Date();

    for (const { name, columns, rows, totals } of sheets) {
      const ws = wb.addWorksheet(name.slice(0, 31));

      // Definir columnas con ancho automático
      ws.columns = columns.map((c) => {
        const maxLen = Math.max(
          c.label.length,
          ...rows.map((r) => String(r[c.key] ?? "").length)
        );
        return { header: c.label, key: c.key, width: Math.min(maxLen + 2, 40) };
      });

      // Estilo de cabecera
      ws.getRow(1).eachCell((cell) => {
        cell.font      = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      // Filas de datos
      rows.forEach((r) => {
        const rowData = {};
        columns.forEach((c) => {
          const v = r[c.key];
          rowData[c.key] = v == null ? "—" : c.format ? c.format(v, "raw") : v;
        });
        ws.addRow(rowData);
      });

      // Fila de totales opcional
      if (totals) {
        const totalsRow = ws.addRow(
          columns.reduce((acc, c) => {
            acc[c.key] = totals[c.key] ?? "";
            return acc;
          }, {})
        );
        totalsRow.font = { bold: true };
      }

      // Freeze primera fila
      ws.views = [{ state: "frozen", ySplit: 1 }];
    }

    const date   = new Date().toISOString().split("T")[0];
    const buffer = await wb.xlsx.writeBuffer();
    const blob   = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href  = url;
    link.download = `${filename}_${date}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ─── PDF ─────────────────────────────────────────────────────────
  // sections: [{ subtitle?, columns: [{header, dataKey, align?, format?}], rows, totals? }]
  function exportPDF(title, subtitle, sections, filename = "reporte") {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();

    doc.setFillColor(...BRAND_INDIGO);
    doc.rect(0, 0, W, 20, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DELASOFT", 14, 9);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(title, 14, 16);

    doc.setFontSize(8);
    doc.text(
      `${subtitle}  ·  Generado: ${new Date().toLocaleString("es-CO")}`,
      W - 14, 16, { align: "right" }
    );

    let y = 26;

    sections.forEach(({ subtitle: sec, columns, rows, totals }, si) => {
      if (sec) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...BRAND_INDIGO);
        doc.text(sec.toUpperCase(), 14, y);
        y += 5;
      }

      const body = rows.map((r) =>
        columns.map((c) => {
          const v = r[c.dataKey];
          if (v == null) return "—";
          return c.format ? c.format(v) : String(v);
        })
      );

      if (totals) {
        body.push(
          columns.map((c) =>
            totals[c.dataKey] !== undefined
              ? { content: totals[c.dataKey], styles: { fontStyle: "bold" } }
              : ""
          )
        );
      }

      autoTable(doc, {
        startY: y,
        head: [columns.map((c) => c.header)],
        body,
        styles: {
          fontSize: 7.5,
          cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
          font: "helvetica",
          textColor: [40, 40, 60],
        },
        headStyles: {
          fillColor: BRAND_INDIGO,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7,
          halign: "center",
        },
        columnStyles: columns.reduce((acc, c, i) => {
          acc[i] = { halign: c.align ?? "left" };
          return acc;
        }, {}),
        alternateRowStyles: { fillColor: BRAND_LIGHT },
        margin: { left: 14, right: 14 },
        tableLineColor: [220, 220, 235],
        tableLineWidth: 0.1,
        didDrawPage: (d) => {
          const pg    = doc.internal.getCurrentPageInfo().pageNumber;
          const total = doc.internal.getNumberOfPages();
          doc.setFontSize(6.5);
          doc.setTextColor(160, 160, 180);
          doc.setFont("helvetica", "normal");
          doc.text(
            `Delasoft  ·  ${title}  ·  Página ${pg} de ${total}`,
            W / 2, doc.internal.pageSize.getHeight() - 6,
            { align: "center" }
          );
        },
      });

      y = doc.lastAutoTable.finalY + (si < sections.length - 1 ? 10 : 0);

      if (si < sections.length - 1 && y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 14;
      }
    });

    const date = new Date().toISOString().split("T")[0];
    doc.save(`${filename}_${date}.pdf`);
  }

  return { exportExcel, exportPDF };
}
