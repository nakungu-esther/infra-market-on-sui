-- HAProxy Lua script for entitlement verification
-- This script verifies user entitlements by calling the platform API

local http = require("socket.http")
local ltn12 = require("ltn12")
local json = require("json")

-- Configuration
local VERIFICATION_API = os.getenv("VERIFICATION_API_URL") or "http://localhost:3000/api/entitlements/verify"
local TRACKING_API = os.getenv("TRACKING_API_URL") or "http://localhost:3000/api/usage/track"
local API_TIMEOUT = 5 -- seconds

-- Verify entitlement function
core.register_action("verify_entitlement", { "http-req" }, function(txn)
    -- Extract headers
    local user_id = txn.sf:req_hdr("X-User-ID")
    local service_id = txn.sf:req_hdr("X-Service-ID")
    local endpoint = txn.sf:path()
    
    if not user_id or not service_id then
        txn.set_var(txn, "req.verification_failed", true)
        return
    end
    
    -- Prepare request body
    local request_body = json.encode({
        userId = user_id,
        serviceId = tonumber(service_id),
        endpoint = endpoint,
        ipAddress = txn.sf:src(),
        userAgent = txn.sf:req_hdr("User-Agent") or "unknown"
    })
    
    -- Make HTTP request to verification API
    local response_body = {}
    local res, code, response_headers = http.request{
        url = VERIFICATION_API,
        method = "POST",
        headers = {
            ["Content-Type"] = "application/json",
            ["Content-Length"] = tostring(#request_body)
        },
        source = ltn12.source.string(request_body),
        sink = ltn12.sink.table(response_body),
        timeout = API_TIMEOUT
    }
    
    -- Parse response
    if code == 200 then
        local response = json.decode(table.concat(response_body))
        if response.allowed then
            -- Store entitlement ID for tracking
            txn.set_var(txn, "req.entitlement_id", response.entitlementId)
            txn.set_var(txn, "req.verification_failed", false)
        else
            txn.set_var(txn, "req.verification_failed", true)
        end
    elseif code == 429 then
        -- Quota exceeded
        txn.set_var(txn, "req.quota_exceeded", true)
    else
        -- Verification failed
        txn.set_var(txn, "req.verification_failed", true)
    end
end)

-- Track usage function
core.register_action("track_usage", { "http-req" }, function(txn)
    local entitlement_id = txn.get_var(txn, "req.entitlement_id")
    local user_id = txn.sf:req_hdr("X-User-ID")
    local service_id = txn.sf:req_hdr("X-Service-ID")
    local endpoint = txn.sf:path()
    
    if not entitlement_id or not user_id or not service_id then
        return
    end
    
    -- Prepare request body
    local request_body = json.encode({
        entitlementId = tonumber(entitlement_id),
        userId = user_id,
        serviceId = tonumber(service_id),
        endpoint = endpoint,
        requestsCount = 1,
        ipAddress = txn.sf:src(),
        userAgent = txn.sf:req_hdr("User-Agent") or "unknown"
    })
    
    -- Make async HTTP request to tracking API (fire and forget)
    http.request{
        url = TRACKING_API,
        method = "POST",
        headers = {
            ["Content-Type"] = "application/json",
            ["Content-Length"] = tostring(#request_body)
        },
        source = ltn12.source.string(request_body),
        timeout = API_TIMEOUT
    }
end)
