import { db } from '@/db';
import { usageLogs, entitlements } from '@/db/schema';

async function main() {
    // Query entitlements to get actual IDs and related data
    const existingEntitlements = await db.select({
        id: entitlements.id,
        userId: entitlements.userId,
        serviceId: entitlements.serviceId,
        quotaUsed: entitlements.quotaUsed,
    }).from(entitlements);

    if (existingEntitlements.length === 0) {
        console.log('⚠️ No entitlements found. Please seed entitlements first.');
        return;
    }

    const endpoints = [
        '/rpc/getLatestBlock',
        '/rpc/getTransaction',
        '/rpc/getBalance',
        '/rpc/sendTransaction',
        '/rpc/estimateGas',
        '/index/query',
        '/index/events',
        '/index/transactions',
        '/index/blocks',
        '/index/search',
        '/oracle/price',
        '/oracle/feed',
        '/oracle/latest',
        '/oracle/historical',
        '/oracle/subscribe',
        '/storage/upload',
        '/storage/download',
        '/storage/list',
        '/storage/delete',
        '/storage/metadata',
        '/health',
        '/status',
        '/ping',
    ];

    const ipAddresses = [
        '192.168.1.100',
        '10.0.0.50',
        '172.16.0.25',
        '203.0.113.42',
        '198.51.100.18',
        '192.168.1.150',
        '10.0.0.75',
        '172.16.0.30',
    ];

    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'PostmanRuntime/7.32.1',
        'curl/7.68.0',
        'Python/3.9 requests/2.26.0',
        'Node.js/16.14.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Go-http-client/1.1',
    ];

    const sampleUsageLogs = [];
    const now = new Date();

    for (const entitlement of existingEntitlements) {
        const logsPerEntitlement = Math.floor(Math.random() * 6) + 3; // 3-8 logs per entitlement
        const totalRequests = entitlement.quotaUsed || 0;
        let requestsAllocated = 0;

        for (let i = 0; i < logsPerEntitlement; i++) {
            const patternRoll = Math.random();
            let requestsCount;
            let timestamp;
            let endpoint;
            
            // Determine usage pattern
            if (patternRoll < 0.5) {
                // Regular daily usage (50%)
                const daysAgo = Math.floor(Math.random() * 30);
                timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
                timestamp.setHours(Math.floor(Math.random() * 24));
                timestamp.setMinutes(Math.floor(Math.random() * 60));
                requestsCount = Math.floor(Math.random() * 5) + 1;
                endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
            } else if (patternRoll < 0.7) {
                // Burst usage (20%)
                const daysAgo = Math.floor(Math.random() * 20);
                timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
                timestamp.setHours(Math.floor(Math.random() * 24));
                timestamp.setMinutes(Math.floor(Math.random() * 60));
                requestsCount = Math.floor(Math.random() * 41) + 10; // 10-50 requests
                endpoint = endpoints[Math.floor(Math.random() * 15)]; // Same type of endpoint
            } else if (patternRoll < 0.9) {
                // Testing/Development (20%)
                const daysAgo = Math.floor(Math.random() * 7);
                timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
                timestamp.setHours(Math.floor(Math.random() * 24));
                timestamp.setMinutes(Math.floor(Math.random() * 60));
                requestsCount = Math.floor(Math.random() * 2) + 1;
                endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
            } else {
                // Monitoring/Health checks (10%)
                const hoursAgo = Math.floor(Math.random() * 24 * 7);
                timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
                timestamp.setMinutes(0);
                requestsCount = 1;
                endpoint = ['/health', '/status', '/ping'][Math.floor(Math.random() * 3)];
            }

            // Ensure we don't exceed quotaUsed
            if (i === logsPerEntitlement - 1) {
                requestsCount = totalRequests - requestsAllocated;
                if (requestsCount <= 0) requestsCount = 1;
            } else {
                const remaining = totalRequests - requestsAllocated;
                const maxForThisLog = Math.min(requestsCount, remaining - (logsPerEntitlement - i - 1));
                requestsCount = Math.max(1, maxForThisLog);
            }

            requestsAllocated += requestsCount;

            sampleUsageLogs.push({
                entitlementId: entitlement.id,
                userId: entitlement.userId,
                serviceId: entitlement.serviceId,
                timestamp: timestamp.toISOString(),
                requestsCount,
                endpoint,
                ipAddress: ipAddresses[Math.floor(Math.random() * ipAddresses.length)],
                userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
                createdAt: timestamp.toISOString(),
            });

            if (requestsAllocated >= totalRequests) break;
        }
    }

    // Sort by timestamp (oldest first)
    sampleUsageLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    await db.insert(usageLogs).values(sampleUsageLogs);
    
    console.log(`✅ Usage logs seeder completed successfully - created ${sampleUsageLogs.length} usage log entries`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});