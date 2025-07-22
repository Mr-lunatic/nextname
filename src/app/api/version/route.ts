import { NextRequest, NextResponse } from 'next/server';

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    version: '2.0.0',
    features: [
      'pagination-support',
      'official-registrar-urls',
      'strict-72h-freshness-validation',
      'd1-priority-enforcement'
    ],
    lastUpdated: '2025-07-22T07:00:00Z',
    commit: '5b186df',
    timestamp: new Date().toISOString()
  });
}
