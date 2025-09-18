import type { UnifiedItem } from '../types'

export default function ListTable({ data }: { data: UnifiedItem[] }) {
  return (
    <div className="card">
      <h3>3) Lista unificada</h3>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>SKU</th>
            <th>Cantidad total</th>
            <th>Unidad</th>
            <th>Filas unificadas</th>
          </tr>
        </thead>
        <tbody>
          {data.map((i) => (
            <tr key={i.key}>
              <td>{i.name}</td>
              <td>{i.sku ?? '—'}</td>
              <td>{i.quantity}</td>
              <td>{i.unit ?? '—'}</td>
              <td>{i.sources}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
