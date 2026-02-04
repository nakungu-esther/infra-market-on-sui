import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { serviceTags, services, session, user } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';

async function authenticateAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    const sessions = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessions.length === 0) {
      return null;
    }

    const userSession = sessions[0];
    
    if (userSession.expiresAt < new Date()) {
      return null;
    }

    const users = await db.select()
      .from(user)
      .where(eq(user.id, userSession.userId))
      .limit(1);

    if (users.length === 0) {
      return null;
    }

    const currentUser = users[0];
    
    if (currentUser.role !== 'admin') {
      return { error: 'forbidden' };
    }

    return currentUser;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAdmin(request);
    
    if (!authResult) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    if (authResult.error === 'forbidden') {
      return NextResponse.json({ 
        error: 'Admin access required',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid service ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const serviceId = parseInt(id);

    const service = await db.select()
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    if (service.length === 0) {
      return NextResponse.json({ 
        error: 'Service not found',
        code: 'SERVICE_NOT_FOUND'
      }, { status: 404 });
    }

    const existingTag = await db.select()
      .from(serviceTags)
      .where(
        and(
          eq(serviceTags.serviceId, serviceId),
          eq(serviceTags.tag, 'Verified by Sui Foundation')
        )
      )
      .limit(1);

    if (existingTag.length > 0) {
      return NextResponse.json({ 
        error: 'Service is already verified',
        code: 'ALREADY_VERIFIED'
      }, { status: 400 });
    }

    const newTag = await db.insert(serviceTags)
      .values({
        serviceId,
        tag: 'Verified by Sui Foundation',
        addedByAdmin: true,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Verified badge added successfully',
      data: {
        tag: newTag[0]
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAdmin(request);
    
    if (!authResult) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    if (authResult.error === 'forbidden') {
      return NextResponse.json({ 
        error: 'Admin access required',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid service ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const serviceId = parseInt(id);

    const service = await db.select()
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    if (service.length === 0) {
      return NextResponse.json({ 
        error: 'Service not found',
        code: 'SERVICE_NOT_FOUND'
      }, { status: 404 });
    }

    const existingTag = await db.select()
      .from(serviceTags)
      .where(
        and(
          eq(serviceTags.serviceId, serviceId),
          eq(serviceTags.tag, 'Verified by Sui Foundation')
        )
      )
      .limit(1);

    if (existingTag.length === 0) {
      return NextResponse.json({ 
        error: 'No verified badge found for this service',
        code: 'BADGE_NOT_FOUND'
      }, { status: 404 });
    }

    await db.delete(serviceTags)
      .where(
        and(
          eq(serviceTags.serviceId, serviceId),
          eq(serviceTags.tag, 'Verified by Sui Foundation')
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Verified badge removed successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}