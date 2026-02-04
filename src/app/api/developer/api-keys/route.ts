import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { apiKeys, entitlements, services, session, user } from '@/db/schema';
import { eq, and, desc, lt } from 'drizzle-orm';
import crypto from 'crypto';

async function validateSession(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const sessions = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessions.length === 0) {
      return null;
    }

    const userSession = sessions[0];
    const now = new Date();
    
    if (userSession.expiresAt <= now) {
      return null;
    }

    return userSession.userId;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

async function validateDeveloperRole(userId: string) {
  try {
    const users = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (users.length === 0) {
      return false;
    }

    return users[0].role === 'developer';
  } catch (error) {
    console.error('Role validation error:', error);
    return false;
  }
}

function maskApiKey(keyValue: string): string {
  if (keyValue.length <= 8) {
    return '****';
  }
  const lastFour = keyValue.slice(-4);
  return `sk_****...${lastFour}`;
}

async function generateUniqueApiKey(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const keyValue = 'sk_' + crypto.randomBytes(32).toString('hex');
    
    const existing = await db.select()
      .from(apiKeys)
      .where(eq(apiKeys.keyValue, keyValue))
      .limit(1);

    if (existing.length === 0) {
      return keyValue;
    }

    attempts++;
  }

  throw new Error('Failed to generate unique API key after multiple attempts');
}

export async function GET(request: NextRequest) {
  try {
    const userId = await validateSession(request);
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED' 
      }, { status: 401 });
    }

    const isDeveloper = await validateDeveloperRole(userId);
    if (!isDeveloper) {
      return NextResponse.json({ 
        error: 'Developer role required',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const serviceIdParam = searchParams.get('serviceId');
    const isActiveParam = searchParams.get('isActive');

    let query = db.select({
      id: apiKeys.id,
      keyName: apiKeys.keyName,
      serviceId: apiKeys.serviceId,
      serviceName: services.name,
      entitlementId: apiKeys.entitlementId,
      keyValue: apiKeys.keyValue,
      isActive: apiKeys.isActive,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
      expiresAt: apiKeys.expiresAt,
    })
      .from(apiKeys)
      .leftJoin(services, eq(apiKeys.serviceId, services.id))
      .leftJoin(entitlements, eq(apiKeys.entitlementId, entitlements.id))
      .where(eq(apiKeys.userId, userId))
      .$dynamic();

    if (serviceIdParam) {
      const serviceId = parseInt(serviceIdParam);
      if (isNaN(serviceId)) {
        return NextResponse.json({ 
          error: 'Invalid serviceId parameter',
          code: 'INVALID_SERVICE_ID' 
        }, { status: 400 });
      }
      query = query.where(and(
        eq(apiKeys.userId, userId),
        eq(apiKeys.serviceId, serviceId)
      ));
    }

    if (isActiveParam !== null) {
      const isActive = isActiveParam === 'true';
      const currentConditions = serviceIdParam 
        ? and(
            eq(apiKeys.userId, userId),
            eq(apiKeys.serviceId, parseInt(serviceIdParam)),
            eq(apiKeys.isActive, isActive)
          )
        : and(
            eq(apiKeys.userId, userId),
            eq(apiKeys.isActive, isActive)
          );
      query = query.where(currentConditions);
    }

    const results = await query.orderBy(desc(apiKeys.createdAt));

    const now = new Date();
    const apiKeysWithStatus = results.map(key => {
      const isExpired = key.expiresAt ? new Date(key.expiresAt) < now : false;
      return {
        id: key.id,
        keyName: key.keyName,
        serviceId: key.serviceId,
        serviceName: key.serviceName,
        entitlementId: key.entitlementId,
        keyValueMasked: maskApiKey(key.keyValue),
        isActive: key.isActive,
        lastUsedAt: key.lastUsedAt,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt,
        isExpired,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        apiKeys: apiKeysWithStatus,
        count: apiKeysWithStatus.length,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await validateSession(request);
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED' 
      }, { status: 401 });
    }

    const isDeveloper = await validateDeveloperRole(userId);
    if (!isDeveloper) {
      return NextResponse.json({ 
        error: 'Developer role required',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { serviceId, entitlementId, keyName, expiresAt } = body;

    if (!serviceId || isNaN(parseInt(serviceId))) {
      return NextResponse.json({ 
        error: 'Valid serviceId is required',
        code: 'MISSING_SERVICE_ID' 
      }, { status: 400 });
    }

    if (!entitlementId || isNaN(parseInt(entitlementId))) {
      return NextResponse.json({ 
        error: 'Valid entitlementId is required',
        code: 'MISSING_ENTITLEMENT_ID' 
      }, { status: 400 });
    }

    if (!keyName || typeof keyName !== 'string' || keyName.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Valid keyName is required',
        code: 'MISSING_KEY_NAME' 
      }, { status: 400 });
    }

    if (keyName.trim().length > 100) {
      return NextResponse.json({ 
        error: 'Key name must not exceed 100 characters',
        code: 'KEY_NAME_TOO_LONG' 
      }, { status: 400 });
    }

    if (expiresAt && isNaN(Date.parse(expiresAt))) {
      return NextResponse.json({ 
        error: 'Invalid expiresAt date format',
        code: 'INVALID_EXPIRES_AT' 
      }, { status: 400 });
    }

    const serviceIdInt = parseInt(serviceId);
    const entitlementIdInt = parseInt(entitlementId);

    const serviceExists = await db.select()
      .from(services)
      .where(eq(services.id, serviceIdInt))
      .limit(1);

    if (serviceExists.length === 0) {
      return NextResponse.json({ 
        error: 'Service not found',
        code: 'SERVICE_NOT_FOUND' 
      }, { status: 404 });
    }

    const entitlementRecords = await db.select()
      .from(entitlements)
      .where(eq(entitlements.id, entitlementIdInt))
      .limit(1);

    if (entitlementRecords.length === 0) {
      return NextResponse.json({ 
        error: 'Entitlement not found',
        code: 'ENTITLEMENT_NOT_FOUND' 
      }, { status: 404 });
    }

    const entitlement = entitlementRecords[0];

    if (entitlement.userId !== userId) {
      return NextResponse.json({ 
        error: 'Invalid or inactive entitlement',
        code: 'INVALID_ENTITLEMENT' 
      }, { status: 403 });
    }

    if (!entitlement.isActive) {
      return NextResponse.json({ 
        error: 'Invalid or inactive entitlement',
        code: 'INACTIVE_ENTITLEMENT' 
      }, { status: 403 });
    }

    if (entitlement.serviceId !== serviceIdInt) {
      return NextResponse.json({ 
        error: 'Invalid or inactive entitlement',
        code: 'SERVICE_MISMATCH' 
      }, { status: 403 });
    }

    const keyValue = await generateUniqueApiKey();

    const newApiKey = await db.insert(apiKeys)
      .values({
        userId,
        serviceId: serviceIdInt,
        entitlementId: entitlementIdInt,
        keyValue,
        keyName: keyName.trim(),
        isActive: true,
        lastUsedAt: null,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt || null,
      })
      .returning();

    const serviceRecord = serviceExists[0];

    return NextResponse.json({
      success: true,
      message: 'API key created successfully',
      data: {
        apiKey: {
          id: newApiKey[0].id,
          keyName: newApiKey[0].keyName,
          serviceId: newApiKey[0].serviceId,
          serviceName: serviceRecord.name,
          entitlementId: newApiKey[0].entitlementId,
          keyValue: newApiKey[0].keyValue,
          isActive: newApiKey[0].isActive,
          createdAt: newApiKey[0].createdAt,
          expiresAt: newApiKey[0].expiresAt,
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}