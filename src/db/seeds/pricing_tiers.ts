import { db } from '@/db';
import { pricingTiers, services } from '@/db/schema';

async function main() {
    // First, get all existing services from the database
    const existingServices = await db.select().from(services);
    
    if (existingServices.length === 0) {
        console.log('⚠️  No services found in database. Please run services seeder first.');
        return;
    }

    console.log(`📊 Found ${existingServices.length} services. Generating pricing tiers...`);

    // Price multipliers based on service type
    const priceMultipliers: Record<string, number> = {
        'rpc-node': 1.5,
        'indexer': 1.0,
        'oracle': 2.0,
        'storage': 0.8,
        'default': 1.0
    };

    const samplePricingTiers = [];

    for (const service of existingServices) {
        const multiplier = priceMultipliers[service.serviceType] || priceMultipliers['default'];
        
        // Free Tier
        samplePricingTiers.push({
            serviceId: service.id,
            tierName: 'free',
            priceSui: '0',
            priceWal: '0',
            priceUsdc: '0',
            quotaLimit: 10000,
            validityDays: 30,
            features: JSON.stringify([
                'Basic API access',
                'Community support',
                'Rate limited'
            ]),
            isActive: true,
            createdAt: new Date('2024-01-10').toISOString()
        });

        // Basic Tier
        samplePricingTiers.push({
            serviceId: service.id,
            tierName: 'basic',
            priceSui: (10 * multiplier).toFixed(2),
            priceWal: (50 * multiplier).toFixed(2),
            priceUsdc: (20 * multiplier).toFixed(2),
            quotaLimit: 100000,
            validityDays: 30,
            features: JSON.stringify([
                'Standard API access',
                'Email support',
                'Higher rate limits',
                '99.5% uptime SLA'
            ]),
            isActive: true,
            createdAt: new Date('2024-01-10').toISOString()
        });

        // Pro Tier
        samplePricingTiers.push({
            serviceId: service.id,
            tierName: 'pro',
            priceSui: (50 * multiplier).toFixed(2),
            priceWal: (250 * multiplier).toFixed(2),
            priceUsdc: (100 * multiplier).toFixed(2),
            quotaLimit: 1000000,
            validityDays: 30,
            features: JSON.stringify([
                'Premium API access',
                'Priority support',
                'Advanced rate limits',
                '99.9% uptime SLA',
                'Custom endpoints'
            ]),
            isActive: true,
            createdAt: new Date('2024-01-10').toISOString()
        });

        // Enterprise Tier
        samplePricingTiers.push({
            serviceId: service.id,
            tierName: 'enterprise',
            priceSui: (200 * multiplier).toFixed(2),
            priceWal: (1000 * multiplier).toFixed(2),
            priceUsdc: (400 * multiplier).toFixed(2),
            quotaLimit: 10000000,
            validityDays: 30,
            features: JSON.stringify([
                'Unlimited API access',
                '24/7 dedicated support',
                'No rate limits',
                '99.99% uptime SLA',
                'Custom endpoints',
                'White-label options',
                'SLA guarantees'
            ]),
            isActive: true,
            createdAt: new Date('2024-01-10').toISOString()
        });
    }

    await db.insert(pricingTiers).values(samplePricingTiers);
    
    console.log(`✅ Pricing tiers seeder completed successfully - Generated ${samplePricingTiers.length} pricing tiers for ${existingServices.length} services`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});