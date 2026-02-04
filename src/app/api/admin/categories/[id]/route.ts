import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { serviceCategories, serviceCategoryMapping, user, session } from '@/db/schema';
import { eq, ne, and } from 'drizzle-orm';

async function verifyAdminAuth(request: NextRequest) {
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
      return { error: 'Token expired', status: 401 };
    }

    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, userSession.userId))
      .limit(1);

    if (userRecord.length === 0) {
      return { error: 'User not found', status: 401 };
    }

    const currentUser = userRecord[0];

    if (currentUser.role !== 'admin') {
      return { error: 'Forbidden: Admin access required', status: 403 };
    }

    return { user: currentUser };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { error: 'Authentication failed', status: 500 };
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdminAuth(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, code: 'AUTH_ERROR' },
        { status: authResult.status }
      );
    }

    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid category ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const categoryId = parseInt(id);

    const existingCategory = await db.select()
      .from(serviceCategories)
      .where(eq(serviceCategories.id, categoryId))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json(
        { error: 'Category not found', code: 'CATEGORY_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name && description === undefined) {
      return NextResponse.json(
        { error: 'At least one field (name or description) must be provided', code: 'NO_UPDATE_FIELDS' },
        { status: 400 }
      );
    }

    if (name !== undefined && name.trim() === '') {
      return NextResponse.json(
        { error: 'Category name cannot be empty', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    if (name) {
      const duplicateCheck = await db.select()
        .from(serviceCategories)
        .where(
          and(
            eq(serviceCategories.name, name.trim()),
            ne(serviceCategories.id, categoryId)
          )
        )
        .limit(1);

      if (duplicateCheck.length > 0) {
        return NextResponse.json(
          { error: 'A category with this name already exists', code: 'DUPLICATE_NAME' },
          { status: 409 }
        );
      }
    }

    const updateData: {
      name?: string;
      description?: string;
    } = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    const updatedCategory = await db.update(serviceCategories)
      .set(updateData)
      .where(eq(serviceCategories.id, categoryId))
      .returning();

    if (updatedCategory.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update category', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        category: updatedCategory[0]
      },
      message: 'Category updated successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdminAuth(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, code: 'AUTH_ERROR' },
        { status: authResult.status }
      );
    }

    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid category ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const categoryId = parseInt(id);

    const existingCategory = await db.select()
      .from(serviceCategories)
      .where(eq(serviceCategories.id, categoryId))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json(
        { error: 'Category not found', code: 'CATEGORY_NOT_FOUND' },
        { status: 404 }
      );
    }

    const categoryUsage = await db.select()
      .from(serviceCategoryMapping)
      .where(eq(serviceCategoryMapping.categoryId, categoryId))
      .limit(1);

    if (categoryUsage.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete category that is in use by services. Please remove all service associations first.', 
          code: 'CATEGORY_IN_USE' 
        },
        { status: 400 }
      );
    }

    const deletedCategory = await db.delete(serviceCategories)
      .where(eq(serviceCategories.id, categoryId))
      .returning();

    if (deletedCategory.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete category', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}