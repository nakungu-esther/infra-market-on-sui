import { db } from '@/db';
import { apiKeys, entitlements } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

async function main() {
    // Query active entitlements from database
    const activeEntitlements = await db
        .select()
        .from(entitlements)
        .where(eq(entitlements.isActive, true));

    if (activeEntitlements.length === 0) {
        console.log('⚠️ No active entitlements found. Please seed entitlements first.');
        return;
    }

    // Select 5-10 random active entitlements
    const shuffled = activeEntitlements.sort(() => 0.5 - Math.random());
    const selectedCount = Math.min(
        Math.floor(Math.random() * 6) + 5,
        activeEntitlements.length
    );
    const selectedEntitlements = shuffled.slice(0, selectedCount);

    const keyNames = [
        'Production API Key',
        'Development Key',
        'Staging Environment',
        'Testing Key',
        'Main Application Key',
        'CI/CD Pipeline Key',
        'Mobile App Integration',
        'Web Dashboard Key',
        'Analytics Service Key',
        'Backup Integration Key'
    ];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const sampleApiKeys = selectedEntitlements.map((entitlement, index) => {
        // Generate unique key value
        const keyValue = 'sk_' + crypto.randomBytes(32).toString('hex');

        // Random isActive (90% true, 10% false)
        const isActive = Math.random() < 0.9;

        // Random lastUsedAt
        let lastUsedAt = null;
        const lastUsedRand = Math.random();
        if (lastUsedRand > 0.2) {
            if (lastUsedRand < 0.8) {
                // Recent timestamp (1-7 days ago)
                const daysAgo = Math.floor(Math.random() * 7) + 1;
                lastUsedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
            } else {
                // Older timestamp (8-30 days ago)
                const daysAgo = Math.floor(Math.random() * 23) + 8;
                lastUsedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
            }
        }

        // CreatedAt within past 30 days, after entitlement creation
        const entitlementCreated = new Date(entitlement.createdAt);
        const minCreatedAt = entitlementCreated > thirtyDaysAgo ? entitlementCreated : thirtyDaysAgo;
        const createdAtTimestamp = minCreatedAt.getTime() + 
            Math.random() * (now.getTime() - minCreatedAt.getTime());
        const createdAt = new Date(createdAtTimestamp).toISOString();

        // ExpiresAt (70% null, 20% 90 days, 10% 365 days)
        let expiresAt = null;
        const expiresRand = Math.random();
        if (expiresRand > 0.7) {
            const createdDate = new Date(createdAt);
            if (expiresRand < 0.9) {
                // 90 days from createdAt
                expiresAt = new Date(createdDate.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
            } else {
                // 365 days from createdAt
                expiresAt = new Date(createdDate.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
            }
        }

        return {
            userId: entitlement.userId,
            serviceId: entitlement.serviceId,
            entitlementId: entitlement.id,
            keyValue,
            keyName: keyNames[index % keyNames.length],
            isActive,
            lastUsedAt,
            createdAt,
            expiresAt,
        };
    });

    await db.insert(apiKeys).values(sampleApiKeys);

    console.log(`✅ API Keys seeder completed successfully - Created ${sampleApiKeys.length} API keys`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});