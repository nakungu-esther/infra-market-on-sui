import { db } from '@/db';
import { subscriptions, entitlements } from '@/db/schema';

async function main() {
    const existingEntitlements = await db.select().from(entitlements);

    if (existingEntitlements.length === 0) {
        console.log('⚠️ No entitlements found. Please seed entitlements first.');
        return;
    }

    const now = new Date();
    const subscriptionRecords = existingEntitlements.map((entitlement, index) => {
        const endDate = new Date(entitlement.validUntil);
        const startDate = new Date(entitlement.validFrom);
        
        let status: 'active' | 'expired' | 'cancelled';
        let autoRenew: boolean;
        let cancelledAt: string | null = null;

        const statusRand = (index % 10);
        
        if (statusRand < 7) {
            status = 'active';
            autoRenew = (index % 5) !== 0;
        } else if (statusRand < 9) {
            status = 'expired';
            autoRenew = false;
        } else {
            status = 'cancelled';
            autoRenew = false;
            const cancelDate = new Date(startDate);
            cancelDate.setDate(cancelDate.getDate() + Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) * 0.6));
            cancelledAt = cancelDate.toISOString();
        }

        return {
            userId: entitlement.userId,
            serviceId: entitlement.serviceId,
            entitlementId: entitlement.id,
            pricingTier: entitlement.pricingTier,
            status: status,
            startDate: entitlement.validFrom,
            endDate: entitlement.validUntil,
            autoRenew: autoRenew,
            cancelledAt: cancelledAt,
            createdAt: entitlement.createdAt,
            updatedAt: entitlement.updatedAt,
        };
    });

    await db.insert(subscriptions).values(subscriptionRecords);
    
    console.log(`✅ Subscriptions seeder completed successfully. Created ${subscriptionRecords.length} subscription records.`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});