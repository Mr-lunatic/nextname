import { NextRequest, NextResponse } from 'next/server';

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge';

// This endpoint doesn't require admin auth to help with debugging
export async function GET(request: NextRequest, context: any) {
  try {
    console.log('🔍 Binding test endpoint called');
    
    // Log everything we can about the context
    console.log('=== CONTEXT ANALYSIS ===');
    console.log('Context exists:', !!context);
    console.log('Context type:', typeof context);
    console.log('Context constructor:', context?.constructor?.name);
    
    if (context) {
      console.log('Context keys:', Object.keys(context));
      console.log('Context values:', Object.entries(context).map(([k, v]) => [k, typeof v]));
    }
    
    // Check for different possible binding locations
    const bindingLocations = [
      { name: 'context', obj: context },
      { name: 'context.env', obj: context?.env },
      { name: 'context.cloudflare', obj: context?.cloudflare },
      { name: 'context.cloudflare.env', obj: context?.cloudflare?.env },
      { name: 'context.bindings', obj: context?.bindings },
      { name: 'globalThis', obj: globalThis },
      { name: 'process.env', obj: process.env }
    ];
    
    const bindingAnalysis = bindingLocations.map(location => {
      const obj = location.obj;
      if (!obj) return { name: location.name, exists: false };
      
      const keys = Object.keys(obj);
      const d1Keys = keys.filter(k => k.includes('PRICING_DB') || k.includes('domain-pricing-db') || k.includes('DB') || k.includes('D1'));
      const kvKeys = keys.filter(k => k.includes('PRICING_CACHE') || k.includes('PRICINGCACHE') || k.includes('KV') || k.includes('CACHE'));
      
      return {
        name: location.name,
        exists: true,
        totalKeys: keys.length,
        allKeys: keys,
        d1Keys,
        kvKeys,
        hasD1: d1Keys.length > 0,
        hasKV: kvKeys.length > 0
      };
    });
    
    // Try to access specific bindings
    let foundBindings = {
      d1: null as any,
      kv: null as any
    };
    
    // Direct access attempts
    const directAccessAttempts = [
      () => context?.env?.PRICING_DB,
      () => context?.cloudflare?.env?.PRICING_DB,
      () => context?.PRICING_DB,
      () => (globalThis as any).PRICING_DB,
      () => context?.env?.['domain-pricing-db'],
      () => context?.['domain-pricing-db']
    ];
    
    for (let i = 0; i < directAccessAttempts.length; i++) {
      try {
        const result = directAccessAttempts[i]();
        if (result) {
          foundBindings.d1 = { method: i, type: typeof result, hasQuery: typeof result.prepare === 'function' };
          break;
        }
      } catch (e) {
        console.log(`D1 access attempt ${i} failed:`, e);
      }
    }
    
    const kvAccessAttempts = [
      () => context?.env?.PRICING_CACHE,
      () => context?.cloudflare?.env?.PRICING_CACHE,
      () => context?.PRICING_CACHE,
      () => (globalThis as any).PRICING_CACHE,
      () => context?.env?.PRICINGCACHE,
      () => context?.PRICINGCACHE
    ];
    
    for (let i = 0; i < kvAccessAttempts.length; i++) {
      try {
        const result = kvAccessAttempts[i]();
        if (result) {
          foundBindings.kv = { method: i, type: typeof result, hasGet: typeof result.get === 'function' };
          break;
        }
      } catch (e) {
        console.log(`KV access attempt ${i} failed:`, e);
      }
    }
    
    // Test if we can actually use the bindings
    let bindingTests = {
      d1Test: null as any,
      kvTest: null as any
    };
    
    if (foundBindings.d1) {
      try {
        // Try a simple query
        const db = foundBindings.d1;
        if (typeof db.prepare === 'function') {
          const stmt = db.prepare('SELECT 1 as test');
          const result = await stmt.first();
          bindingTests.d1Test = { success: true, result };
        }
      } catch (e) {
        bindingTests.d1Test = { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
      }
    }
    
    if (foundBindings.kv) {
      try {
        // Try a simple get operation
        const kv = foundBindings.kv;
        if (typeof kv.get === 'function') {
          const result = await kv.get('test-key');
          bindingTests.kvTest = { success: true, result: result || 'null' };
        }
      } catch (e) {
        bindingTests.kvTest = { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
      }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      analysis: {
        contextExists: !!context,
        contextType: typeof context,
        bindingLocations: bindingAnalysis,
        foundBindings,
        bindingTests
      },
      recommendations: [
        ...(foundBindings.d1 ? [] : ['D1 binding not found - check Cloudflare Pages D1 binding configuration']),
        ...(foundBindings.kv ? [] : ['KV binding not found - check Cloudflare Pages KV binding configuration']),
        'Ensure bindings are configured in Cloudflare Pages dashboard under Functions > Bindings',
        'Verify binding names match exactly: PRICING_DB for D1, PRICING_CACHE for KV'
      ]
    });
    
  } catch (error) {
    console.error('Binding test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
