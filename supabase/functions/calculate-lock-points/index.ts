import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userAddress, lockIndex, tokenAddress, tokenAmount, tokenDecimals, durationInSeconds } = await req.json()

    console.log('Calculating points for lock:', { userAddress, lockIndex, tokenAddress, tokenAmount, durationInSeconds })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Calculate duration in days
    const durationInDays = Math.floor(durationInSeconds / 86400)

    // Get token price from CoinGecko (PulseChain tokens)
    let usdValue = 0
    let tokenPriceUsd = 0

    try {
      // Try to get price from CoinGecko (for PulseChain, we'll need to use contract address)
      const priceResponse = await fetch(
        `https://api.coingecko.com/api/v3/simple/token_price/pulsechain?contract_addresses=${tokenAddress}&vs_currencies=usd`
      )
      
      if (priceResponse.ok) {
        const priceData = await priceResponse.json()
        tokenPriceUsd = priceData[tokenAddress.toLowerCase()]?.usd || 0
      }
    } catch (error) {
      console.log('Could not fetch token price from CoinGecko:', error)
      // If we can't get the price, we'll use a base calculation
      tokenPriceUsd = 0
    }

    // Calculate USD value
    const tokenAmountDecimal = Number(tokenAmount) / Math.pow(10, tokenDecimals)
    usdValue = tokenAmountDecimal * tokenPriceUsd

    // Calculate points
    // Formula: (USD value) * (duration_in_days / 30) * 100
    // If we don't have USD value, use token amount directly with lower multiplier
    let pointsEarned = 0
    
    if (usdValue > 0) {
      // Points based on USD value
      pointsEarned = usdValue * (durationInDays / 30) * 100
    } else {
      // Fallback: Points based on token amount (much lower multiplier)
      pointsEarned = tokenAmountDecimal * (durationInDays / 30) * 0.1
    }

    // Round points to 2 decimal places
    pointsEarned = Math.round(pointsEarned * 100) / 100

    console.log('Points calculated:', { usdValue, durationInDays, pointsEarned })

    // Insert or update lock_points
    const { error: lockPointsError } = await supabase
      .from('lock_points')
      .upsert({
        user_address: userAddress.toLowerCase(),
        lock_index: lockIndex,
        token_address: tokenAddress.toLowerCase(),
        token_amount: tokenAmount,
        token_decimals: tokenDecimals,
        lock_duration_days: durationInDays,
        usd_value: usdValue,
        points_earned: pointsEarned
      })

    if (lockPointsError) {
      console.error('Error inserting lock points:', lockPointsError)
      throw lockPointsError
    }

    // Update user's total points
    // First check if user exists
    const { data: existingUser } = await supabase
      .from('user_points')
      .select('total_points')
      .eq('user_address', userAddress.toLowerCase())
      .single()

    if (existingUser) {
      // Update existing user points
      const newTotal = Number(existingUser.total_points) + pointsEarned
      const { error: updateError } = await supabase
        .from('user_points')
        .update({ total_points: newTotal })
        .eq('user_address', userAddress.toLowerCase())

      if (updateError) {
        console.error('Error updating user points:', updateError)
        throw updateError
      }
    } else {
      // Insert new user points
      const { error: insertError } = await supabase
        .from('user_points')
        .insert({
          user_address: userAddress.toLowerCase(),
          total_points: pointsEarned
        })

      if (insertError) {
        console.error('Error inserting user points:', insertError)
        throw insertError
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        pointsEarned,
        usdValue,
        durationInDays
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in calculate-lock-points:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})