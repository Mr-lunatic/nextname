import { NextRequest, NextResponse } from 'next/server'

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge'

// Web Vitals analytics endpoint - Simple implementation without database
export async function POST(request: NextRequest) {
  try {
    // Parse the request body safely
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.warn('Failed to parse request body:', parseError)
      body = {}
    }

    // Log the vitals data for debugging (in development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Web Vitals received:', {
        metric: body.metric || 'unknown',
        value: body.value || 0,
        rating: body.rating || 'unknown',
        url: body.url || 'unknown',
        timestamp: body.timestamp || new Date().toISOString()
      })
    }

    // Simple acknowledgment without database storage
    // In production, you would store this in your analytics database
    return NextResponse.json({
      success: true,
      message: 'Vitals data received and logged',
      timestamp: new Date().toISOString(),
      processed: true
    }, { status: 200 })

  } catch (error) {
    // Log error but don't expose details in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Error processing vitals data:', error)
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process vitals data',
        timestamp: new Date().toISOString()
      },
      { status: 200 } // Return 200 to prevent client retries
    )
  }
}

// Handle GET requests (for health checks)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'analytics/vitals',
    message: 'Web Vitals analytics endpoint is running',
    timestamp: new Date().toISOString()
  })
}
