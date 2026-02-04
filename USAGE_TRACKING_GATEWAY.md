# Usage Tracking & Request Validation Gateway Integration

This document provides comprehensive guidance for integrating usage tracking and request validation with common API gateways (HAProxy, Envoy, NGINX, and custom gateways).

## Architecture Overview

```
Client Request → API Gateway → Validation Service → Your Service
                      ↓
                Usage Logging
```

## Core Components

### 1. Entitlement Validation

Before allowing any request to reach your service, validate the client's entitlement:

```bash
GET /api/entitlements/verify?apiKey={KEY}&serviceId={ID}
Authorization: Bearer {API_KEY}
```

**Response:**
```json
{
  "valid": true,
  "entitlementId": 123,
  "userId": "user_abc",
  "quotaLimit": 1000000,
  "quotaUsed": 500000,
  "quotaRemaining": 500000,
  "validUntil": "2024-12-31T23:59:59Z"
}
```

### 2. Usage Tracking

After a successful request, track usage:

```bash
POST /api/usage/track
Authorization: Bearer {API_KEY}
Content-Type: application/json

{
  "entitlementId": 123,
  "serviceId": 1,
  "endpoint": "/api/rpc",
  "requestsCount": 1,
  "ipAddress": "192.168.1.1",
  "userAgent": "MyApp/1.0"
}
```

## Integration Examples

### NGINX (Using Lua)

```nginx
http {
    lua_shared_dict entitlement_cache 10m;
    
    server {
        listen 80;
        server_name api.myservice.com;

        location /api/ {
            # Extract API key from header
            set $api_key $http_x_api_key;
            
            # Validate entitlement
            access_by_lua_block {
                local http = require "resty.http"
                local cjson = require "cjson"
                local cache = ngx.shared.entitlement_cache
                
                local api_key = ngx.var.api_key
                if not api_key then
                    ngx.status = 401
                    ngx.say(cjson.encode({error = "API key required"}))
                    return ngx.exit(401)
                end
                
                -- Check cache first
                local cache_key = "entitlement:" .. api_key
                local cached_data = cache:get(cache_key)
                
                if not cached_data then
                    -- Validate with platform
                    local httpc = http.new()
                    local res, err = httpc:request_uri(
                        "https://platform.example.com/api/entitlements/verify?apiKey=" .. api_key,
                        {
                            headers = {
                                ["Authorization"] = "Bearer " .. api_key
                            }
                        }
                    )
                    
                    if not res or res.status ~= 200 then
                        ngx.status = 403
                        ngx.say(cjson.encode({error = "Invalid API key"}))
                        return ngx.exit(403)
                    end
                    
                    local data = cjson.decode(res.body)
                    if not data.valid then
                        ngx.status = 403
                        ngx.say(cjson.encode({error = "Entitlement expired or quota exceeded"}))
                        return ngx.exit(403)
                    end
                    
                    -- Cache for 60 seconds
                    cache:set(cache_key, res.body, 60)
                    cached_data = res.body
                end
                
                -- Set entitlement data for logging
                local entitlement = cjson.decode(cached_data)
                ngx.var.entitlement_id = entitlement.entitlementId
                ngx.var.user_id = entitlement.userId
            }
            
            # Proxy to your service
            proxy_pass http://backend;
            
            # Log usage after response
            log_by_lua_block {
                local http = require "resty.http"
                local cjson = require "cjson"
                
                local entitlement_id = ngx.var.entitlement_id
                if entitlement_id then
                    local httpc = http.new()
                    httpc:request_uri(
                        "https://platform.example.com/api/usage/track",
                        {
                            method = "POST",
                            headers = {
                                ["Content-Type"] = "application/json",
                                ["Authorization"] = "Bearer " .. ngx.var.api_key
                            },
                            body = cjson.encode({
                                entitlementId = tonumber(entitlement_id),
                                serviceId = 1,
                                endpoint = ngx.var.uri,
                                requestsCount = 1,
                                ipAddress = ngx.var.remote_addr,
                                userAgent = ngx.var.http_user_agent
                            })
                        }
                    )
                end
            }
        }
    }
}
```

### HAProxy

```haproxy
global
    lua-load /etc/haproxy/entitlement.lua

frontend api_frontend
    bind *:80
    mode http
    
    # Extract API key
    http-request set-var(txn.api_key) req.hdr(X-API-Key)
    
    # Validate entitlement
    http-request lua.validate_entitlement
    
    default_backend api_backend

backend api_backend
    mode http
    balance roundrobin
    
    # Track usage after response
    http-response lua.track_usage
    
    server api1 backend1.local:8080 check
    server api2 backend2.local:8080 check
```

**entitlement.lua:**
```lua
core.register_action("validate_entitlement", { "http-req" }, function(txn)
    local api_key = txn.sf:req_hdr("X-API-Key")
    
    if not api_key then
        txn:set_var("txn.validation_failed", "true")
        txn.res:send(401, '{"error":"API key required"}', "application/json")
        return
    end
    
    -- Make HTTP request to validation service
    local socket = core.tcp()
    socket:settimeout(5)
    socket:connect("platform.example.com", 443)
    
    local request = string.format(
        "GET /api/entitlements/verify?apiKey=%s HTTP/1.1\\r\\n" ..
        "Host: platform.example.com\\r\\n" ..
        "Authorization: Bearer %s\\r\\n" ..
        "\\r\\n",
        api_key, api_key
    )
    
    socket:send(request)
    local response = socket:receive("*a")
    socket:close()
    
    -- Parse response (simplified)
    if not response:match('"valid":true') then
        txn.res:send(403, '{"error":"Invalid or expired entitlement"}', "application/json")
        return
    end
    
    -- Extract entitlement ID for logging
    local entitlement_id = response:match('"entitlementId":(%d+)')
    txn:set_var("txn.entitlement_id", entitlement_id)
end)

core.register_action("track_usage", { "http-res" }, function(txn)
    local entitlement_id = txn:get_var("txn.entitlement_id")
    
    if entitlement_id then
        -- Asynchronously track usage (fire and forget)
        local socket = core.tcp()
        socket:settimeout(1)
        socket:connect("platform.example.com", 443)
        
        local body = string.format(
            '{"entitlementId":%s,"serviceId":1,"endpoint":"%s","requestsCount":1}',
            entitlement_id,
            txn.sf:path()
        )
        
        local request = string.format(
            "POST /api/usage/track HTTP/1.1\\r\\n" ..
            "Host: platform.example.com\\r\\n" ..
            "Content-Type: application/json\\r\\n" ..
            "Content-Length: %d\\r\\n" ..
            "\\r\\n%s",
            #body, body
        )
        
        socket:send(request)
        socket:close()
    end
end)
```

### Envoy

```yaml
static_resources:
  listeners:
  - name: listener_0
    address:
      socket_address:
        address: 0.0.0.0
        port_value: 80
    filter_chains:
    - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          stat_prefix: ingress_http
          route_config:
            name: local_route
            virtual_hosts:
            - name: backend
              domains: ["*"]
              routes:
              - match:
                  prefix: "/api/"
                route:
                  cluster: api_backend
          http_filters:
          # Custom filter for entitlement validation
          - name: envoy.filters.http.lua
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.http.lua.v3.Lua
              inline_code: |
                function envoy_on_request(request_handle)
                  local api_key = request_handle:headers():get("X-API-Key")
                  
                  if not api_key then
                    request_handle:respond(
                      {[":status"] = "401"},
                      '{"error":"API key required"}'
                    )
                    return
                  end
                  
                  -- Validate entitlement
                  local headers, body = request_handle:httpCall(
                    "validation_cluster",
                    {
                      [":method"] = "GET",
                      [":path"] = "/api/entitlements/verify?apiKey=" .. api_key,
                      [":authority"] = "platform.example.com",
                      ["Authorization"] = "Bearer " .. api_key
                    },
                    "",
                    5000
                  )
                  
                  if not body:match('"valid":true') then
                    request_handle:respond(
                      {[":status"] = "403"},
                      '{"error":"Invalid entitlement"}'
                    )
                    return
                  end
                  
                  -- Store entitlement ID for logging
                  local entitlement_id = body:match('"entitlementId":(%d+)')
                  request_handle:streamInfo():dynamicMetadata():set(
                    "envoy.lua",
                    "entitlement_id",
                    entitlement_id
                  )
                end
                
                function envoy_on_response(response_handle)
                  local entitlement_id = response_handle:streamInfo():dynamicMetadata():get("envoy.lua")["entitlement_id"]
                  
                  if entitlement_id then
                    -- Track usage asynchronously
                    local tracking_body = string.format(
                      '{"entitlementId":%s,"serviceId":1,"endpoint":"%s","requestsCount":1}',
                      entitlement_id,
                      response_handle:headers():get(":path")
                    )
                    
                    response_handle:httpCall(
                      "tracking_cluster",
                      {
                        [":method"] = "POST",
                        [":path"] = "/api/usage/track",
                        [":authority"] = "platform.example.com",
                        ["Content-Type"] = "application/json"
                      },
                      tracking_body,
                      1000
                    )
                  end
                end
          - name: envoy.filters.http.router
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router

  clusters:
  - name: api_backend
    type: STRICT_DNS
    lb_policy: ROUND_ROBIN
    load_assignment:
      cluster_name: api_backend
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: backend.local
                port_value: 8080
                
  - name: validation_cluster
    type: STRICT_DNS
    lb_policy: ROUND_ROBIN
    load_assignment:
      cluster_name: validation_cluster
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: platform.example.com
                port_value: 443
    transport_socket:
      name: envoy.transport_sockets.tls
      typed_config:
        "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext
        
  - name: tracking_cluster
    type: STRICT_DNS
    lb_policy: ROUND_ROBIN
    load_assignment:
      cluster_name: tracking_cluster
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: platform.example.com
                port_value: 443
    transport_socket:
      name: envoy.transport_sockets.tls
      typed_config:
        "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext
```

### Custom Node.js Middleware

```javascript
const axios = require('axios');

// Entitlement validation middleware
const validateEntitlement = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  try {
    // Validate entitlement
    const response = await axios.get(
      `https://platform.example.com/api/entitlements/verify?apiKey=${apiKey}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 5000
      }
    );
    
    if (!response.data.valid) {
      return res.status(403).json({ error: 'Invalid or expired entitlement' });
    }
    
    // Store entitlement data for usage tracking
    req.entitlement = response.data;
    next();
  } catch (error) {
    console.error('Entitlement validation error:', error);
    return res.status(403).json({ error: 'Entitlement validation failed' });
  }
};

// Usage tracking middleware
const trackUsage = (req, res, next) => {
  // Track usage after response is sent
  res.on('finish', async () => {
    if (req.entitlement && res.statusCode < 400) {
      try {
        await axios.post(
          'https://platform.example.com/api/usage/track',
          {
            entitlementId: req.entitlement.entitlementId,
            serviceId: 1,
            endpoint: req.path,
            requestsCount: 1,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          },
          {
            headers: { Authorization: `Bearer ${req.headers['x-api-key']}` },
            timeout: 1000
          }
        );
      } catch (error) {
        // Log but don't fail the request
        console.error('Usage tracking error:', error);
      }
    }
  });
  
  next();
};

// Apply middleware
app.use(validateEntitlement);
app.use(trackUsage);
```

## Best Practices

### 1. Caching

Cache entitlement validations to reduce latency:

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 }); // 60 seconds TTL

const validateEntitlementCached = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const cacheKey = `entitlement:${apiKey}`;
  
  // Check cache first
  let entitlement = cache.get(cacheKey);
  
  if (!entitlement) {
    // Fetch from API
    const response = await axios.get(`...`);
    entitlement = response.data;
    cache.set(cacheKey, entitlement);
  }
  
  req.entitlement = entitlement;
  next();
};
```

### 2. Async Usage Tracking

Track usage asynchronously to avoid blocking requests:

```javascript
const { Worker } = require('worker_threads');

const trackUsageAsync = (usageData) => {
  const worker = new Worker('./usage-tracker.js', {
    workerData: usageData
  });
  
  worker.on('error', (err) => console.error('Usage tracking error:', err));
  worker.on('exit', (code) => {
    if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
  });
};
```

### 3. Rate Limiting

Implement intelligent rate limiting based on quota:

```javascript
const rateLimit = require('express-rate-limit');

const createRateLimiter = (req, res, next) => {
  const { quotaLimit, quotaUsed } = req.entitlement;
  const remaining = quotaLimit - quotaUsed;
  
  // Dynamic rate limit based on remaining quota
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: Math.min(remaining, 100), // Max 100 per minute or remaining quota
    message: 'Rate limit exceeded'
  });
  
  limiter(req, res, next);
};
```

### 4. Error Handling

Gracefully handle validation service failures:

```javascript
const validateWithFallback = async (req, res, next) => {
  try {
    await validateEntitlement(req, res, next);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      // Validation service down - allow request but log
      console.error('Validation service unavailable');
      req.entitlement = { fallback: true };
      next();
    } else {
      res.status(503).json({ error: 'Service temporarily unavailable' });
    }
  }
};
```

## Monitoring & Observability

### Metrics to Track

1. **Validation Latency**: Time taken to validate entitlements
2. **Cache Hit Rate**: Percentage of cached validations
3. **Quota Utilization**: Average quota usage per service
4. **Failed Validations**: Number of rejected requests
5. **Usage Tracking Failures**: Missed usage logs

### Sample Prometheus Metrics

```javascript
const promClient = require('prom-client');

const validationDuration = new promClient.Histogram({
  name: 'entitlement_validation_duration_seconds',
  help: 'Duration of entitlement validations',
  labelNames: ['status']
});

const cacheHits = new promClient.Counter({
  name: 'entitlement_cache_hits_total',
  help: 'Number of cache hits'
});

const usageTrackingErrors = new promClient.Counter({
  name: 'usage_tracking_errors_total',
  help: 'Number of usage tracking errors'
});
```

## Testing

### Unit Test Example

```javascript
const { validateEntitlement } = require('./middleware');

describe('Entitlement Validation', () => {
  it('should reject requests without API key', async () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    
    await validateEntitlement(req, res, jest.fn());
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'API key required' });
  });
  
  it('should allow valid entitlement', async () => {
    // Mock axios
    axios.get = jest.fn().mockResolvedValue({
      data: { valid: true, entitlementId: 123 }
    });
    
    const req = { headers: { 'x-api-key': 'valid_key' } };
    const res = {};
    const next = jest.fn();
    
    await validateEntitlement(req, res, next);
    
    expect(req.entitlement).toBeDefined();
    expect(next).toHaveBeenCalled();
  });
});
```

## Deployment Checklist

- [ ] Configure API gateway with validation logic
- [ ] Set up caching layer (Redis/Memcached)
- [ ] Implement async usage tracking
- [ ] Add monitoring and alerting
- [ ] Test failover scenarios
- [ ] Document API key format and headers
- [ ] Set up rate limiting
- [ ] Configure logging and audit trails
- [ ] Test quota enforcement
- [ ] Prepare rollback plan

## Support

For integration support, contact:
- Platform API Documentation: https://platform.example.com/docs
- Support: support@platform.example.com
- GitHub Issues: https://github.com/platform/gateway-integration
