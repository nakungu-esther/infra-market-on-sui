import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { usageLogs, services, user } from '@/db/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const serviceId = searchParams.get('serviceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const targetUserId = searchParams.get('userId');

    // Determine if user is admin
    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);

    const isAdmin = userRecord.length > 0 && userRecord[0].role === 'admin';

    // Determine which userId to filter by
    let filterUserId = currentUser.id;
    if (isAdmin && targetUserId) {
      filterUserId = targetUserId;
    } else if (isAdmin && !targetUserId) {
      // Admin requesting global stats - no userId filter
      filterUserId = null;
    }

    // Build base where conditions
    const whereConditions = [];
    
    if (filterUserId) {
      whereConditions.push(eq(usageLogs.userId, filterUserId));
    }
    
    if (serviceId) {
      whereConditions.push(eq(usageLogs.serviceId, parseInt(serviceId)));
    }
    
    if (startDate) {
      whereConditions.push(gte(usageLogs.timestamp, startDate));
    }
    
    if (endDate) {
      whereConditions.push(lte(usageLogs.timestamp, endDate));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get all usage logs for the filtered criteria
    const logs = await db.select()
      .from(usageLogs)
      .where(whereClause);

    if (logs.length === 0) {
      return NextResponse.json({
        totalRequests: 0,
        uniqueServices: 0,
        uniqueEndpoints: 0,
        requestsByService: [],
        requestsByEndpoint: [],
        requestsByDay: [],
        averageRequestsPerDay: 0
      });
    }

    // Calculate total requests
    const totalRequests = logs.reduce((sum, log) => sum + log.requestsCount, 0);

    // Calculate unique services
    const uniqueServiceIds = new Set(logs.map(log => log.serviceId));
    const uniqueServices = uniqueServiceIds.size;

    // Calculate unique endpoints
    const uniqueEndpointSet = new Set(logs.map(log => log.endpoint));
    const uniqueEndpoints = uniqueEndpointSet.size;

    // Get requests by service with service names
    const serviceMap = new Map<number, { requestCount: number; serviceName: string }>();
    
    for (const log of logs) {
      if (!serviceMap.has(log.serviceId)) {
        const serviceRecord = await db.select()
          .from(services)
          .where(eq(services.id, log.serviceId))
          .limit(1);
        
        serviceMap.set(log.serviceId, {
          requestCount: log.requestsCount,
          serviceName: serviceRecord.length > 0 ? serviceRecord[0].name : `Service ${log.serviceId}`
        });
      } else {
        const current = serviceMap.get(log.serviceId)!;
        current.requestCount += log.requestsCount;
      }
    }

    const requestsByService = Array.from(serviceMap.entries())
      .map(([serviceId, data]) => ({
        serviceId,
        serviceName: data.serviceName,
        requestCount: data.requestCount
      }))
      .sort((a, b) => b.requestCount - a.requestCount);

    // Get requests by endpoint (top 10)
    const endpointMap = new Map<string, number>();
    
    for (const log of logs) {
      if (!endpointMap.has(log.endpoint)) {
        endpointMap.set(log.endpoint, log.requestsCount);
      } else {
        endpointMap.set(log.endpoint, endpointMap.get(log.endpoint)! + log.requestsCount);
      }
    }

    const requestsByEndpoint = Array.from(endpointMap.entries())
      .map(([endpoint, requestCount]) => ({ endpoint, requestCount }))
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, 10);

    // Get requests by day
    const dayMap = new Map<string, number>();
    
    for (const log of logs) {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      if (!dayMap.has(date)) {
        dayMap.set(date, log.requestsCount);
      } else {
        dayMap.set(date, dayMap.get(date)! + log.requestsCount);
      }
    }

    const requestsByDay = Array.from(dayMap.entries())
      .map(([date, requestCount]) => ({ date, requestCount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate average requests per day
    const numberOfDays = requestsByDay.length > 0 ? requestsByDay.length : 1;
    const averageRequestsPerDay = Math.round((totalRequests / numberOfDays) * 100) / 100;

    return NextResponse.json({
      totalRequests,
      uniqueServices,
      uniqueEndpoints,
      requestsByService,
      requestsByEndpoint,
      requestsByDay,
      averageRequestsPerDay
    });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}