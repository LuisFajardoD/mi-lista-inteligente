import { useMemo, useState } from 'react'
import FileUpload from '../components/FileUpload'
import ListTable from '../components/ListTable'
import type { RawItem, UnifiedItem } from '../types'

export default function UploadList() {
  const [items, setItems] = useState<RawItem[]>([])

  const unified: UnifiedItem[] = useMemo(()=> unify(items), [items])

  return (
    <div>
      <FileUpload onLoaded={setItems} />
      <div className="card">
        <h3>2) Previsualización de la lista cargada</h3>
        <p className="muted">Filas: {items.length}</p>
      </div>
      <ListTable data={unified} />
    </div>
  )
}

function unify(items: RawItem[]): UnifiedItem[] {
  const map = new Map<string, UnifiedItem>()
  for (const r of items) {
    const key = r.sku?.trim() ? ('sku:' + r.sku.trim().toLowerCase()) : ('name:' + normalize(r.name))
    const prev = map.get(key)
    if (prev) {
      prev.quantity += (r.quantity || 1)
      prev.sources += 1
    } else {
      map.set(key, {
        key,
        name: r.name,
        quantity: r.quantity || 1,
        sku: r.sku,
        unit: r.unit,
        sources: 1
      })
    }
  }
  return Array.from(map.values()).sort((a,b)=> a.name.localeCompare(b.name))
}

function normalize(s: string) {
  return (s || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
