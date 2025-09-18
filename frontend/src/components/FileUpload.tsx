import { useRef } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { RawItem } from '../types'

type Props = {
  onLoaded: (items: RawItem[]) => void
}

export default function FileUpload({ onLoaded }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null)

  const handleFile = async (file: File) => {
    const ext = file.name.toLowerCase().split('.').pop()
    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          const rows = (res.data as any[]).map(r => normalizeRow(r))
          onLoaded(rows)
        }
      })
    } else if (ext === 'xlsx' || ext === 'xls') {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf)
      const first = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<any>(first, { defval: '' })
      const rows = json.map(r => normalizeRow(r))
      onLoaded(rows)
    } else {
      alert('Formato no soportado. Usa CSV o XLSX.')
    }
  }

  const normalizeRow = (r: any): RawItem => ({
    name: (r.name || r.Nombre || r.Producto || '').toString().trim(),
    quantity: Number(r.quantity || r.Cantidad || 1) || 1,
    sku: (r.sku || r.SKU || '').toString().trim() || undefined,
    unit: (r.unit || r.Unidad || '').toString().trim() || undefined,
  })

  return (
    <div className="card">
      <h3>1) Subir lista (CSV/XLSX)</h3>
      <input
        ref={fileRef}
        type="file"
        accept=".csv, .xlsx, .xls"
        onChange={(e)=>{
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />
      <p className="muted">Columnas recomendadas: <code>name, quantity, sku, unit</code> (acepta equivalentes en español).</p>
    </div>
  )
}
