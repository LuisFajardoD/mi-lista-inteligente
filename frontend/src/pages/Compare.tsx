import { useState } from 'react'
import { searchOffers, bestOffer, type Offer } from '../lib/providers'

type Row = {
  product: string
  quantity: number
  offers: Offer[]
  selected?: Offer
}

export default function Compare() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)

  const handleCompare = async () => {
    setLoading(true)
    // Lista de ejemplo
    const sample = [
      { product: 'cuaderno profesional', quantity: 3 },
      { product: 'lapiz hb', quantity: 5 },
      { product: 'tijeras escolares', quantity: 1 },
    ]

    const results: Row[] = []
    for (const item of sample) {
      const offers = await searchOffers(item.product)
      results.push({
        ...item,
        offers,
        selected: bestOffer(offers),
      })
    }
    setRows(results)
    setLoading(false)
  }

  return (
    <div className="card">
      <h2>Comparador de precios (Sprint 2)</h2>

      <button onClick={handleCompare} disabled={loading}>
        {loading ? 'Comparando…' : 'Ejecutar comparador'}
      </button>

      {rows.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Proveedor</th>
              <th>Precio</th>
              <th>Envío</th>
              <th>Total</th>
              <th>Disponible</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) =>
              r.offers.map((o) => {
                const total = (o.price + o.shipping) * r.quantity
                const isBest = r.selected?.provider === o.provider
                return (
                  <tr
                    key={r.product + o.provider}
                    style={{
                      background: isBest ? '#b2f2bb' : '',
                      color: isBest ? '#000' : '',
                      fontWeight: isBest ? 'bold' : 'normal',
                    }}
                  >
                    <td style={{ textTransform: 'capitalize' }}>{r.product}</td>
                    <td>
                      {o.provider} {isBest && <span style={{ marginLeft: 6 }}>⭐ Mejor opción</span>}
                    </td>
                    <td>${o.price.toFixed(2)}</td>
                    <td>${o.shipping.toFixed(2)}</td>
                    <td>${total.toFixed(2)}</td>
                    <td>{o.available ? 'Sí' : 'No'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
