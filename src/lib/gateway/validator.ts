/**
 * API Gateway Request Validator
 * 
 * This module provides entitlement validation and quota tracking
 * for API gateway integration (NGINX, HAProxy, Envoy, etc.)
 */

export interface ValidationRequest {
  apiKey: string;
  serviceId: number;
  endpoint: string;
  method: string;
  clientIp?: string;
  userAgent?: string;
}

export interface ValidationResponse {
  allowed: boolean;
  entitlementId?: number;
  quotaRemaining?: number;
  quotaLimit?: number;
  rateLimitRemaining?: number;
  error?: string;
  errorCode?: string;
}

export interface UsageTrackingRequest {
  entitlementId: number;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  bytesTransferred: number;
}

/**
 * Validates API request against entitlements
 */
export async function validateRequest(
  request: ValidationRequest,
  bearerToken?: string
): Promise<ValidationResponse> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    const response = await fetch('/api/entitlements/verify', {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        allowed: false,
        error: error.error || 'Validation failed',
        errorCode: error.code || 'VALIDATION_ERROR',
      };
    }

    const data = await response.json();
    return {
      allowed: data.allowed,
      entitlementId: data.entitlementId,
      quotaRemaining: data.quotaRemaining,
      quotaLimit: data.quotaLimit,
      rateLimitRemaining: data.rateLimitRemaining,
    };
  } catch (error) {
    console.error('Validation request failed:', error);
    return {
      allowed: false,
      error: 'Internal validation error',
      errorCode: 'INTERNAL_ERROR',
    };
  }
}

/**
 * Tracks usage after successful API call
 */
export async function trackUsage(
  request: UsageTrackingRequest,
  bearerToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    const response = await fetch('/api/usage/track', {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || 'Usage tracking failed',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Usage tracking failed:', error);
    return {
      success: false,
      error: 'Internal tracking error',
    };
  }
}

/**
 * Validates API key format
 */
export function validateApiKeyFormat(apiKey: string): boolean {
  // API key format: sui_[env]_[random32chars]
  const pattern = /^sui_(test|prod)_[a-zA-Z0-9]{32}$/;
  return pattern.test(apiKey);
}

/**
 * Extracts API key from various header formats
 */
export function extractApiKey(headers: Headers): string | null {
  // Try Authorization header: Bearer <api_key>
  const authHeader = headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try X-API-Key header
  const apiKeyHeader = headers.get('X-API-Key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  return null;
}
