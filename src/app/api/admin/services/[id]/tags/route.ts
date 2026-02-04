import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { serviceTags, services, user, session } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

async function getAuthenticatedAdmin(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Authentication required', status: 401 };
  }

  const token = authHeader.substring(7);

  try {
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return { error: 'Invalid or expired token', status: 401 };
    }

    const userSession = sessionRecord[0];

    if (new Date(userSession.expiresAt) < new Date()) {
      return { error: 'Session expired', status: 401 };
    }

    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, userSession.userId))
      .limit(1);

    if (userRecord.length === 0) {
      return { error: 'User not found', status: 401 };
    }

    const authenticatedUser = userRecord[0];

    if (authenticatedUser.role !== 'admin') {
      return { error: 'Admin access required', status: 403 };
    }

    return { user: authenticatedUser };
  } catch (error) {
    console.error('Authentication error:', error);
    return { error: 'Authentication failed', status: 401 };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getAuthenticatedAdmin(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, code: 'AUTH_ERROR' },
        { status: authResult.status }
      );
    }

    const { id } = await params;
    const serviceId = parseInt(id);

    if (!serviceId || isNaN(serviceId)) {
      return NextResponse.json(
        { error: 'Valid service ID is required', code: 'INVALID_SERVICE_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { tag } = body;

    if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
      return NextResponse.json(
        { error: 'Tag is required and must be a non-empty string', code: 'INVALID_TAG' },
        { status: 400 }
      );
    }

    if (tag.length > 100) {
      return NextResponse.json(
        { error: 'Tag must not exceed 100 characters', code: 'TAG_TOO_LONG' },
        { status: 400 }
      );
    }

    const trimmedTag = tag.trim();

    const serviceRecord = await db.select()
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    if (serviceRecord.length === 0) {
      return NextResponse.json(
        { error: 'Service not found', code: 'SERVICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const existingTag = await db.select()
      .from(serviceTags)
      .where(
        and(
          eq(serviceTags.serviceId, serviceId),
          eq(serviceTags.tag, trimmedTag)
        )
      )
      .limit(1);

    if (existingTag.length > 0) {
      return NextResponse.json(
        { error: 'This tag already exists for this service', code: 'DUPLICATE_TAG' },
        { status: 400 }
      );
    }

    const newTag = await db.insert(serviceTags)
      .values({
        serviceId,
        tag: trimmedTag,
        addedByAdmin: true,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: { tag: newTag[0] },
        message: 'Admin tag added successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getAuthenticatedAdmin(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, code: 'AUTH_ERROR' },
        { status: authResult.status }
      );
    }

    const { id } = await params;
    const serviceId = parseInt(id);

    if (!serviceId || isNaN(serviceId)) {
      return NextResponse.json(
        { error: 'Valid service ID is required', code: 'INVALID_SERVICE_ID' },
        { status: 400 }
      );
    }

    const serviceRecord = await db.select()
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    if (serviceRecord.length === 0) {
      return NextResponse.json(
        { error: 'Service not found', code: 'SERVICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const tags = await db.select()
      .from(serviceTags)
      .where(eq(serviceTags.serviceId, serviceId))
      .orderBy(desc(serviceTags.createdAt));

    return NextResponse.json(
      {
        success: true,
        data: {
          tags,
          count: tags.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}