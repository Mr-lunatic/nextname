import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/auth';

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const authResult = verifyAdminAccess(request);
  
  // 获取请求信息用于调试
  const url = new URL(request.url);
  const keyFromUrl = url.searchParams.get('key');
  const keyFromHeader = request.headers.get('x-admin-key');
  const authHeader = request.headers.get('authorization');
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    authResult: {
      isAuthorized: authResult.isAuthorized,
      authMethod: authResult.authMethod,
      error: authResult.error
    },
    requestInfo: {
      method: request.method,
      url: request.url,
      keyFromUrl: keyFromUrl ? `${keyFromUrl.substring(0, 4)}...` : null,
      keyFromHeader: keyFromHeader ? `${keyFromHeader.substring(0, 4)}...` : null,
      hasAuthHeader: !!authHeader,
      userAgent: request.headers.get('user-agent')
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasAdminKey: !!process.env.ADMIN_ACCESS_KEY,
      hasPublicKey: !!process.env.NEXT_PUBLIC_ADMIN_KEY,
    }
  };
  
  if (!authResult.isAuthorized) {
    return NextResponse.json({
      success: false,
      message: 'Authentication failed',
      debug: debugInfo
    }, { status: 401 });
  }
  
  return NextResponse.json({
    success: true,
    message: 'Authentication successful',
    debug: debugInfo
  });
}