import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { serviceCategories, serviceCategoryMapping, user, session } from '@/db/schema';
import { eq, sql, asc } from 'drizzle-orm';

async function getAuthenticatedAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return null;
    }

    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, sessionRecord[0].userId))
      .limit(1);

    if (userRecord.length === 0 || userRecord[0].role !== 'admin') {
      return null;
    }

    return userRecord[0];
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAuthenticatedAdmin(request);
    
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' },
        { status: 401 }
      );
    }

    if (adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const categories = await db.select({
      id: serviceCategories.id,
      name: serviceCategories.name,
      description: serviceCategories.description,
      createdAt: serviceCategories.createdAt,
      serviceCount: sql<number>`CAST(COUNT(${serviceCategoryMapping.serviceId}) AS INTEGER)`,
    })
      .from(serviceCategories)
      .leftJoin(
        serviceCategoryMapping,
        eq(serviceCategories.id, serviceCategoryMapping.categoryId)
      )
      .groupBy(serviceCategories.id)
      .orderBy(asc(serviceCategories.name));

    return NextResponse.json({
      success: true,
      data: {
        categories: categories.map(cat => ({
          ...cat,
          serviceCount: cat.serviceCount || 0
        }))
      }
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAuthenticatedAdmin(request);
    
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' },
        { status: 401 }
      );
    }

    if (adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category name is required', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: 'Category name must not exceed 100 characters', code: 'NAME_TOO_LONG' },
        { status: 400 }
      );
    }

    if (description && typeof description === 'string' && description.length > 500) {
      return NextResponse.json(
        { error: 'Description must not exceed 500 characters', code: 'DESCRIPTION_TOO_LONG' },
        { status: 400 }
      );
    }

    const existingCategory = await db.select()
      .from(serviceCategories)
      .where(eq(serviceCategories.name, trimmedName))
      .limit(1);

    if (existingCategory.length > 0) {
      return NextResponse.json(
        { error: 'Category with this name already exists', code: 'DUPLICATE_NAME' },
        { status: 409 }
      );
    }

    const newCategory = await db.insert(serviceCategories)
      .values({
        name: trimmedName,
        description: description?.trim() || null,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: { category: newCategory[0] },
        message: 'Category created successfully'
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