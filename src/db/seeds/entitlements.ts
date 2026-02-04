import { db } from '@/db';
import { entitlements, user, services } from '@/db/schema';

async function main() {
    // Query actual users from database
    const existingUsers = await db.select({ id: user.id }).from(user).limit(10);
    
    if (existingUsers.length < 2) {
        throw new Error('Not enough users in database. Please seed users first.');
    }

    // Query actual services from database
    const existingServices = await db.select({ id: services.id }).from(services).limit(10);
    
    if (existingServices.length < 10) {
        throw new Error('Not enough services in database. Please seed services first.');
    }

    const userIds = existingUsers.map(u => u.id);
    const serviceIds = existingServices.map(s => s.id);

    // Helper functions
    const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    
    const generatePaymentId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let id = 'PAY-';
        for (let i = 0; i < 8; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    };

    const generateTxDigest = () => {
        const chars = '0123456789abcdef';
        let digest = '';
        for (let i = 0; i < 64; i++) {
            digest += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return digest;
    };

    const getDaysAgo = (days: number) => {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString();
    };

    const getDaysFromNow = (days: number) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString();
    };

    const getTierConfig = (tier: string) => {
        switch (tier) {
            case 'free':
                return { limit: 10000, sui: '0', wal: '0', usdc: '0' };
            case 'basic':
                return { limit: 100000, sui: '5', wal: '10', usdc: '10' };
            case 'pro':
                return { limit: 1000000, sui: '25', wal: '50', usdc: '50' };
            case 'enterprise':
                return { limit: 10000000, sui: '100', wal: '200', usdc: '200' };
            default:
                return { limit: 10000, sui: '0', wal: '0', usdc: '0' };
        }
    };

    const sampleEntitlements = [
        // Active subscriptions (60% - 12 records)
        {
            userId: getRandomElement(userIds),
            serviceId: getRandomElement(serviceIds),
            paymentId: generatePaymentId(),
            pricingTier: 'basic',
            quotaLimit: 100000,
            quotaUsed: 35000,
            validFrom: getDaysAgo(15),
            validUntil: getDaysFromNow(45),
            isActive: true,
            tokenType: 'SUI',
            amountPaid: '5',
            txDigest: generateTxDigest(),
            createdAt: getDaysAgo(15),
            updatedAt: getDaysAgo(15),
        },
        {
            userId: getRandomElement(userIds),
            serviceId: getRandomElement(serviceIds),
            paymentId: generatePaymentId(),
            pricingTier: 'pro',
            quotaLimit: 1000000,
            quotaUsed: 450000,
            validFrom: getDaysAgo(25),
            validUntil: getDaysFromNow(35),
            isActive: true,
            tokenType: 'WAL',
            amountPaid: '50',
            txDigest: generateTxDigest(),
            createdAt: getDaysAgo(25),
            updatedAt: getDaysAgo(1),
        },
        {
            userId: getRandomElement(userIds),
            serviceId: getRandomElement(serviceIds),
            paymentId: generatePaymentId(),
            pricingTier: 'free',
            quotaLimit: 10000,
            quotaUsed: 2500,
            validFrom: getDaysAgo(5),
            validUntil: getDaysFromNow(55),
            isActive: true,
            tokenType: 'SUI',
            amountPaid: '0',
            txDigest: generateTxDigest(),
            createdAt: getDaysAgo(5),
            updatedAt: getDaysAgo(5),
        },
        {
            userId: getRandomElement(userIds),
            serviceId: getRandomElement(serviceIds),
            paymentId: generatePaymentId(),
            pricingTier: 'basic',
            quotaLimit: 100000,
            quotaUsed: 65000,
            validFrom: getDaysAgo(20),
            validUntil: getDaysFromNow(40),
            isActive: true,
            tokenType: 'USDC',
            amountPaid: '10',
            txDigest: generateTxDigest(),
            createdAt: getDaysAgo(20),
            updatedAt: getDaysAgo(2),
        },
        {
            userId: getRandomElement(userIds),
            serviceId: getRandomElement(serviceIds),
            paymentId: generatePaymentId(),
            pricingTier: 'enterprise',
            quotaLimit: 10000000,
            quotaUsed: 3500000,
            validFrom: getDaysAgo(30),
            validUntil: getDaysFromNow(30),
            isActive: true,
            tokenType: 'SUI',
            amountPaid: '100',
            txDigest: generateTxDigest(),
            createdAt: getDaysAgo(30),
            updatedAt: getDaysAgo(1),
        },
        {
            userId: getRandomElement(userIds),
            serviceId: getRandomElement(serviceIds),
            paymentId: generatePaymentId(),
            pricingTier: 'free',
            quotaLimit: 10000,
            quotaUsed: 4200,
            validFrom: getDaysAgo(10),
            validUntil: getDaysFromNow(50),
            isActive: true,
            tokenType: 'WAL',
            amountPaid: '0',
            txDigest: generateTxDigest(),
            createdAt: getDaysAgo(10),
            updatedAt: getDaysAgo(3),
        },
        {
            userId: getRandomElement(userIds),
            serviceId: getRandomElement(serviceIds),
            paymentId: generatePaymentId(),
            pricingTier: 'pro',
            quotaLimit: 1000000,
            quotaUsed: 680000,
            validFrom: getDaysAgo(18),
            validUntil: getDaysFromNow(42),
            isActive: true,
            tokenType: 'SUI',
            amountPaid: '25',
            txDigest: generateTxDigest(),
            createdAt: getDaysAgo(18),
            updatedAt: getDaysAgo(1),
        },
        {
            userId: getRandomElement(userIds),
            serviceId: getRandomElement(serviceIds),
            paymentId: generatePaymentId(),
            pricingTier: 'basic',
            quotaLimit: 100000,
            quotaUsed: 28000,
            validFrom: getDaysAgo(8),
            validUntil: getDaysFromNow(52),
            isActive: true,
            tokenType: 'USDC',
            amountPaid: '10',
            txDigest: generateTxDigest(),
            createdAt: getDaysAgo(8),
            updatedAt: getDaysAgo(8),
        },
        {
            userId: getRandomElement(userIds),
            serviceId: getRandomElement(serviceIds),
            paymentId: generatePaymentId(),
            pricingTier: 'basic',
            quotaLimit: 100000,
            quotaUsed: 52000,
            validFrom: getDaysAgo(22),
            validUntil: getDaysFromNow(38),
            isActive: true,
            tokenType: 'SUI',
            amountPaid: '5',
            txDigest: generateTxDigest(),
            createdAt: getDaysAgo(22),
            updatedAt: getDaysAgo(4),
        },
        {
            userId: getRandomElement(userIds),
            serviceId: getRandomElement(serviceIds),
            paymentId: generatePaymentId(),
            pricingTier: 'free',
            quotaLimit: 10000,
            quotaUsed: 6800,
            validFrom: getDaysAgo(12),
            validUntil: getDaysFromNow(48),
            isActive: true,
            tokenType: 'WAL',
            amountPaid: '0',
            txDigest: generateTxDigest(),
            createdAt: getDaysAgo(12),
            updatedAt: getDaysAgo(2),
        },
        {
            userId: getRandomElement(userIds),
            serviceId: getRandomElement(serviceIds),
            paymentId: generatePaymentId(),
            pricingTier: 'pro',
            quotaLimit: 1000000,
            quotaUsed: 320000,
            validFrom: getDaysAgo(28),
            validUntil: getDaysFromNow(32),
            isActive: true,
            tokenType: 'SUI',
            amountPaid: '25',
            txDigest: generateTxDigest(),
            createdAt: getDaysAgo(28),
            updatedAt: getDaysAgo(5),
        },
        {
            userId: getRandomElement(userIds),
            serviceId: getRandomElement(serviceIds),
            paymentId: generatePaymentId(),
            pricingTier: 'basic',
            quotaLimit: 100000,
            quotaUsed: 45000,
            validFrom: getDaysAgo(6),
            validUntil: getDaysFromNow(54),
            isActive: true,
            tokenType: 'USDC',
            amountPaid: '10',
            txDigest: generateTxDigest(),
            createdAt: getDaysAgo(6),
            updatedAt: getDaysAgo(1),
        },
        // Expired subscriptions (20% - 4 records)
        {
            userId: getRandomElement(userIds),
            serviceId: getRandomElement(serviceIds),
            paymentId: generatePaymentId(),
            pricingTier: 'basic',
            quotaLimit: 100000,
            quotaUsed: 85000,
            validFrom: getDaysAgo(85),
            validUntil: getDaysAgo(25),
            isActive: true,
            tokenType: 'SUI',
            amountPaid: '5',
            txDigest: generateTxDigest(),
            createdAt: getDaysAgo(85),
            updatedAt: getDaysAgo(25),
        },
        {
            userId: getRandomElement(userIds),
            serviceId: getRandomElement(serviceIds),
            paymentId: generatePaymentId(),
            pricingTier: 'pro',
            quotaLimit: 1000000,
            quotaUsed: 920000,
            validFrom: getDaysAgo(75),
            validUntil: getDaysAgo(15),
            isActive: true,
            tokenType: 'WAL',
            amountPaid: '50',
            txDigest: generateTxDigest(),
            createdAt: getDaysAgo(75),
            updatedAt: getDaysAgo(15),
        },
        {
            userId: getRandomElement(userIds),
            serviceId: getRandomElement(serviceIds),
            paymentId: generatePaymentId(),
            pricingTier: 'free',
            quotaLimit: 10000,
            quotaUsed: 10000,
            validFrom: getDaysAgo(70),
            validUntil: getDaysAgo(10),
            isActive: true,
            tokenType: 'SUI',
            amountPaid: '0',
            txDigest: generateTxDigest(),
            createdAt: getDaysAgo(70),
            updatedAt: getDaysAgo(10),
        },
        {
            userId: getRandomElement(userIds),
            serviceId: getRandomElement(serviceIds),
            paymentId: generatePaymentId(),
            pricingTier: 'basic',
            quotaLimit: 100000,
            quotaUsed: 72000,
            validFrom: getDaysAgo(65),
            validUntil: getDaysAgo(5),
            isActive: true,
            tokenType: 'USDC',
            amountPaid: '10',
            txDigest: generateTxDigest(),
            createdAt: getDaysAgo(65),
            updatedAt: getDaysAgo(5),
        },
        // Quota exhausted (10% - 2 records)
        {
            userId: getRandomElement(userIds),
            serviceId: getRandomElement(serviceIds),
            paymentId: generatePaymentId(),
            pricingTier: 'basic',
            quotaLimit: 100000,
            quotaUsed: 100000,
            validFrom: getDaysAgo(15),
            validUntil: getDaysFromNow(15),
            isActive: true,
            tokenType: 'SUI',
            amountPaid: '5',
            txDigest: generateTxDigest(),
            createdAt: getDaysAgo(15),
            updatedAt: getDaysAgo(3),
        },
        {
            userId: getRandomElement(userIds),
            serviceId: getRandomElement(serviceIds),
            paymentId: generatePaymentId(),
            pricingTier: 'free',
            quotaLimit: 10000,
            quotaUsed: 10000,
            validFrom: getDaysAgo(12),
            validUntil: getDaysFromNow(18),
            isActive: true,
            tokenType: 'WAL',
            amountPaid: '0',
            txDigest: generateTxDigest(),
            createdAt: getDaysAgo(12),
            updatedAt: getDaysAgo(1),
        },
        // Inactive subscriptions (10% - 2 records)
        {
            userId: getRandomElement(userIds),
            serviceId: getRandomElement(serviceIds),
            paymentId: generatePaymentId(),
            pricingTier: 'pro',
            quotaLimit: 1000000,
            quotaUsed: 450000,
            validFrom: getDaysAgo(40),
            validUntil: getDaysFromNow(20),
            isActive: false,
            tokenType: 'SUI',
            amountPaid: '25',
            txDigest: generateTxDigest(),
            createdAt: getDaysAgo(40),
            updatedAt: getDaysAgo(10),
        },
        {
            userId: getRandomElement(userIds),
            serviceId: getRandomElement(serviceIds),
            paymentId: generatePaymentId(),
            pricingTier: 'enterprise',
            quotaLimit: 10000000,
            quotaUsed: 2800000,
            validFrom: getDaysAgo(50),
            validUntil: getDaysFromNow(10),
            isActive: false,
            tokenType: 'USDC',
            amountPaid: '200',
            txDigest: generateTxDigest(),
            createdAt: getDaysAgo(50),
            updatedAt: getDaysAgo(20),
        },
    ];

    await db.insert(entitlements).values(sampleEntitlements);
    
    console.log('✅ Entitlements seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});