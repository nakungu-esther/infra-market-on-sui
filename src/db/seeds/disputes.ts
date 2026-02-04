import { db } from '@/db';
import { disputes, user, services, entitlements } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

async function main() {
    // Query developers with entitlements
    const developersWithEntitlements = await db
        .select({
            userId: user.id,
            serviceId: entitlements.serviceId,
            providerId: services.providerId,
        })
        .from(user)
        .innerJoin(entitlements, eq(user.id, entitlements.userId))
        .innerJoin(services, eq(entitlements.serviceId, services.id))
        .where(eq(user.role, 'developer'))
        .limit(3);

    if (developersWithEntitlements.length === 0) {
        console.log('⚠️  No developers with entitlements found. Skipping disputes seeder.');
        return;
    }

    // Query admin users
    const adminUsers = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.role, 'admin'))
        .limit(1);

    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const sampleDisputes = [];

    // DISPUTE 1 - Open refund request
    if (developersWithEntitlements.length >= 1) {
        sampleDisputes.push({
            reporter_id: developersWithEntitlements[0].userId,
            service_id: developersWithEntitlements[0].serviceId,
            provider_id: developersWithEntitlements[0].providerId,
            dispute_type: 'refund_request',
            status: 'open',
            title: 'Refund Request - Service Did Not Meet Requirements',
            description: 'I purchased the premium tier expecting advanced features. However, the API documentation is incomplete and several endpoints return errors. The service has been unreliable for development.',
            amount_involved: '25',
            evidence: JSON.stringify(['https://example.com/screenshots/issue1.png', 'https://example.com/screenshots/issue2.png']),
            provider_response: null,
            admin_notes: null,
            resolved_by: null,
            resolved_at: null,
            created_at: fiveDaysAgo.toISOString(),
            updated_at: fiveDaysAgo.toISOString(),
        });
    }

    // DISPUTE 2 - In-progress
    if (developersWithEntitlements.length >= 2) {
        sampleDisputes.push({
            reporter_id: developersWithEntitlements[1].userId,
            service_id: developersWithEntitlements[1].serviceId,
            provider_id: developersWithEntitlements[1].providerId,
            dispute_type: 'service_downtime',
            status: 'in_progress',
            title: 'Repeated Service Outages',
            description: 'Multiple outages in past two weeks affecting production environment.',
            amount_involved: '50',
            evidence: JSON.stringify(['https://example.com/logs/downtime1.json', 'https://example.com/logs/downtime2.json']),
            provider_response: 'We experienced infrastructure issues. Implementing redundancy now.',
            admin_notes: 'Under review. Monitoring progress.',
            resolved_by: null,
            resolved_at: null,
            created_at: fifteenDaysAgo.toISOString(),
            updated_at: threeDaysAgo.toISOString(),
        });
    }

    // DISPUTE 3 - Resolved
    if (developersWithEntitlements.length >= 3 && adminUsers.length > 0) {
        sampleDisputes.push({
            reporter_id: developersWithEntitlements[2].userId,
            service_id: developersWithEntitlements[2].serviceId,
            provider_id: developersWithEntitlements[2].providerId,
            dispute_type: 'billing_issue',
            status: 'resolved',
            title: 'Duplicate Charge on Account',
            description: 'I was charged twice for the same subscription renewal.',
            amount_involved: '10',
            evidence: JSON.stringify(['https://example.com/tx1.json', 'https://example.com/tx2.json']),
            provider_response: 'Verified duplicate charge. Refund processed.',
            admin_notes: 'Issue confirmed. Refund approved.',
            resolved_by: adminUsers[0].id,
            resolved_at: sevenDaysAgo.toISOString(),
            created_at: twentyDaysAgo.toISOString(),
            updated_at: sevenDaysAgo.toISOString(),
        });
    }

    if (sampleDisputes.length === 0) {
        console.log('⚠️  Not enough data to create disputes. Need at least 1 developer with entitlements.');
        return;
    }

    await db.insert(disputes).values(sampleDisputes);
    
    console.log(`✅ Disputes seeder completed successfully. Created ${sampleDisputes.length} dispute(s).`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});