import { db } from '@/db';
import { services, user } from '@/db/schema';

async function main() {
    // Step 1: Query actual user IDs from database
    const existingUsers = await db.select({ id: user.id }).from(user).limit(2);
    
    if (existingUsers.length < 2) {
        throw new Error('Need at least 2 users in database. Please run users seeder first.');
    }

    const userId1 = existingUsers[0].id;
    const userId2 = existingUsers[1].id;

    console.log(`Using user IDs: ${userId1}, ${userId2}`);

    // Step 2: Create services with actual user IDs
    const sampleServices = [
        {
            providerId: userId1,
            name: 'SuiNode Pro',
            description: 'Enterprise-grade RPC node infrastructure with 99.9% uptime guarantee and global load balancing.',
            serviceType: 'RPC Node',
            status: 'active',
            metadata: {
                network: 'mainnet',
                region: 'global',
                uptime: '99.9%',
                maxRequestsPerSecond: 1000
            },
            pricingInfo: {
                tier: 'premium',
                monthlyPrice: 299,
                requestLimit: 1000000
            },
            contactInfo: {
                email: 'support@suinodepro.com',
                website: 'https://suinodepro.com',
                discord: 'suinodepro'
            },
            isAcceptingUsers: 1,
            createdAt: new Date('2024-01-10').toISOString(),
            updatedAt: new Date('2024-01-10').toISOString(),
        },
        {
            providerId: userId2,
            name: 'SuiIndex',
            description: 'High-performance blockchain indexer with real-time data synchronization and advanced query capabilities.',
            serviceType: 'Indexer',
            status: 'active',
            metadata: {
                latency: '< 100ms',
                syncDelay: '1 block',
                apiVersion: 'v2',
                supportsWebsocket: true
            },
            pricingInfo: {
                tier: 'standard',
                monthlyPrice: 199,
                queryLimit: 500000
            },
            contactInfo: {
                email: 'info@suiindex.io',
                website: 'https://suiindex.io',
                telegram: '@suiindex'
            },
            isAcceptingUsers: 1,
            createdAt: new Date('2024-01-12').toISOString(),
            updatedAt: new Date('2024-01-12').toISOString(),
        },
        {
            providerId: userId1,
            name: 'SuiStore',
            description: 'Decentralized storage solution optimized for Sui blockchain data with IPFS integration.',
            serviceType: 'Storage',
            status: 'active',
            metadata: {
                storageType: 'IPFS',
                redundancy: 3,
                maxFileSize: '100MB',
                retention: 'permanent'
            },
            pricingInfo: {
                tier: 'standard',
                monthlyPrice: 149,
                storageLimit: '1TB'
            },
            contactInfo: {
                email: 'hello@suistore.network',
                website: 'https://suistore.network',
                twitter: '@suistore'
            },
            isAcceptingUsers: 1,
            createdAt: new Date('2024-01-15').toISOString(),
            updatedAt: new Date('2024-01-15').toISOString(),
        },
        {
            providerId: userId2,
            name: 'SuiOracle Network',
            description: 'Reliable oracle network providing real-time price feeds and external data for Sui smart contracts.',
            serviceType: 'Oracle',
            status: 'active',
            metadata: {
                dataSources: 20,
                updateFrequency: '30s',
                priceFeeds: 150,
                verificationNodes: 15
            },
            pricingInfo: {
                tier: 'premium',
                monthlyPrice: 399,
                requestLimit: 2000000
            },
            contactInfo: {
                email: 'contact@suioracle.network',
                website: 'https://suioracle.network',
                discord: 'suioracle'
            },
            isAcceptingUsers: 1,
            createdAt: new Date('2024-01-18').toISOString(),
            updatedAt: new Date('2024-01-18').toISOString(),
        },
        {
            providerId: userId1,
            name: 'Sui Public RPC',
            description: 'Free public RPC endpoint for development and testing on Sui blockchain.',
            serviceType: 'RPC Node',
            status: 'active',
            metadata: {
                network: 'mainnet',
                rateLimit: '100 req/min',
                freeAccess: true,
                community: true
            },
            pricingInfo: {
                tier: 'free',
                monthlyPrice: 0,
                requestLimit: 100000
            },
            contactInfo: {
                email: 'community@suipublicrpc.org',
                website: 'https://suipublicrpc.org',
                github: 'sui-public-rpc'
            },
            isAcceptingUsers: 1,
            createdAt: new Date('2024-01-20').toISOString(),
            updatedAt: new Date('2024-01-20').toISOString(),
        },
        {
            providerId: userId2,
            name: 'ChainVision Sui',
            description: 'Advanced blockchain analytics and indexing service with custom query builder.',
            serviceType: 'Indexer',
            status: 'pending',
            metadata: {
                features: ['analytics', 'custom_queries', 'dashboards'],
                betaAccess: true,
                launchDate: '2024-03-01'
            },
            pricingInfo: {
                tier: 'enterprise',
                monthlyPrice: 599,
                queryLimit: 5000000
            },
            contactInfo: {
                email: 'sales@chainvision.io',
                website: 'https://chainvision.io',
                linkedin: 'chainvision'
            },
            isAcceptingUsers: 1,
            createdAt: new Date('2024-01-22').toISOString(),
            updatedAt: new Date('2024-01-22').toISOString(),
        },
        {
            providerId: userId1,
            name: 'Decentralized File Hub',
            description: 'Distributed file storage system with encryption and access control for Sui applications.',
            serviceType: 'Storage',
            status: 'active',
            metadata: {
                encryption: 'AES-256',
                accessControl: true,
                versioning: true,
                cdn: 'global'
            },
            pricingInfo: {
                tier: 'premium',
                monthlyPrice: 249,
                storageLimit: '5TB'
            },
            contactInfo: {
                email: 'support@filehub.network',
                website: 'https://filehub.network',
                discord: 'filehub'
            },
            isAcceptingUsers: 0,
            createdAt: new Date('2024-01-25').toISOString(),
            updatedAt: new Date('2024-01-25').toISOString(),
        },
        {
            providerId: userId2,
            name: 'Enterprise Sui RPC',
            description: 'Dedicated RPC infrastructure with SLA guarantees and priority support for enterprise clients.',
            serviceType: 'RPC Node',
            status: 'active',
            metadata: {
                sla: '99.99%',
                dedicated: true,
                support: '24/7',
                customEndpoints: true
            },
            pricingInfo: {
                tier: 'enterprise',
                monthlyPrice: 999,
                requestLimit: 10000000
            },
            contactInfo: {
                email: 'enterprise@suirpc.com',
                website: 'https://enterprise.suirpc.com',
                phone: '+1-555-0123'
            },
            isAcceptingUsers: 1,
            createdAt: new Date('2024-01-28').toISOString(),
            updatedAt: new Date('2024-01-28').toISOString(),
        },
        {
            providerId: userId1,
            name: 'CryptoPrice Oracle',
            description: 'Specialized price oracle for cryptocurrency pairs with multi-source aggregation.',
            serviceType: 'Oracle',
            status: 'active',
            metadata: {
                pairs: 300,
                exchanges: 25,
                updateInterval: '10s',
                accuracy: '99.5%'
            },
            pricingInfo: {
                tier: 'standard',
                monthlyPrice: 199,
                requestLimit: 1000000
            },
            contactInfo: {
                email: 'api@cryptoprice.oracle',
                website: 'https://cryptoprice.oracle',
                telegram: '@cryptoprice'
            },
            isAcceptingUsers: 1,
            createdAt: new Date('2024-02-01').toISOString(),
            updatedAt: new Date('2024-02-01').toISOString(),
        },
        {
            providerId: userId2,
            name: 'SuiData Analytics',
            description: 'Comprehensive blockchain data analytics platform with visualization and reporting tools.',
            serviceType: 'Indexer',
            status: 'active',
            metadata: {
                dashboards: true,
                customReports: true,
                exportFormats: ['CSV', 'JSON', 'Excel'],
                historicalData: '90 days'
            },
            pricingInfo: {
                tier: 'premium',
                monthlyPrice: 449,
                queryLimit: 3000000
            },
            contactInfo: {
                email: 'analytics@suidata.io',
                website: 'https://analytics.suidata.io',
                twitter: '@suidata'
            },
            isAcceptingUsers: 1,
            createdAt: new Date('2024-02-05').toISOString(),
            updatedAt: new Date('2024-02-05').toISOString(),
        }
    ];

    await db.insert(services).values(sampleServices);
    
    console.log('✅ Services seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});