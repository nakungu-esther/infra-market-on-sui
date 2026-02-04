import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, session, services } from '@/db/schema';
import { eq, like, and, or, desc, count, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Extract and validate Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'MISSING_TOKEN' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Query session table for token validation
    const sessionResult = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionResult.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN' 
      }, { status: 401 });
    }

    const userSession = sessionResult[0];

    // Check if session is expired
    const now = new Date();
    if (userSession.expiresAt < now) {
      return NextResponse.json({ 
        error: 'Token expired',
        code: 'EXPIRED_TOKEN' 
      }, { status: 401 });
    }

    // Query user table for session userId
    const currentUserResult = await db.select()
      .from(user)
      .where(eq(user.id, userSession.userId))
      .limit(1);

    if (currentUserResult.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 401 });
    }

    const currentUser = currentUserResult[0];

    // Verify user is admin
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Admin access required',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const roleParam = searchParams.get('role');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const searchQuery = searchParams.get('search');

    // Validate role parameter
    const validRoles = ['admin', 'provider', 'developer'];
    if (roleParam && !validRoles.includes(roleParam)) {
      return NextResponse.json({ 
        error: 'Invalid role parameter. Must be one of: admin, provider, developer',
        code: 'INVALID_ROLE' 
      }, { status: 400 });
    }

    // Validate and set page (default 1, min 1)
    let page = 1;
    if (pageParam) {
      const parsedPage = parseInt(pageParam);
      if (isNaN(parsedPage) || parsedPage < 1) {
        return NextResponse.json({ 
          error: 'Invalid page parameter. Must be a positive integer',
          code: 'INVALID_PAGE' 
        }, { status: 400 });
      }
      page = parsedPage;
    }

    // Validate and set limit (default 20, max 100)
    let limit = 20;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return NextResponse.json({ 
          error: 'Invalid limit parameter. Must be a positive integer',
          code: 'INVALID_LIMIT' 
        }, { status: 400 });
      }
      limit = Math.min(parsedLimit, 100);
    }

    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const whereConditions = [];
    
    if (roleParam) {
      whereConditions.push(eq(user.role, roleParam));
    }

    if (searchQuery) {
      whereConditions.push(
        or(
          like(user.name, `%${searchQuery}%`),
          like(user.email, `%${searchQuery}%`)
        )
      );
    }

    const whereClause = whereConditions.length > 0 
      ? and(...whereConditions) 
      : undefined;

    // Get total count for pagination
    const countQuery = whereClause
      ? db.select({ count: count() }).from(user).where(whereClause)
      : db.select({ count: count() }).from(user);

    const totalResult = await countQuery;
    const total = totalResult[0].count;

    // Main query with LEFT JOIN to services for servicesCount
    let usersQuery = db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        servicesCount: count(services.id),
      })
      .from(user)
      .leftJoin(services, eq(services.providerId, user.id))
      .groupBy(user.id, user.name, user.email, user.role, user.createdAt)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    // Apply WHERE clause if conditions exist
    const users = whereClause
      ? await usersQuery.where(whereClause)
      : await usersQuery;

    // Format response with timestamp conversion - handle integer timestamps
    const formattedUsers = users.map(u => {
      let createdAtISO = '';
      if (typeof u.createdAt === 'number') {
        createdAtISO = new Date(u.createdAt * 1000).toISOString();
      } else if (u.createdAt instanceof Date) {
        createdAtISO = u.createdAt.toISOString();
      } else {
        createdAtISO = String(u.createdAt);
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: createdAtISO,
        servicesCount: u.servicesCount,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users: formattedUsers,
      total,
      page,
      limit,
      totalPages,
    }, { status: 200 });

  } catch (error) {
    console.error('GET users error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}