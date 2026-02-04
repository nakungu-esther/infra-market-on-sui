// API route for getting current user
import { NextRequest, NextResponse } from 'next/server';
import { mockUsers } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Mock token validation - extract user ID from token
    // In production, verify JWT signature
    const userId = token.split('-')[3]; // Extract user ID from mock token
    const user = mockUsers.find((u) => u.id === userId || u.id === 'user2');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
