import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { serviceReviews, services, subscriptions, user, session } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Validate session and get userId
    const sessionRecord = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userSession = sessionRecord[0];

    // Check if session is expired
    const now = new Date();
    if (userSession.expiresAt < now) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = userSession.userId;

    // Query user table and verify role === 'developer'
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (userRecord[0].role !== 'developer') {
      return NextResponse.json(
        { error: 'Developer role required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { serviceId, rating, comment } = body;

    // Validate required fields
    if (!serviceId) {
      return NextResponse.json(
        { 
          error: 'Service ID is required',
          code: 'MISSING_SERVICE_ID'
        },
        { status: 400 }
      );
    }

    const parsedServiceId = parseInt(serviceId);
    if (isNaN(parsedServiceId)) {
      return NextResponse.json(
        { 
          error: 'Service ID must be a valid integer',
          code: 'INVALID_SERVICE_ID'
        },
        { status: 400 }
      );
    }

    if (rating === undefined || rating === null) {
      return NextResponse.json(
        { 
          error: 'Rating is required',
          code: 'MISSING_RATING'
        },
        { status: 400 }
      );
    }

    const parsedRating = parseInt(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json(
        { 
          error: 'Rating must be between 1 and 5',
          code: 'INVALID_RATING'
        },
        { status: 400 }
      );
    }

    // Validate comment length if provided
    if (comment !== undefined && comment !== null) {
      if (typeof comment !== 'string') {
        return NextResponse.json(
          { 
            error: 'Comment must be a string',
            code: 'INVALID_COMMENT_TYPE'
          },
          { status: 400 }
        );
      }

      if (comment.length > 1000) {
        return NextResponse.json(
          { 
            error: 'Comment must not exceed 1000 characters',
            code: 'COMMENT_TOO_LONG'
          },
          { status: 400 }
        );
      }
    }

    // Query services table to verify service exists
    const serviceRecord = await db
      .select()
      .from(services)
      .where(eq(services.id, parsedServiceId))
      .limit(1);

    if (serviceRecord.length === 0) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Query subscriptions table to verify user has/had a subscription to this service
    const subscriptionRecord = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.serviceId, parsedServiceId)
        )
      )
      .limit(1);

    if (subscriptionRecord.length === 0) {
      return NextResponse.json(
        { error: 'You must have a subscription to review this service' },
        { status: 403 }
      );
    }

    // Check if user already reviewed this service
    const existingReview = await db
      .select()
      .from(serviceReviews)
      .where(
        and(
          eq(serviceReviews.userId, userId),
          eq(serviceReviews.serviceId, parsedServiceId)
        )
      )
      .limit(1);

    if (existingReview.length > 0) {
      return NextResponse.json(
        { 
          error: 'You have already reviewed this service',
          code: 'ALREADY_REVIEWED'
        },
        { status: 400 }
      );
    }

    // Insert new review into serviceReviews table
    const trimmedComment = comment !== undefined && comment !== null ? comment.trim() : null;
    const nowIso = now.toISOString();

    const newReview = await db
      .insert(serviceReviews)
      .values({
        serviceId: parsedServiceId,
        userId: userId,
        rating: parsedRating,
        comment: trimmedComment,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
      .returning();

    // Return created review with success message
    return NextResponse.json(
      {
        success: true,
        message: 'Review submitted successfully',
        data: {
          review: newReview[0]
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}