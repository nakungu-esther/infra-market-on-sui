import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface GatewayContext {
  userId?: string;
  tier?: string;
  metadata: Record<string, any>;
}

export interface ValidationConfig {
  requiredHeaders?: string[];
  jwtSecret?: string;
}

/**
 * JWT verification middleware for API routes
 */
export function verifyToken(req: NextRequest, jwtSecret: string): { valid: boolean; user?: JwtPayload; error?: string } {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    return { valid: false, error: 'Missing authorization header' };
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    return { valid: true, user: decoded };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Invalid token' };
  }
}

/**
 * Request validation helper
 */
export function validateRequest(req: NextRequest, config: ValidationConfig): { valid: boolean; error?: string } {
  // Validate required headers
  if (config.requiredHeaders) {
    for (const header of config.requiredHeaders) {
      if (!req.headers.get(header.toLowerCase())) {
        return { valid: false, error: `Missing header: ${header}` };
      }
    }
  }

  return { valid: true };
}

/**
 * Extract user ID from request
 */
export function extractUserId(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  try {
    const decoded = jwt.decode(token) as JwtPayload;
    return decoded?.sub || decoded?.userId || null;
  } catch {
    return null;
  }
}

/**
 * Create error response
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Create success response with headers
 */
export function successResponse(data: any, headers?: Record<string, string>) {
  const response = NextResponse.json(data);
  
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}
