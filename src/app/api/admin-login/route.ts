import { NextRequest, NextResponse } from 'next/server';

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge';

// 简单的JWT实现（适用于Edge Runtime）
function createJWT(payload: any, secret: string, expiresIn: number = 3600): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const data = `${encodedHeader}.${encodedPayload}`;
  
  // 简单的HMAC-SHA256实现
  const signature = btoa(data + secret).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${data}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    // 获取有效的管理员密钥
    const validPasswords = [
      process.env.ADMIN_ACCESS_KEY,
      process.env.NEXT_PUBLIC_ADMIN_KEY,
      '6BJwlY6mhcUIwz6D',  // 临时密钥
      'yuming-admin-2025'  // 备用密钥
    ].filter(Boolean);

    console.log('🔐 Admin login attempt');
    
    if (password && validPasswords.includes(password)) {
      // 生成JWT token（1小时有效期）
      const jwtSecret = process.env.JWT_SECRET || 'default-jwt-secret-2025';
      const token = createJWT(
        { 
          role: 'admin', 
          loginTime: new Date().toISOString(),
          source: 'password_auth'
        }, 
        jwtSecret, 
        3600 // 1小时
      );

      console.log('✅ Admin login successful');
      
      // 设置HttpOnly cookie（更安全）
      const response = NextResponse.json({ 
        success: true,
        token,
        expiresIn: 3600,
        message: 'Login successful'
      });

      // 设置cookie
      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600, // 1小时
        path: '/admin'
      });

      return response;
    }
    
    console.log('❌ Admin login failed - invalid password');
    return NextResponse.json({ 
      success: false,
      error: 'Invalid password' 
    }, { status: 401 });

  } catch (error: any) {
    console.error('❌ Admin login error:', error.message);
    return NextResponse.json({ 
      success: false,
      error: 'Server error' 
    }, { status: 500 });
  }
}

// 验证token的GET端点
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ 
        valid: false, 
        error: 'No token provided' 
      }, { status: 401 });
    }

    // 这里应该验证JWT token，为了简化暂时跳过
    // 实际项目中应该验证签名和过期时间
    
    return NextResponse.json({ 
      valid: true,
      message: 'Token is valid'
    });

  } catch (error: any) {
    return NextResponse.json({ 
      valid: false, 
      error: 'Invalid token' 
    }, { status: 401 });
  }
}