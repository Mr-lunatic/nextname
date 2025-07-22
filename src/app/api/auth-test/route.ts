import { NextRequest, NextResponse } from 'next/server';

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge';

// Test authentication without requiring auth (for debugging)
export async function GET(request: NextRequest) {
  try {
    console.log('🔐 Auth test endpoint called');
    
    // Get the key from URL parameter
    const urlKey = request.nextUrl.searchParams.get('key');
    const headerKey = request.headers.get('x-admin-key');
    
    // Check environment variables
    const adminAccessKey = process.env.ADMIN_ACCESS_KEY;
    const nextPublicAdminKey = process.env.NEXT_PUBLIC_ADMIN_KEY;
    const defaultKey = 'yuming-admin-2025';
    
    // Get valid keys
    const validKeys = [
      adminAccessKey,
      nextPublicAdminKey,
      defaultKey
    ].filter(Boolean);
    
    console.log('Environment variables:');
    console.log('- ADMIN_ACCESS_KEY:', adminAccessKey ? 'set' : 'not set');
    console.log('- NEXT_PUBLIC_ADMIN_KEY:', nextPublicAdminKey ? 'set' : 'not set');
    console.log('- Valid keys count:', validKeys.length);
    
    console.log('Request keys:');
    console.log('- URL key:', urlKey ? 'provided' : 'not provided');
    console.log('- Header key:', headerKey ? 'provided' : 'not provided');
    
    // Test authentication
    const urlKeyValid = urlKey && validKeys.includes(urlKey);
    const headerKeyValid = headerKey && validKeys.includes(headerKey);
    
    console.log('Authentication results:');
    console.log('- URL key valid:', urlKeyValid);
    console.log('- Header key valid:', headerKeyValid);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      authentication: {
        urlKey: {
          provided: !!urlKey,
          value: urlKey || null,
          valid: urlKeyValid
        },
        headerKey: {
          provided: !!headerKey,
          value: headerKey || null,
          valid: headerKeyValid
        },
        environment: {
          ADMIN_ACCESS_KEY: adminAccessKey ? 'set' : 'not set',
          NEXT_PUBLIC_ADMIN_KEY: nextPublicAdminKey ? 'set' : 'not set',
          validKeysCount: validKeys.length,
          validKeys: validKeys.map(key => key ? `${key.substring(0, 4)}...` : 'null')
        },
        result: {
          isAuthorized: urlKeyValid || headerKeyValid,
          method: urlKeyValid ? 'URL parameter' : headerKeyValid ? 'Header' : 'none'
        }
      },
      recommendations: [
        ...(validKeys.length === 0 ? ['No valid keys configured - check environment variables'] : []),
        ...(!urlKey && !headerKey ? ['No authentication key provided in URL or header'] : []),
        ...(urlKey && !urlKeyValid ? ['URL key provided but not valid'] : []),
        ...(headerKey && !headerKeyValid ? ['Header key provided but not valid'] : [])
      ]
    });
    
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
