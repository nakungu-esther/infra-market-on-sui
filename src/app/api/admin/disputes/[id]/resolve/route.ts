import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { disputes, user, session } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Extract and validate Bearer token
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
        { error: 'Authentication required', code: 'INVALID_SESSION' },
        { status: 401 }
      );
    }

    // Check if session is expired
    const now = new Date();
    if (sessionRecord[0].expiresAt < now) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }

    const userId = sessionRecord[0].userId;

    // Query user and verify admin role
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'USER_NOT_FOUND' },
        { status: 401 }
      );
    }

    if (userRecord[0].role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Extract dispute ID from URL
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');

    if (!idParam || isNaN(parseInt(idParam))) {
      return NextResponse.json(
        { error: 'Valid dispute ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const disputeId = parseInt(idParam);

    // Parse request body
    const body = await request.json();
    const { resolution, adminNotes } = body;

    // Validate resolution
    if (!resolution) {
      return NextResponse.json(
        { error: 'Resolution is required', code: 'MISSING_RESOLUTION' },
        { status: 400 }
      );
    }

    if (resolution !== 'approve' && resolution !== 'reject') {
      return NextResponse.json(
        { 
          error: 'Resolution must be either "approve" or "reject"', 
          code: 'INVALID_RESOLUTION' 
        },
        { status: 400 }
      );
    }

    // Validate adminNotes length if provided
    if (adminNotes !== undefined && adminNotes !== null) {
      if (typeof adminNotes !== 'string') {
        return NextResponse.json(
          { error: 'Admin notes must be a string', code: 'INVALID_NOTES_TYPE' },
          { status: 400 }
        );
      }

      if (adminNotes.length > 2000) {
        return NextResponse.json(
          { 
            error: 'Admin notes cannot exceed 2000 characters', 
            code: 'NOTES_TOO_LONG' 
          },
          { status: 400 }
        );
      }
    }

    // Query dispute to verify it exists
    const existingDispute = await db
      .select()
      .from(disputes)
      .where(eq(disputes.id, disputeId))
      .limit(1);

    if (existingDispute.length === 0) {
      return NextResponse.json(
        { error: 'Dispute not found', code: 'DISPUTE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const dispute = existingDispute[0];

    // Check if dispute is already resolved
    if (dispute.status === 'resolved' || dispute.status === 'rejected') {
      return NextResponse.json(
        { 
          error: 'Dispute has already been resolved', 
          code: 'ALREADY_RESOLVED' 
        },
        { status: 400 }
      );
    }

    // Prepare admin notes - trim and append to existing if any
    let finalAdminNotes = dispute.adminNotes || '';
    if (adminNotes) {
      const trimmedNotes = adminNotes.trim();
      if (trimmedNotes) {
        if (finalAdminNotes) {
          finalAdminNotes += '\n\n' + trimmedNotes;
        } else {
          finalAdminNotes = trimmedNotes;
        }
      }
    }

    // Determine final status based on resolution
    const finalStatus = resolution === 'approve' ? 'resolved' : 'rejected';
    const resolvedAt = new Date().toISOString();
    const updatedAt = new Date().toISOString();

    // Update dispute
    const updatedDispute = await db
      .update(disputes)
      .set({
        status: finalStatus,
        adminNotes: finalAdminNotes || null,
        resolvedBy: userId,
        resolvedAt: resolvedAt,
        updatedAt: updatedAt,
      })
      .where(eq(disputes.id, disputeId))
      .returning();

    if (updatedDispute.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update dispute', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Dispute resolved successfully',
        data: {
          dispute: {
            id: updatedDispute[0].id,
            status: updatedDispute[0].status,
            resolvedBy: updatedDispute[0].resolvedBy,
            resolvedAt: updatedDispute[0].resolvedAt,
            adminNotes: updatedDispute[0].adminNotes,
            updatedAt: updatedDispute[0].updatedAt,
          },
          resolution: {
            action: resolution,
            resolvedBy: userId,
            resolvedAt: resolvedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}