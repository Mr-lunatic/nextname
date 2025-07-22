export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain') || 'cn';
  
  try {
    console.log(`🔍 Debug pricing for domain: ${domain}`);
    
    // 1. 测试我们的pricing API
    const pricingResponse = await fetch(`${request.url.split('/api/debug-pricing')[0]}/api/pricing?domain=${domain}&order=new&page=1&pageSize=10`);
    const pricingData = await pricingResponse.json();
    
    // 2. 直接测试Nazhumi API
    const nazhumiUrl = `https://www.nazhumi.com/api/v1?domain=${domain}&order=new`;
    let nazhumiData = null;
    let nazhumiError = null;
    
    try {
      const nazhumiResponse = await fetch(nazhumiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Domain-Search-Platform/1.0'
        }
      });
      nazhumiData = await nazhumiResponse.json();
    } catch (error: any) {
      nazhumiError = error.message;
    }
    
    return Response.json({
      domain,
      debug: {
        ourAPI: {
          url: `/api/pricing?domain=${domain}&order=new&page=1&pageSize=10`,
          response: pricingData,
          recordCount: pricingData?.pricing?.length || 0,
          totalRecords: pricingData?.pagination?.totalRecords || 0,
          source: pricingData?.source
        },
        nazhumiAPI: {
          url: nazhumiUrl,
          response: nazhumiData,
          error: nazhumiError,
          recordCount: nazhumiData?.data?.price?.length || 0
        },
        analysis: {
          ourAPIReturns: pricingData?.pricing?.length || 0,
          nazhumiAPIReturns: nazhumiData?.data?.price?.length || 0,
          possibleIssue: pricingData?.pricing?.length !== nazhumiData?.data?.price?.length ? 
            'Record count mismatch between our API and Nazhumi API' : 
            'Record counts match'
        }
      }
    });
    
  } catch (error: any) {
    return Response.json({
      error: error.message,
      domain
    }, { status: 500 });
  }
}
