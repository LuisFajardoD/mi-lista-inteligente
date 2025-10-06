// frontend/src/lib/pdf.ts
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export type PdfRow = {
  product: string
  provider: string
  unit: number    // precio + envío
  qty: number
  line: number    // unit * qty
  available: boolean
}

function money(n: number) {
  return `$${n.toFixed(2)}`
}
function cap(s: string) {
  return (s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

export function downloadComparePdf(params: {
  title: string
  rows: PdfRow[]
  grandTotal: number
}) {
  const { title, rows, grandTotal } = params

  const doc = new jsPDF('p', 'pt', 'a4')

  // Título
  doc.setFontSize(14)
  doc.text(title, 40, 40)

  // Tabla
  autoTable(doc, {
    startY: 60,
    head: [['Producto', 'Proveedor', 'Total (unidad)', 'Cantidad', 'Total (línea)', 'Disp.']],
    body: rows.map(r => [
      cap(r.product),
      r.provider,
      money(r.unit),
      String(r.qty),
      money(r.line),
      r.available ? 'Sí' : 'No',
    ]),
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [30, 41, 59] },       // tono oscuro
    alternateRowStyles: { fillColor: [245, 247, 250] },
  })

  const y = (doc as any).lastAutoTable?.finalY ?? 60
  doc.setFontSize(12)
  doc.text(`Total del carrito: ${money(grandTotal)}`, 40, y + 24)

  doc.save('comparativo.pdf')
}
