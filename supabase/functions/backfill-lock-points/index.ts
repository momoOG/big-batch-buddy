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
    console.log('🔄 Starting backfill process...')

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Initialize viem public client for PulseChain
    const publicClient = createPublicClient({
      transport: http('https://rpc.pulsechain.com'),
    })

    // Fetch all TokensLocked events from blockchain
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

    // Get unique users
    const uniqueUsers = Array.from(
      new Set(logs.map((log) => log.args.user as string))
    )

    console.log(`👥 Processing ${uniqueUsers.length} unique users...`)

    let processedCount = 0
    let skippedCount = 0
    let errorCount = 0

    // Process each user's locks
    for (const userAddress of uniqueUsers) {
      try {
        // Get user's lock count
        const lockCount = (await publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: TOKEN_LOCKER_ABI,
          functionName: 'getUserLockCount',
          args: [userAddress as `0x${string}`],
        })) as bigint

        console.log(`  👤 User ${userAddress}: ${lockCount} locks`)

        // Process each lock
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
              console.log(`    ⏭️  Lock #${lockIndex} already has points, skipping`)
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

            // Get token symbol for CoinGecko lookup
            let symbol = ''
            try {
              symbol = (await publicClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'symbol',
              })) as string
            } catch (e) {
              console.log(`    ⚠️  Could not get symbol for token ${tokenAddress}`)
            }

            // Calculate lock duration in days
            const now = Math.floor(Date.now() / 1000)
            const lockCreatedAt = Number(unlockTime) - (30 * 24 * 60 * 60) // Estimate created_at
            const durationSeconds = Number(unlockTime) - lockCreatedAt
            const durationDays = durationSeconds / (24 * 60 * 60)

            // Try to get USD price from CoinGecko
            let usdValue = 0
            let tokenAmountDecimal = 0

            try {
              const tokenAmount = formatUnits(amount, decimals)
              tokenAmountDecimal = parseFloat(tokenAmount)

              // Try to fetch price from CoinGecko
              if (symbol) {
                const priceResponse = await fetch(
                  `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`,
                  { headers: { 'Accept': 'application/json' } }
                )
                
                if (priceResponse.ok) {
                  const priceData = await priceResponse.json()
                  const price = priceData[symbol.toLowerCase()]?.usd || 0
                  usdValue = tokenAmountDecimal * price
                }
              }
            } catch (e) {
              console.log(`    ⚠️  Could not fetch price for ${symbol}`)
            }

            // Calculate points: (USD value) * (duration_in_days / 30) * 100
            const pointsEarned = usdValue * (durationDays / 30) * 100

            console.log(`    💎 Lock #${lockIndex}: ${tokenAmountDecimal} tokens, $${usdValue.toFixed(2)}, ${durationDays.toFixed(1)} days = ${pointsEarned.toFixed(2)} points`)

            // Insert lock points
            const { error: lockPointsError } = await supabase
              .from('lock_points')
              .insert({
                user_address: userAddress.toLowerCase(),
                token_address: tokenAddress.toLowerCase(),
                lock_index: lockIndex,
                token_amount: tokenAmountDecimal.toString(),
                token_decimals: decimals,
                lock_duration_days: Math.floor(durationDays),
                usd_value: usdValue.toFixed(2),
                points_earned: pointsEarned.toFixed(2),
              })

            if (lockPointsError) {
              console.error(`    ❌ Error inserting lock points:`, lockPointsError)
              errorCount++
              continue
            }

            // Update or insert user total points
            const { data: existingUserPoints } = await supabase
              .from('user_points')
              .select('total_points')
              .eq('user_address', userAddress.toLowerCase())
              .maybeSingle()

            if (existingUserPoints) {
              // Update existing
              const newTotal = parseFloat(existingUserPoints.total_points) + pointsEarned
              await supabase
                .from('user_points')
                .update({ total_points: newTotal.toFixed(2) })
                .eq('user_address', userAddress.toLowerCase())
            } else {
              // Insert new
              await supabase
                .from('user_points')
                .insert({
                  user_address: userAddress.toLowerCase(),
                  total_points: pointsEarned.toFixed(2),
                })
            }

            processedCount++
            console.log(`    ✅ Points awarded successfully`)

          } catch (lockError) {
            console.error(`    ❌ Error processing lock #${lockIndex}:`, lockError)
            errorCount++
          }
        }
      } catch (userError) {
        console.error(`  ❌ Error processing user ${userAddress}:`, userError)
        errorCount++
      }
    }

    const result = {
      success: true,
      message: 'Backfill completed',
      stats: {
        totalUsers: uniqueUsers.length,
        totalEvents: logs.length,
        processed: processedCount,
        skipped: skippedCount,
        errors: errorCount,
      },
    }

    console.log('✅ Backfill complete:', result)

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
