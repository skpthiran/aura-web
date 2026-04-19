import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req) => {
  // Verify the request is authorized
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    // Expire old moments
    const { data, error } = await supabase
      .from('moments')
      .update({ is_active: false })
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true)
      .select('id, title')

    if (error) throw error

    const expiredCount = data?.length ?? 0
    
    console.log(`Expired ${expiredCount} moments`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        expired: expiredCount,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (err) {
    console.error('Error expiring moments:', err)
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500 }
    )
  }
})
