import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { createPublicClient, http, formatUnits } from 'https://esm.sh/viem@2.9.31'

const CONTRACT_ADDRESS = '0x11D422b5467e430B0afA97858b47b0bD2661f12a'

const TOKEN_LOCKER_ABI = [
  {
    type: 'event',
    name: 'TokensLocked',
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'token', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'unlockTime', type: 'uint256' },
    ],
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserLockCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    name: 'getLock',
    outputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'unlockTime', type: 'uint256' },
      { name: 'claimed', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const ERC20_ABI = [
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔄 Starting historical locks sync...')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const publicClient = createPublicClient({
      transport: http('https://rpc.pulsechain.com'),
    })

    // Fetch all TokensLocked events
    console.log('📡 Fetching events from blockchain...')
    const logs = await publicClient.getLogs({
      address: CONTRACT_ADDRESS as `0x${string}`,
      event: {
        type: 'event',
        name: 'TokensLocked',
        inputs: [
          { indexed: true, name: 'user', type: 'address' },
          { indexed: true, name: 'token', type: 'address' },
          { indexed: false, name: 'amount', type: 'uint256' },
          { indexed: false, name: 'unlockTime', type: 'uint256' },
        ],
      },
      fromBlock: 0n,
      toBlock: 'latest',
    })

    console.log(`📊 Found ${logs.length} lock events`)

    const uniqueUsers = Array.from(
      new Set(logs.map((log) => log.args.user as string))
    )

    console.log(`👥 Processing ${uniqueUsers.length} unique users...`)

    let processedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const userAddress of uniqueUsers) {
      try {
        const lockCount = (await publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: TOKEN_LOCKER_ABI,
          functionName: 'getUserLockCount',
          args: [userAddress as `0x${string}`],
        })) as bigint

        for (let lockIndex = 0; lockIndex < Number(lockCount); lockIndex++) {
          try {
            // Check if this lock already has points
            const { data: existingPoints } = await supabase
              .from('lock_points')
              .select('id')
              .eq('user_address', userAddress.toLowerCase())
              .eq('lock_index', lockIndex)
              .maybeSingle()

            if (existingPoints) {
              skippedCount++
              continue
            }

            // Get lock details
            const [tokenAddress, amount, unlockTime, claimed] = (await publicClient.readContract({
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi: TOKEN_LOCKER_ABI,
              functionName: 'getLock',
              args: [userAddress as `0x${string}`, BigInt(lockIndex)],
            })) as [string, bigint, bigint, boolean]

            // Get token decimals
            const decimals = (await publicClient.readContract({
              address: tokenAddress as `0x${string}`,
              abi: ERC20_ABI,
              functionName: 'decimals',
            })) as number

            // Calculate lock duration
            const now = Math.floor(Date.now() / 1000)
            const unlockTimeSeconds = Number(unlockTime)
            
            // Estimate when lock was created (assuming some time has passed)
            // We'll estimate it was created at least 30 days ago or at current time minus unlock time
            const estimatedCreatedAt = unlockTimeSeconds - (30 * 24 * 60 * 60)
            const durationSeconds = unlockTimeSeconds - estimatedCreatedAt
            const durationDays = Math.max(1, Math.floor(durationSeconds / (24 * 60 * 60)))

            // Get token price (try CoinGecko)
            let usdValue = 0
            const tokenAmount = formatUnits(amount, decimals)
            const tokenAmountDecimal = parseFloat(tokenAmount)

            try {
              const priceResponse = await fetch(
                `https://api.coingecko.com/api/v3/simple/token_price/pulsechain?contract_addresses=${tokenAddress}&vs_currencies=usd`,
                { headers: { 'Accept': 'application/json' } }
              )
              
              if (priceResponse.ok) {
                const priceData = await priceResponse.json()
                const price = priceData[tokenAddress.toLowerCase()]?.usd || 0
                usdValue = tokenAmountDecimal * price
              }
            } catch (e) {
              console.log(`⚠️  Could not fetch price for ${tokenAddress}`)
            }

            // Calculate points
            let pointsEarned = 0
            if (usdValue > 0) {
              pointsEarned = usdValue * (durationDays / 30) * 100
            } else {
              pointsEarned = tokenAmountDecimal * (durationDays / 30) * 0.1
            }

            console.log(`💎 Lock #${lockIndex} for ${userAddress}: ${pointsEarned.toFixed(2)} points`)

            // Insert lock points
            const { error: lockPointsError } = await supabase
              .from('lock_points')
              .insert({
                user_address: userAddress.toLowerCase(),
                token_address: tokenAddress.toLowerCase(),
                lock_index: lockIndex,
                token_amount: tokenAmountDecimal.toString(),
                token_decimals: decimals,
                lock_duration_days: durationDays,
                usd_value: usdValue.toFixed(2),
                points_earned: pointsEarned.toFixed(2),
              })

            if (lockPointsError) {
              console.error(`❌ Error inserting lock points:`, lockPointsError)
              errorCount++
              continue
            }

            // Update user total points
            const { data: existingUserPoints } = await supabase
              .from('user_points')
              .select('total_points')
              .eq('user_address', userAddress.toLowerCase())
              .maybeSingle()

            if (existingUserPoints) {
              const newTotal = parseFloat(existingUserPoints.total_points) + pointsEarned
              await supabase
                .from('user_points')
                .update({ total_points: newTotal.toFixed(2) })
                .eq('user_address', userAddress.toLowerCase())
            } else {
              await supabase
                .from('user_points')
                .insert({
                  user_address: userAddress.toLowerCase(),
                  total_points: pointsEarned.toFixed(2),
                })
            }

            processedCount++
          } catch (lockError) {
            console.error(`❌ Error processing lock #${lockIndex}:`, lockError)
            errorCount++
          }
        }
      } catch (userError) {
        console.error(`❌ Error processing user ${userAddress}:`, userError)
        errorCount++
      }
    }

    const result = {
      success: true,
      message: 'Historical sync completed',
      stats: {
        totalUsers: uniqueUsers.length,
        totalEvents: logs.length,
        processed: processedCount,
        skipped: skippedCount,
        errors: errorCount,
      },
    }

    console.log('✅ Sync complete:', result)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('❌ Fatal error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
