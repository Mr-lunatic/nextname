/**
 * 简单的管理员访问控制
 * 用于保护敏感的管理功能和API
 */

import { NextRequest } from 'next/server';

// 管理员访问密钥 - 支持多个密钥源
const getValidKeys = () => {
  const keys = [
    process.env.ADMIN_ACCESS_KEY,
    process.env.NEXT_PUBLIC_ADMIN_KEY,
    'yuming-admin-2025' // 默认备用密钥
  ].filter(Boolean);

  console.log('Valid admin keys configured:', keys.length);
  return keys;
};

// IP白名单 - 可以添加允许访问的IP地址
const ALLOWED_IPS = process.env.ALLOWED_IPS?.split(',') || [];

/**
 * 验证管理员访问权限
 */
export function verifyAdminAccess(request: NextRequest): {
  isAuthorized: boolean;
  error?: string;
} {
  try {
    const validKeys = getValidKeys();

    // 方法1: 检查URL参数中的访问密钥
    const accessKey = request.nextUrl.searchParams.get('key');
    if (accessKey && validKeys.includes(accessKey)) {
      console.log('Access granted via URL parameter');
      return { isAuthorized: true };
    }

    // 方法2: 检查请求头中的访问密钥
    const headerKey = request.headers.get('x-admin-key');
    if (headerKey && validKeys.includes(headerKey)) {
      console.log('Access granted via header');
      return { isAuthorized: true };
    }

    // 方法3: 检查IP白名单（如果配置了）
    if (ALLOWED_IPS.length > 0) {
      const clientIP = getClientIP(request);
      if (clientIP && ALLOWED_IPS.includes(clientIP)) {
        return { isAuthorized: true };
      }
    }

    console.log('Access denied - no valid key provided');
    console.log('URL key:', accessKey ? 'provided' : 'missing');
    console.log('Header key:', headerKey ? 'provided' : 'missing');

    return {
      isAuthorized: false,
      error: 'Unauthorized access. Admin key required.'
    };
  } catch (error) {
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
  const primaryKey = validKeys[0] || 'yuming-admin-2025';
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
} {
  if (isDevelopment()) {
    // 开发环境下允许localhost访问
    const host = request.headers.get('host');
    if (host?.includes('localhost') || host?.includes('127.0.0.1')) {
      return { isAuthorized: true };
    }
  }
  
  return verifyAdminAccess(request);
}
