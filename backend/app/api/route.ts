import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Real Estate WhatsApp Agent API is running'
  });
}
