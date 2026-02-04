import { db } from '@/db';
import { serviceCategoryMapping } from '@/db/schema';

async function main() {
    const sampleMappings = [
        {
            serviceId: 1,
            categoryId: 1,
        },
        {
            serviceId: 2,
            categoryId: 2,
        },
        {
            serviceId: 3,
            categoryId: 3,
        },
        {
            serviceId: 4,
            categoryId: 4,
        },
        {
            serviceId: 5,
            categoryId: 1,
        },
        {
            serviceId: 6,
            categoryId: 2,
        },
        {
            serviceId: 7,
            categoryId: 3,
        },
        {
            serviceId: 8,
            categoryId: 1,
        },
        {
            serviceId: 9,
            categoryId: 4,
        },
        {
            serviceId: 10,
            categoryId: 2,
        },
    ];

    await db.insert(serviceCategoryMapping).values(sampleMappings);
    
    console.log('✅ Service category mapping seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});