import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge';

export const GET = withAdminAuth(async (request: NextRequest, context: any) => {
  try {
    console.log('🧪 Test admin endpoint called');
    console.log('Context type:', typeof context);
    console.log('Context keys:', context ? Object.keys(context) : 'no context');
    console.log('Full context:', JSON.stringify(context, null, 2));

    // Try multiple ways to access bindings
    const possibleEnvs = [
      context?.env,
      context?.cloudflare?.env,
      context?.bindings,
      context,
      (globalThis as any).env,
      process.env
    ].filter(Boolean);

    console.log('Possible env sources:', possibleEnvs.length);

    let d1Binding = null;
    let kvBinding = null;

    // Try different binding access patterns
    for (const env of possibleEnvs) {
      if (env) {
        console.log('Checking env source:', Object.keys(env));

        // Try different D1 binding names
        d1Binding = d1Binding || env.PRICING_DB || env['domain-pricing-db'] || env.DB || env.D1;

        // Try different KV binding names
        kvBinding = kvBinding || env.PRICING_CACHE || env.PRICINGCACHE || env.KV || env.CACHE;

        if (d1Binding || kvBinding) {
          console.log('Found bindings in env source:', Object.keys(env));
          break;
        }
      }
    }

    const hasD1 = !!d1Binding;
    const hasKV = !!kvBinding;

    console.log('D1 binding found:', hasD1, d1Binding ? 'available' : 'not found');
    console.log('KV binding found:', hasKV, kvBinding ? 'available' : 'not found');
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      context: {
        available: !!context,
        type: typeof context,
        keys: context ? Object.keys(context) : [],
        fullContext: context
      },
      environment: {
        possibleEnvSources: possibleEnvs.length,
        envKeys: possibleEnvs.map(env => env ? Object.keys(env) : []),
        hasD1,
        hasKV
      },
      bindings: {
        PRICING_DB: hasD1 ? 'available' : 'not found',
        PRICING_CACHE: hasKV ? 'available' : 'not found',
        d1BindingType: d1Binding ? typeof d1Binding : 'undefined',
        kvBindingType: kvBinding ? typeof kvBinding : 'undefined'
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
