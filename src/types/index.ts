export interface DomainQuery {
  id: string
  query_type: 'domain' | 'prefix' | 'suffix'
  query_text: string
  results: any
  created_at: string
  updated_at: string
}

export interface PriceInfo {
  registrar: string
  domain: string
  new_price: number
  renew_price: number
  transfer_price: number
  currency: string
  has_promo: boolean
}

export interface WhoisInfo {
  domain: string
  is_available: boolean
  registrar?: string
  created_date?: string
  expiry_date?: string
  status?: string[]
  name_servers?: string[]
}

export interface TLD {
  id: string
  extension: string
  type: 'gTLD' | 'ccTLD' | 'new'
  description: string
  restrictions?: string
  is_active: boolean
}

export interface Registrar {
  id: string
  code: string
  name: string
  website: string
  description: string
  is_active: boolean
}