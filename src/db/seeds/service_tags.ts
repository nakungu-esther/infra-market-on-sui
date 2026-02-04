import { db } from '@/db';
import { serviceTags } from '@/db/schema';

async function main() {
    const sampleServiceTags = [
        // Service 1 (SuiNode Pro - RPC Node)
        {
            serviceId: 1,
            tag: 'Verified by Sui Foundation',
            addedByAdmin: true,
            createdAt: new Date().toISOString(),
        },
        {
            serviceId: 1,
            tag: 'High Availability',
            addedByAdmin: false,
            createdAt: new Date().toISOString(),
        },
        {
            serviceId: 1,
            tag: 'Enterprise Grade',
            addedByAdmin: false,
            createdAt: new Date().toISOString(),
        },
        // Service 2 (SuiIndex - Indexer)
        {
            serviceId: 2,
            tag: 'Verified by Sui Foundation',
            addedByAdmin: true,
            createdAt: new Date().toISOString(),
        },
        {
            serviceId: 2,
            tag: 'Real-time Indexing',
            addedByAdmin: false,
            createdAt: new Date().toISOString(),
        },
        // Service 3 (SuiStore - Storage)
        {
            serviceId: 3,
            tag: 'Decentralized',
            addedByAdmin: false,
            createdAt: new Date().toISOString(),
        },
        {
            serviceId: 3,
            tag: 'Multi-chain Support',
            addedByAdmin: false,
            createdAt: new Date().toISOString(),
        },
        // Service 4 (SuiOracle Network - Oracle)
        {
            serviceId: 4,
            tag: 'Verified by Sui Foundation',
            addedByAdmin: true,
            createdAt: new Date().toISOString(),
        },
        {
            serviceId: 4,
            tag: 'Low Latency',
            addedByAdmin: false,
            createdAt: new Date().toISOString(),
        },
        {
            serviceId: 4,
            tag: 'Multiple Data Sources',
            addedByAdmin: false,
            createdAt: new Date().toISOString(),
        },
        // Service 5 (Sui Public RPC)
        {
            serviceId: 5,
            tag: 'Community Maintained',
            addedByAdmin: false,
            createdAt: new Date().toISOString(),
        },
        {
            serviceId: 5,
            tag: 'Free Tier',
            addedByAdmin: false,
            createdAt: new Date().toISOString(),
        },
        // Service 6 (ChainVision Sui - Indexer)
        {
            serviceId: 6,
            tag: 'New Service',
            addedByAdmin: false,
            createdAt: new Date().toISOString(),
        },
        {
            serviceId: 6,
            tag: 'Developer Friendly',
            addedByAdmin: false,
            createdAt: new Date().toISOString(),
        },
        // Service 7 (Decentralized File Hub - Storage)
        {
            serviceId: 7,
            tag: 'Privacy Focused',
            addedByAdmin: false,
            createdAt: new Date().toISOString(),
        },
        {
            serviceId: 7,
            tag: 'Encrypted Storage',
            addedByAdmin: false,
            createdAt: new Date().toISOString(),
        },
        // Service 8 (Enterprise Sui RPC)
        {
            serviceId: 8,
            tag: 'Verified by Sui Foundation',
            addedByAdmin: true,
            createdAt: new Date().toISOString(),
        },
        {
            serviceId: 8,
            tag: 'Dedicated Infrastructure',
            addedByAdmin: false,
            createdAt: new Date().toISOString(),
        },
        {
            serviceId: 8,
            tag: 'Enterprise Support',
            addedByAdmin: false,
            createdAt: new Date().toISOString(),
        },
        // Service 9 (CryptoPrice Oracle)
        {
            serviceId: 9,
            tag: 'High Frequency Updates',
            addedByAdmin: false,
            createdAt: new Date().toISOString(),
        },
        {
            serviceId: 9,
            tag: 'Crypto Prices Only',
            addedByAdmin: false,
            createdAt: new Date().toISOString(),
        },
        // Service 10 (SuiData Analytics - Indexer)
        {
            serviceId: 10,
            tag: 'Verified by Sui Foundation',
            addedByAdmin: true,
            createdAt: new Date().toISOString(),
        },
        {
            serviceId: 10,
            tag: 'Historical Data',
            addedByAdmin: false,
            createdAt: new Date().toISOString(),
        },
        {
            serviceId: 10,
            tag: 'Advanced Analytics',
            addedByAdmin: false,
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(serviceTags).values(sampleServiceTags);
    
    console.log('✅ Service tags seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});