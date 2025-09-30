import { useEffect, useState } from 'react'
import { fetchHistory } from '../lib/history'
import { supabase } from '../lib/supabaseClient'

export default function History() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const data = await fetchHistory(user.id)
        setRows(data)
      }
      setLoading(false)
    })()
  }, [])

  if (loading) return <p>Cargando…</p>

  return (
    <div className="card">
      <h2>Historial de precios</h2>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Producto</th>
            <th>Proveedor</th>
            <th>Total (unidad)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{new Date(r.captured_at).toLocaleString()}</td>
              <td style={{ textTransform: 'capitalize' }}>{r.product}</td>
              <td>{r.provider}</td>
              <td>${Number(r.total_unit).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
