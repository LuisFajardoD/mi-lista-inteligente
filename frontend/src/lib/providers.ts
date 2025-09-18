export type Offer = {
  provider: 'Amazon' | 'Walmart' | 'MercadoLibre'
  name: string
  price: number      // precio unitario
  shipping: number   // costo de envío
  available: boolean
}

const catalog: Record<string, Offer[]> = {
  'cuaderno profesional': [
    { provider: 'Amazon',       name: 'Cuaderno profesional', price: 45,  shipping: 79,  available: true },
    { provider: 'Walmart',      name: 'Cuaderno profesional', price: 42,  shipping: 89,  available: true },
    { provider: 'MercadoLibre', name: 'Cuaderno profesional', price: 39,  shipping: 99,  available: true },
  ],
  'lapiz hb': [
    { provider: 'Amazon',       name: 'Lápiz HB',             price: 6,   shipping: 69,  available: true },
    { provider: 'Walmart',      name: 'Lápiz HB',             price: 5.5, shipping: 89,  available: true },
    { provider: 'MercadoLibre', name: 'Lápiz HB',             price: 5.9, shipping: 99,  available: true },
  ],
  'tijeras escolares': [
    { provider: 'Amazon',       name: 'Tijeras escolares',    price: 55,  shipping: 69,  available: false },
    { provider: 'Walmart',      name: 'Tijeras escolares',    price: 59,  shipping: 89,  available: true },
    { provider: 'MercadoLibre', name: 'Tijeras escolares',    price: 49,  shipping: 99,  available: true },
  ],
}

function normalize(s: string) {
  return (s || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export async function searchOffers(term: string): Promise<Offer[]> {
  const key = normalize(term)
  await new Promise((r) => setTimeout(r, 300)) // simula latencia
  return catalog[key] ?? []
}

export function bestOffer(offers: Offer[]) {
  return offers.slice().sort((a, b) => (a.price + a.shipping) - (b.price + b.shipping))[0]
}
