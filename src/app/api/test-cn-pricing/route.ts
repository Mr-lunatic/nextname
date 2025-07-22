export const runtime = 'edge';

export async function GET() {
  try {
    // 测试nazhumi API对.cn域名的响应
    const url = 'https://www.nazhumi.com/api/v1?domain=cn&order=new';
    
    console.log(`🧪 Testing Nazhumi API for .cn: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Domain-Search-Platform/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return Response.json({
      success: true,
      url,
      apiResponse: data,
      recordCount: data?.data?.price?.length || data?.length || 0,
      message: `API returned ${data?.data?.price?.length || data?.length || 0} records for .cn domain`
    });
    
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message,
      message: 'Failed to test .cn pricing API'
    }, { status: 500 });
  }
}
