import { supabase } from './supabaseClient'

export async function logAffiliateClick(params: {
  userId: string
  product: string
  provider: string
  affiliateUrl: string
}) {
  const { error } = await supabase.from('affiliate_clicks').insert({
    user_id: params.userId,
    product: params.product,
    provider: params.provider,
    affiliate_url: params.affiliateUrl,
  })
  if (error) throw error
}
