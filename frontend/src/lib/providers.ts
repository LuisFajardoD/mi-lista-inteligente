// Definición del tipo de oferta con soporte para afiliados
export type Offer = {
  provider: 'Amazon' | 'Walmart' | 'MercadoLibre'
  name: string
  price: number
  shipping: number
  available: boolean
  prevTotal?: number   // para detectar baja de precio
  affiliateUrl?: string // para enlaces de afiliado
}

// Catálogo simulado de productos
const catalog: Record<string, Omit<Offer, 'affiliateUrl'>[]> = {
  'cuaderno profesional': [
    { provider: 'Amazon',       name: 'Cuaderno profesional', price: 45,  shipping: 79,  available: true,  prevTotal: 140 },
    { provider: 'Walmart',      name: 'Cuaderno profesional', price: 42,  shipping: 89,  available: true,  prevTotal: 145 },
    { provider: 'MercadoLibre', name: 'Cuaderno profesional', price: 39,  shipping: 99,  available: true,  prevTotal: 150 },
  ],
  'lapiz hb': [
    { provider: 'Amazon',       name: 'Lápiz HB',             price: 6,   shipping: 69,  available: true,  prevTotal: 78 },
    { provider: 'Walmart',      name: 'Lápiz HB',             price: 5.5, shipping: 89,  available: true,  prevTotal: 85 },
    { provider: 'MercadoLibre', name: 'Lápiz HB',             price: 5.9, shipping: 99,  available: true,  prevTotal: 92 },
  ],
  'tijeras escolares': [
    { provider: 'Amazon',       name: 'Tijeras escolares',    price: 55,  shipping: 69,  available: false, prevTotal: 128 },
    { provider: 'Walmart',      name: 'Tijeras escolares',    price: 59,  shipping: 89,  available: true,  prevTotal: 160 },
    { provider: 'MercadoLibre', name: 'Tijeras escolares',    price: 49,  shipping: 99,  available: true,  prevTotal: 152 },
  ],
}

// Normalizador de términos de búsqueda
function norm(s: string) {
  return (s || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Enlaces base de afiliados por proveedor
const affiliateBases: Record<string, string> = {
  'Amazon': 'https://amazon.com/dp/XYZ?tag=',
  'Walmart': 'https://walmart.com/ip/XYZ?affid=',
  'MercadoLibre': 'https://mercadolibre.com.mx/item/XYZ?sid=',
}

// Busca ofertas de un producto en el catálogo simulado
export async function searchOffers(term: string, userId?: string): Promise<Offer[]> {
  const key = norm(term)
  await new Promise((r) => setTimeout(r, 250))
  const offers = catalog[key] ?? []

  // Agregar URL de afiliado única si hay userId
  return offers.map(o => ({
    ...o,
    affiliateUrl: userId ? `${affiliateBases[o.provider]}${userId}` : undefined
  }))
}

// Devuelve la mejor oferta por precio total (precio + envío)
export function bestOffer(offers: Offer[]) {
  return offers.slice().sort((a, b) => (a.price + a.shipping) - (b.price + b.shipping))[0]
}
