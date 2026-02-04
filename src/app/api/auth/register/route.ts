// API route for user registration
import { NextRequest, NextResponse } from 'next/server';
import { mockUsers } from '@/lib/mock-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role, wallet_address, company, website } = body;

    // Check if user already exists
    const existingUser = mockUsers.find((u) => u.email === email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Create new user
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
      wallet_address,
      created_at: new Date().toISOString(),
    };

    mockUsers.push(newUser);

    // Generate mock JWT token
    const token = `mock-jwt-token-${Date.now()}`;

    return NextResponse.json({
      success: true,
      data: {
        user: newUser,
        token,
      },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}
