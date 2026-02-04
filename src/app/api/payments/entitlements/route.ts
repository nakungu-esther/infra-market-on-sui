// API route for fetching user entitlements
import { NextRequest, NextResponse } from 'next/server';
import { mockEntitlements } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mock user entitlements
    const userEntitlements = mockEntitlements.filter((e) => e.user_id === 'user2');

    return NextResponse.json({
      success: true,
      data: userEntitlements,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch entitlements' },
      { status: 500 }
    );
  }
}
