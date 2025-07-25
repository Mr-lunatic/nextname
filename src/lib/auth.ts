/**
 * 简单的管理员访问控制
 * 用于保护敏感的管理功能和API
 */

import { NextRequest } from 'next/server';
import { validateEnvOnStartup } from './env-config';

// 在模块加载时检查环境变量配置
validateEnvOnStartup();

// 管理员访问密钥配置
const getValidKeys = () => {
  const keys = [
    process.env.ADMIN_ACCESS_KEY,
    process.env.NEXT_PUBLIC_ADMIN_KEY,
  ].filter(Boolean);

  // 开发环境安全检查
  if (isDevelopment() && keys.length === 0) {
    console.warn('⚠️ No admin keys configured in development. Access will be restricted to localhost only.');
  }

  // 生产环境严格检查
  if (!isDevelopment() && keys.length === 0) {
    console.error('❌ No admin access keys configured. Please set ADMIN_ACCESS_KEY and/or NEXT_PUBLIC_ADMIN_KEY environment variables.');
  }

  console.log('🔑 Valid admin keys configured:', keys.length);
  console.log('🔑 Keys source check:', {
    envKey: !!process.env.ADMIN_ACCESS_KEY,
    publicKey: !!process.env.NEXT_PUBLIC_ADMIN_KEY,
    isDevelopment: isDevelopment(),
    hasKeys: keys.length > 0
  });
  
  return keys;
};

// IP白名单 - 可以添加允许访问的IP地址
const ALLOWED_IPS = process.env.ALLOWED_IPS?.split(',') || [];

/**
 * 验证管理员访问权限 - 支持密钥和JWT token
 */
export function verifyAdminAccess(request: NextRequest): {
  isAuthorized: boolean;
  error?: string;
  authMethod?: string;
} {
  try {
    const validKeys = getValidKeys();

    // 方法1: 检查JWT token（Cookie优先）
    const tokenFromCookie = request.cookies.get('admin-token')?.value;
    const tokenFromHeader = request.headers.get('authorization')?.replace('Bearer ', '');
    const token = tokenFromCookie || tokenFromHeader;
    
    if (token) {
      // 简单验证token格式（实际项目中应该验证签名）
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const now = Math.floor(Date.now() / 1000);
          
          if (payload.exp && payload.exp > now && payload.role === 'admin') {
            console.log('✅ Access granted via JWT token');
            return { isAuthorized: true, authMethod: 'jwt' };
          }
        }
      } catch (tokenError) {
        console.log('⚠️ Invalid JWT token format');
      }
    }

    // 方法2: 检查URL参数中的访问密钥
    const accessKey = request.nextUrl.searchParams.get('key');
    if (accessKey && validKeys.includes(accessKey)) {
      console.log('✅ Access granted via URL parameter');
      return { isAuthorized: true, authMethod: 'url_key' };
    }

    // 方法3: 检查请求头中的访问密钥
    const headerKey = request.headers.get('x-admin-key');
    if (headerKey && validKeys.includes(headerKey)) {
      console.log('✅ Access granted via header key');
      return { isAuthorized: true, authMethod: 'header_key' };
    }

    // 方法4: 检查IP白名单（如果配置了）
    if (ALLOWED_IPS.length > 0) {
      const clientIP = getClientIP(request);
      if (clientIP && ALLOWED_IPS.includes(clientIP)) {
        console.log('✅ Access granted via IP whitelist');
        return { isAuthorized: true, authMethod: 'ip_whitelist' };
      }
    }

    console.log('❌ Access denied - no valid authentication method');
    console.log('Auth check details:', {
      hasToken: !!token,
      urlKey: accessKey ? 'provided' : 'missing',
      headerKey: headerKey ? 'provided' : 'missing',
      validKeysCount: validKeys.length
    });

    return {
      isAuthorized: false,
      error: 'Unauthorized access. Please login or provide a valid admin key.'
    };
  } catch (error: any) {
    console.error('❌ Auth verification error:', error.message);
    return {
      isAuthorized: false,
      error: 'Access verification failed.'
    };
  }
}

/**
 * 获取客户端IP地址
 */
function getClientIP(request: NextRequest): string | null {
  // 尝试从各种可能的头部获取真实IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return null;
}

/**
 * 创建未授权响应
 */
export function createUnauthorizedResponse(error?: string) {
  return new Response(
    JSON.stringify({
      error: error || 'Unauthorized access',
      message: 'This endpoint requires admin access. Please provide a valid access key.',
      timestamp: new Date().toISOString()
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}

/**
 * 管理员访问装饰器
 * 用于保护API路由
 */
export function withAdminAuth(handler: (request: NextRequest, context?: any) => Promise<Response>) {
  return async (request: NextRequest, context?: any) => {
    const authResult = verifyAdminAccess(request);

    if (!authResult.isAuthorized) {
      return createUnauthorizedResponse(authResult.error);
    }

    return handler(request, context);
  };
}

/**
 * 生成管理员访问URL
 */
export function generateAdminURL(basePath: string): string {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const validKeys = getValidKeys();
  const primaryKey = validKeys[0];

  if (!primaryKey) {
    throw new Error('No admin access key configured. Please set ADMIN_ACCESS_KEY environment variable.');
  }

  return `${baseURL}${basePath}?key=${primaryKey}`;
}

/**
 * 检查是否在开发环境
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * 开发环境下的宽松验证
 */
export function verifyAdminAccessDev(request: NextRequest): {
  isAuthorized: boolean;
  error?: string;
  authMethod?: string;
} {
  if (isDevelopment()) {
    // 检查是否允许localhost访问
    const allowLocalhost = process.env.DEV_ALLOW_LOCALHOST !== 'false';
    
    if (allowLocalhost) {
      const host = request.headers.get('host');
      if (host?.includes('localhost') || host?.includes('127.0.0.1')) {
        console.log('✅ Development access granted via localhost');
        return { isAuthorized: true, authMethod: 'localhost_dev' };
      }
    }

    // 如果没有配置密钥但在开发环境，仍然尝试检查localhost
    const validKeys = getValidKeys();
    if (validKeys.length === 0) {
      const host = request.headers.get('host');
      if (host?.includes('localhost') || host?.includes('127.0.0.1')) {
        console.log('✅ Development fallback access granted via localhost (no keys configured)');
        return { isAuthorized: true, authMethod: 'localhost_fallback' };
      }
      
      return {
        isAuthorized: false,
        error: 'No admin keys configured. Please copy .env.example to .env and configure your admin keys, or access via localhost in development.'
      };
    }
  }
  
  return verifyAdminAccess(request);
}
