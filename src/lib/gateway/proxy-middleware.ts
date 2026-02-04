/**
 * Standalone Proxy Middleware for API Gateway Integration
 * 
 * This can be deployed as a sidecar or reverse proxy
 * Compatible with Express, Fastify, or standalone HTTP server
 */

import { validateRequest, trackUsage, extractApiKey } from './validator';

export interface ProxyConfig {
  upstreamUrl: string;
  serviceId: number;
  validationEndpoint: string;
  trackingEndpoint: string;
  rateLimitWindow?: number; // seconds
  rateLimitMax?: number;
}

export interface ProxyRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
  ip?: string;
}

export interface ProxyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  allowed: boolean;
  error?: string;
}

/**
 * Main proxy handler that validates and forwards requests
 */
export async function proxyHandler(
  request: ProxyRequest,
  config: ProxyConfig
): Promise<ProxyResponse> {
  const startTime = Date.now();

  // Extract API key from headers
  const apiKey = request.headers['authorization']?.replace('Bearer ', '') ||
                  request.headers['x-api-key'] ||
                  '';

  if (!apiKey) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Missing API key' },
      allowed: false,
      error: 'MISSING_API_KEY',
    };
  }

  // Validate request against entitlements
  const validation = await validateRequest(
    {
      apiKey,
      serviceId: config.serviceId,
      endpoint: request.path,
      method: request.method,
      clientIp: request.ip,
      userAgent: request.headers['user-agent'],
    },
    apiKey
  );

  if (!validation.allowed) {
    return {
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(validation.rateLimitRemaining || 0),
        'X-Quota-Remaining': String(validation.quotaRemaining || 0),
        'X-Quota-Limit': String(validation.quotaLimit || 0),
      },
      body: {
        error: validation.error || 'Access denied',
        code: validation.errorCode,
        quotaRemaining: validation.quotaRemaining,
        quotaLimit: validation.quotaLimit,
      },
      allowed: false,
      error: validation.errorCode,
    };
  }

  // Forward request to upstream service
  try {
    const upstreamResponse = await fetch(
      `${config.upstreamUrl}${request.path}`,
      {
        method: request.method,
        headers: {
          ...request.headers,
          'X-Forwarded-For': request.ip || '',
          'X-Original-API-Key': apiKey,
        },
        body: request.body ? JSON.stringify(request.body) : undefined,
      }
    );

    const responseBody = await upstreamResponse.json().catch(() => ({}));
    const responseTime = Date.now() - startTime;

    // Track usage asynchronously (don't block response)
    if (validation.entitlementId) {
      trackUsage(
        {
          entitlementId: validation.entitlementId,
          endpoint: request.path,
          method: request.method,
          statusCode: upstreamResponse.status,
          responseTime,
          bytesTransferred: JSON.stringify(responseBody).length,
        },
        apiKey
      ).catch((err) => console.error('Usage tracking failed:', err));
    }

    return {
      statusCode: upstreamResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(validation.rateLimitRemaining || 0),
        'X-Quota-Remaining': String((validation.quotaRemaining || 0) - 1),
        'X-Quota-Limit': String(validation.quotaLimit || 0),
        'X-Response-Time': `${responseTime}ms`,
      },
      body: responseBody,
      allowed: true,
    };
  } catch (error) {
    console.error('Upstream request failed:', error);
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Upstream service unavailable',
        code: 'UPSTREAM_ERROR',
      },
      allowed: true,
      error: 'UPSTREAM_ERROR',
    };
  }
}

/**
 * Express.js middleware
 */
export function createExpressMiddleware(config: ProxyConfig) {
  return async (req: any, res: any, next: any) => {
    const proxyRequest: ProxyRequest = {
      method: req.method,
      path: req.path,
      headers: req.headers,
      body: req.body,
      ip: req.ip || req.connection.remoteAddress,
    };

    const response = await proxyHandler(proxyRequest, config);

    // Set response headers
    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    res.status(response.statusCode).json(response.body);
  };
}

/**
 * Standalone HTTP server
 */
export async function createStandaloneProxy(
  config: ProxyConfig,
  port: number = 8080
) {
  const http = await import('http');

  const server = http.createServer(async (req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      const proxyRequest: ProxyRequest = {
        method: req.method || 'GET',
        path: req.url || '/',
        headers: req.headers as Record<string, string>,
        body: body ? JSON.parse(body) : undefined,
        ip: req.socket.remoteAddress,
      };

      const response = await proxyHandler(proxyRequest, config);

      // Set response headers
      Object.entries(response.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      res.statusCode = response.statusCode;
      res.end(JSON.stringify(response.body));
    });
  });

  server.listen(port, () => {
    console.log(`Proxy server listening on port ${port}`);
    console.log(`Forwarding to: ${config.upstreamUrl}`);
    console.log(`Service ID: ${config.serviceId}`);
  });

  return server;
}
