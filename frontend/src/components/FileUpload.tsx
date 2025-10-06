import { useRef } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { RawItem } from '../types'

type Props = {
  onLoaded: (items: RawItem[]) => void
}

export default function FileUpload({ onLoaded }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null)

  // Alias de encabezados aceptados -> clave normalizada
  const HEADER_ALIASES: Record<string, 'name' | 'quantity' | 'sku' | 'unit'> = {
    // nombre / producto
    nombre: 'name',
    producto: 'name',
    articulo: 'name',
    'artículo': 'name',
    name: 'name',

    // cantidad
    cantidad: 'quantity',
    qty: 'quantity',
    quantity: 'quantity',

    // sku / código
    sku: 'sku',
    codigo: 'sku',
    'código': 'sku',

    // unidad
    unidad: 'unit',
    unit: 'unit',
    u: 'unit',
  }

  // Normaliza texto de encabezado (tildes, mayúsculas, espacios)
  function normalizeHeader(h: string) {
    const k = (h || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim()
    return HEADER_ALIASES[k] ?? (k as any)
  }

  // Convierte cualquier valor a número (para cantidad)
  function toNumber(v: any, def = 1): number {
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
    return Number.isFinite(n) ? n : def
  }

  // Normaliza un registro crudo a RawItem usando los alias de encabezados
  function normalizeRow(row: any): RawItem {
    const byCanonical: Partial<Record<'name' | 'quantity' | 'sku' | 'unit', any>> = {}
    for (const [key, value] of Object.entries(row)) {
      const canon = normalizeHeader(key)
      if (canon === 'name' || canon === 'quantity' || canon === 'sku' || canon === 'unit') {
        // solo toma el primero que aparezca para evitar sobrescrituras
        if (byCanonical[canon] == null) byCanonical[canon] = value
      }
    }

    const name = (byCanonical.name ?? '').toString().trim()
    const quantity = toNumber(byCanonical.quantity ?? 1, 1)
    const skuRaw = (byCanonical.sku ?? '').toString().trim()
    const unitRaw = (byCanonical.unit ?? '').toString().trim()

    return {
      name,
      quantity,
      sku: skuRaw || undefined,
      unit: unitRaw || undefined,
    }
  }

  const handleFile = async (file: File) => {
    const ext = file.name.toLowerCase().split('.').pop()
    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          const rows = (res.data as any[]).map((r) => normalizeRow(r))
          onLoaded(rows)
        },
        error: () => alert('No se pudo leer el archivo CSV.'),
      })
    } else if (ext === 'xlsx' || ext === 'xls') {
      try {
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf)
        const first = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json<any>(first, { defval: '' })
        const rows = json.map((r) => normalizeRow(r))
        onLoaded(rows)
      } catch {
        alert('No se pudo leer el archivo Excel.')
      }
    } else {
      alert('Formato no soportado. Usa CSV o XLSX.')
    }
  }

  return (
    <div className="card">
      <h3>1) Subir lista (CSV/XLSX)</h3>
      <input
        ref={fileRef}
        type="file"
        accept=".csv, .xlsx, .xls"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />
      <p className="muted">
        Columnas recomendadas: <strong>nombre</strong>, <strong>cantidad</strong>, <strong>sku</strong>, <strong>unidad</strong> (acepta equivalentes en español o inglés).
      </p>
    </div>
  )
}
