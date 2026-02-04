import { db } from '@/db';
import { serviceCategories } from '@/db/schema';

async function main() {
    const sampleCategories = [
        {
            name: 'RPC Nodes',
            description: 'High-performance RPC endpoints for Sui blockchain access with low latency and high availability',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Indexers',
            description: 'Data indexing services for efficient querying of Sui blockchain data and events',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Storage Solutions',
            description: 'Decentralized and cloud storage services optimized for Sui blockchain applications',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Oracles',
            description: 'Reliable oracle services providing off-chain data feeds to Sui smart contracts',
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(serviceCategories).values(sampleCategories);
    
    console.log('✅ Service categories seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});