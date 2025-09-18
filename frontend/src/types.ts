export type RawItem = {
  name: string
  quantity?: number
  sku?: string
  unit?: string
}

export type UnifiedItem = {
  key: string
  name: string
  quantity: number
  sku?: string
  unit?: string
  sources: number // how many rows merged
}
