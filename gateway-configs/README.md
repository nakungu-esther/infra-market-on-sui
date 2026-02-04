# API Gateway Integration Guide

This directory contains configuration examples for integrating the Sui Discovery platform with popular API gateways for request validation and usage tracking.

## Overview

The Sui Discovery platform provides a complete API gateway validation system that:

1. **Validates Entitlements**: Checks if the requesting client has valid access
2. **Tracks Usage**: Monitors API consumption and quota limits
3. **Enforces Quotas**: Blocks requests when limits are exceeded
4. **Real-time Updates**: Provides live usage statistics

## Architecture

```
Client Request → API Gateway → Validation Service → Protected API
                      ↓
                Usage Tracking
```

## Supported Gateways

### 1. NGINX (nginx.conf)

**Setup:**
```bash
# Copy configuration
sudo cp nginx.conf /etc/nginx/sites-available/sui-discovery

# Enable site
sudo ln -s /etc/nginx/sites-available/sui-discovery /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload NGINX
sudo nginx -s reload
```

**Configuration Points:**
- Set `$service_id` to your service ID
- Update `upstream validation_service` with your validation API URL
- Update `upstream protected_api` with your actual API URL
- Adjust rate limiting in `limit_req_zone`

**Features:**
- Pre-request validation via `auth_request`
- Automatic usage tracking via `post_action`
- Quota headers in responses
- Rate limiting

### 2. HAProxy (haproxy.cfg)

**Setup:**
```bash
# Copy configuration
sudo cp haproxy.cfg /etc/haproxy/haproxy.cfg

# Install Lua (required for validation)
sudo apt-get install lua5.3 liblua5.3-dev

# Copy Lua validation script (see comments in haproxy.cfg)
sudo cp validation.lua /etc/haproxy/validation.lua

# Test configuration
sudo haproxy -c -f /etc/haproxy/haproxy.cfg

# Restart HAProxy
sudo systemctl restart haproxy
```

**Configuration Points:**
- Update `backend validation_service` with validation API URL
- Update `backend protected_api` with actual API URL
- Implement Lua script for entitlement validation
- Set service ID in frontend config

**Features:**
- Lua-based validation
- Header extraction and forwarding
- Quota tracking
- Custom error responses

### 3. Envoy (envoy.yaml)

**Setup:**
```bash
# Run with Docker
docker run -d \
  -v $(pwd)/envoy.yaml:/etc/envoy/envoy.yaml \
  -p 80:80 \
  -p 9901:9901 \
  envoyproxy/envoy:v1.28-latest

# Or install locally
sudo apt-get install getenvoy-envoy
envoy -c envoy.yaml
```

**Configuration Points:**
- Update cluster endpoints for `protected_api` and `validation_service`
- Implement gRPC external authorization service
- Configure rate limiting service
- Adjust timeouts and health checks

**Features:**
- gRPC external authorization
- Built-in rate limiting
- Advanced observability
- Circuit breaking

## Validation API Endpoints

### POST /api/entitlements/verify

Validates if a client has access to the service.

**Request:**
```json
{
  "apiKey": "sui_test_abc123...",
  "serviceId": 1,
  "endpoint": "/v1/data",
  "method": "GET",
  "clientIp": "192.168.1.1"
}
```

**Response (Success):**
```json
{
  "allowed": true,
  "entitlementId": 123,
  "quotaRemaining": 950,
  "quotaLimit": 1000,
  "rateLimitRemaining": 100
}
```

**Response (Denied):**
```json
{
  "allowed": false,
  "error": "Quota exceeded",
  "errorCode": "QUOTA_EXCEEDED",
  "quotaRemaining": 0,
  "quotaLimit": 1000
}
```

### POST /api/usage/track

Tracks usage after a successful API call.

**Request:**
```json
{
  "entitlementId": 123,
  "endpoint": "/v1/data",
  "method": "GET",
  "statusCode": 200,
  "responseTime": 150,
  "bytesTransferred": 1024
}
```

**Response:**
```json
{
  "success": true,
  "quotaRemaining": 949
}
```

## API Key Format

API keys follow this format:
```
sui_[env]_[random32chars]

Examples:
- sui_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
- sui_prod_x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4
```

API keys can be provided in two ways:

1. **Authorization Header:**
   ```
   Authorization: Bearer sui_test_abc123...
   ```

2. **X-API-Key Header:**
   ```
   X-API-Key: sui_test_abc123...
   ```

## Testing

### Test NGINX Configuration

```bash
# Test validation endpoint
curl -X POST http://localhost/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "apiKey": "YOUR_API_KEY",
    "serviceId": 1,
    "endpoint": "/test",
    "method": "GET"
  }'

# Test protected endpoint
curl http://localhost/api/test \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Test with Custom Headers

```bash
# View quota headers
curl -i http://localhost/api/test \
  -H "X-API-Key: YOUR_API_KEY"

# Response will include:
# X-Quota-Remaining: 950
# X-Quota-Limit: 1000
# X-Response-Time: 45ms
```

## Monitoring

### NGINX Access Logs

```bash
tail -f /var/log/nginx/access.log
```

### HAProxy Stats

Access stats at: http://localhost:9000/stats

### Envoy Admin Interface

Access admin at: http://localhost:9901/

Useful endpoints:
- `/stats` - Metrics
- `/config_dump` - Current configuration
- `/clusters` - Cluster status

## Troubleshooting

### Common Issues

**401 Unauthorized:**
- Check API key format
- Verify API key is valid and not expired
- Ensure header is properly set

**403 Forbidden:**
- Quota may be exceeded
- Check entitlement validity period
- Verify service ID matches

**502 Bad Gateway:**
- Validation service may be down
- Check upstream configuration
- Verify network connectivity

**High Latency:**
- Optimize validation caching
- Use connection pooling
- Consider deploying validation service closer to gateway

### Debug Mode

Enable debug logging in your gateway:

**NGINX:**
```nginx
error_log /var/log/nginx/error.log debug;
```

**HAProxy:**
```
global
    log stdout format raw local0 debug
```

**Envoy:**
```yaml
admin:
  access_log_path: /dev/stdout
```

## Performance Optimization

1. **Cache Validation Results**: Implement short-lived caching (5-10 seconds)
2. **Connection Pooling**: Reuse connections to validation service
3. **Async Tracking**: Track usage asynchronously without blocking responses
4. **Rate Limiting**: Apply rate limits at gateway level
5. **Health Checks**: Monitor validation service health

## Security Best Practices

1. **HTTPS Only**: Always use TLS for API traffic
2. **API Key Rotation**: Implement regular key rotation
3. **IP Allowlisting**: Restrict validation API to gateway IPs only
4. **Audit Logging**: Log all validation requests
5. **DDoS Protection**: Implement rate limiting and throttling

## Support

For issues or questions:
- GitHub: [repository URL]
- Email: support@suidiscovery.com
- Docs: [documentation URL]
