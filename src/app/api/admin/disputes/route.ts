import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { disputes, user, services, session } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'MISSING_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Validate session
    const sessionRecord = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { error: 'Invalid session', code: 'INVALID_SESSION' },
        { status: 401 }
      );
    }

    const userSession = sessionRecord[0];

    // Check if session is expired
    if (new Date(userSession.expiresAt) <= new Date()) {
      return NextResponse.json(
        { error: 'Session expired', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }

    // Get user and verify admin role
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, userSession.userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 401 }
      );
    }

    if (userRecord[0].role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const disputeType = searchParams.get('disputeType');
    const reporterId = searchParams.get('reporterId');
    const serviceIdParam = searchParams.get('serviceId');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Validate status parameter if provided
    if (status && !['open', 'in_progress', 'resolved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status parameter', code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    // Validate disputeType parameter if provided
    if (disputeType && !['refund_request', 'service_downtime', 'billing_issue', 'quality_issue'].includes(disputeType)) {
      return NextResponse.json(
        { error: 'Invalid disputeType parameter', code: 'INVALID_DISPUTE_TYPE' },
        { status: 400 }
      );
    }

    // Validate and parse serviceId if provided
    let serviceId: number | null = null;
    if (serviceIdParam) {
      serviceId = parseInt(serviceIdParam);
      if (isNaN(serviceId)) {
        return NextResponse.json(
          { error: 'Invalid serviceId parameter', code: 'INVALID_SERVICE_ID' },
          { status: 400 }
        );
      }
    }

    // Parse pagination parameters
    let limit = 50;
    let offset = 0;

    if (limitParam) {
      limit = parseInt(limitParam);
      if (isNaN(limit) || limit < 1) {
        return NextResponse.json(
          { error: 'Invalid limit parameter', code: 'INVALID_LIMIT' },
          { status: 400 }
        );
      }
      limit = Math.min(limit, 200);
    }

    if (offsetParam) {
      offset = parseInt(offsetParam);
      if (isNaN(offset) || offset < 0) {
        return NextResponse.json(
          { error: 'Invalid offset parameter', code: 'INVALID_OFFSET' },
          { status: 400 }
        );
      }
    }

    // Build query with LEFT JOINs
    const reporterUser = sql`reporter_user`;
    const providerUser = sql`provider_user`;
    const resolverUser = sql`resolver_user`;
    const service = sql`service`;

    let query = db
      .select({
        id: disputes.id,
        reporterId: disputes.reporterId,
        reporterName: sql<string>`${reporterUser}.name`,
        reporterEmail: sql<string>`${reporterUser}.email`,
        serviceId: disputes.serviceId,
        serviceName: sql<string | null>`${service}.name`,
        providerId: disputes.providerId,
        providerName: sql<string | null>`${providerUser}.name`,
        providerEmail: sql<string | null>`${providerUser}.email`,
        disputeType: disputes.disputeType,
        status: disputes.status,
        title: disputes.title,
        description: disputes.description,
        amountInvolved: disputes.amountInvolved,
        evidence: disputes.evidence,
        providerResponse: disputes.providerResponse,
        adminNotes: disputes.adminNotes,
        resolvedBy: disputes.resolvedBy,
        resolverName: sql<string | null>`${resolverUser}.name`,
        resolvedAt: disputes.resolvedAt,
        createdAt: disputes.createdAt,
        updatedAt: disputes.updatedAt,
      })
      .from(disputes)
      .leftJoin(
        sql`${user} AS reporter_user`,
        sql`${disputes.reporterId} = ${reporterUser}.id`
      )
      .leftJoin(
        sql`${user} AS provider_user`,
        sql`${disputes.providerId} = ${providerUser}.id`
      )
      .leftJoin(
        sql`${services} AS service`,
        sql`${disputes.serviceId} = ${service}.id`
      )
      .leftJoin(
        sql`${user} AS resolver_user`,
        sql`${disputes.resolvedBy} = ${resolverUser}.id`
      );

    // Apply filters
    const conditions = [];

    if (status) {
      conditions.push(eq(disputes.status, status));
    }

    if (disputeType) {
      conditions.push(eq(disputes.disputeType, disputeType));
    }

    if (reporterId) {
      conditions.push(eq(disputes.reporterId, reporterId));
    }

    if (serviceId !== null) {
      conditions.push(eq(disputes.serviceId, serviceId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count for pagination metadata
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(disputes);

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const countResult = await countQuery;
    const total = countResult[0]?.count || 0;

    // Apply ordering and pagination
    const results = await query
      .orderBy(desc(disputes.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: {
        disputes: results,
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}