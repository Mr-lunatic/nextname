import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge';

export const GET = withAdminAuth(async (request: NextRequest, context: any) => {
  try {
    console.log('🧪 Test admin endpoint called');
    console.log('Context type:', typeof context);
    console.log('Context keys:', context ? Object.keys(context) : 'no context');
    
    // Try to access environment variables
    const env = context?.env || context || {};
    console.log('Env keys:', Object.keys(env));
    
    // Check for Cloudflare bindings
    const hasD1 = !!(env?.PRICING_DB || (globalThis as any).PRICING_DB);
    const hasKV = !!(env?.PRICING_CACHE || (globalThis as any).PRICING_CACHE);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      context: {
        available: !!context,
        type: typeof context,
        keys: context ? Object.keys(context) : []
      },
      environment: {
        keys: Object.keys(env),
        hasD1,
        hasKV
      },
      bindings: {
        PRICING_DB: hasD1 ? 'available' : 'not found',
        PRICING_CACHE: hasKV ? 'available' : 'not found'
      },
      runtime: 'edge',
      message: 'Admin test endpoint working correctly'
    });
    
  } catch (error) {
    console.error('Test admin endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});
