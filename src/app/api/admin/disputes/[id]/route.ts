import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { disputes, user, services, entitlements, session } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract and validate Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'MISSING_AUTH_TOKEN' },
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

    const currentUser = userRecord[0];

    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Validate dispute ID
    const disputeId = params.id;
    if (!disputeId || isNaN(parseInt(disputeId))) {
      return NextResponse.json(
        { error: 'Valid dispute ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const id = parseInt(disputeId);

    // Query dispute with all related information
    const disputeRecord = await db
      .select({
        dispute: disputes,
        reporter: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(disputes)
      .leftJoin(user, eq(disputes.reporterId, user.id))
      .where(eq(disputes.id, id))
      .limit(1);

    if (disputeRecord.length === 0) {
      return NextResponse.json(
        { error: 'Dispute not found', code: 'DISPUTE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const disputeData = disputeRecord[0];

    // Get provider information if providerId exists
    let provider = null;
    if (disputeData.dispute.providerId) {
      const providerRecord = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
        })
        .from(user)
        .where(eq(user.id, disputeData.dispute.providerId))
        .limit(1);

      if (providerRecord.length > 0) {
        provider = providerRecord[0];
      }
    }

    // Get service information if serviceId exists
    let service = null;
    if (disputeData.dispute.serviceId) {
      const serviceRecord = await db
        .select({
          id: services.id,
          name: services.name,
          description: services.description,
        })
        .from(services)
        .where(eq(services.id, disputeData.dispute.serviceId))
        .limit(1);

      if (serviceRecord.length > 0) {
        service = serviceRecord[0];
      }
    }

    // Get resolver information if resolvedBy exists
    let resolver = null;
    if (disputeData.dispute.resolvedBy) {
      const resolverRecord = await db
        .select({
          id: user.id,
          name: user.name,
        })
        .from(user)
        .where(eq(user.id, disputeData.dispute.resolvedBy))
        .limit(1);

      if (resolverRecord.length > 0) {
        resolver = resolverRecord[0];
      }
    }

    // Get related payment information if serviceId and reporterId exist
    let relatedPayment = null;
    if (disputeData.dispute.serviceId && disputeData.dispute.reporterId) {
      const paymentRecord = await db
        .select({
          paymentId: entitlements.paymentId,
          amountPaid: entitlements.amountPaid,
          createdAt: entitlements.createdAt,
        })
        .from(entitlements)
        .where(
          and(
            eq(entitlements.userId, disputeData.dispute.reporterId),
            eq(entitlements.serviceId, disputeData.dispute.serviceId)
          )
        )
        .orderBy(entitlements.createdAt)
        .limit(1);

      if (paymentRecord.length > 0) {
        relatedPayment = paymentRecord[0];
      }
    }

    // Build response
    const response = {
      success: true,
      data: {
        dispute: {
          id: disputeData.dispute.id,
          disputeType: disputeData.dispute.disputeType,
          status: disputeData.dispute.status,
          title: disputeData.dispute.title,
          description: disputeData.dispute.description,
          amountInvolved: disputeData.dispute.amountInvolved,
          evidence: disputeData.dispute.evidence,
          providerResponse: disputeData.dispute.providerResponse,
          adminNotes: disputeData.dispute.adminNotes,
          resolvedAt: disputeData.dispute.resolvedAt,
          createdAt: disputeData.dispute.createdAt,
          updatedAt: disputeData.dispute.updatedAt,
        },
        reporter: disputeData.reporter,
        service,
        provider,
        resolver,
        relatedPayment,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET dispute error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}