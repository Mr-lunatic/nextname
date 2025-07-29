import { NextRequest, NextResponse } from 'next/server'

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge'

// Batch analytics endpoint for performance metrics - Simple implementation
export async function POST(request: NextRequest) {
  try {
    // Parse the request body safely
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.warn('Failed to parse batch request body:', parseError)
      body = {}
    }

    // Log the batch metrics for debugging (in development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Batch Performance Metrics:', {
        url: body.url || 'unknown',
        metricsCount: body.metrics ? Object.keys(body.metrics).length : 0,
        userAgent: body.userAgent ? body.userAgent.substring(0, 50) + '...' : 'unknown',
        timestamp: body.timestamp || new Date().toISOString()
      })
    }

    // Simple acknowledgment without database storage
    // In production, you would store this in your analytics database
    const metricsCount = body.metrics ? Object.keys(body.metrics).length : 0

    return NextResponse.json({
      success: true,
      message: 'Batch metrics received and logged',
      timestamp: new Date().toISOString(),
      metricsCount,
      processed: true
    }, { status: 200 })

  } catch (error) {
    // Log error but don't expose details in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Error processing batch metrics:', error)
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process batch metrics',
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
    endpoint: 'analytics/batch',
    message: 'Batch analytics endpoint is running',
    timestamp: new Date().toISOString()
  })
}
