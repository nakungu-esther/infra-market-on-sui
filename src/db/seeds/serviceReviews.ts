import { db } from '@/db';
import { serviceReviews, subscriptions } from '@/db/schema';

async function main() {
    // First, query actual subscriptions to get valid userId-serviceId pairs
    const existingSubscriptions = await db.select({
        userId: subscriptions.userId,
        serviceId: subscriptions.serviceId,
        startDate: subscriptions.startDate,
    }).from(subscriptions).limit(15);

    if (existingSubscriptions.length === 0) {
        console.log('⚠️  No subscriptions found. Please seed subscriptions first.');
        return;
    }

    // Rating distribution percentages
    const ratingDistribution = [
        { rating: 5, percentage: 0.40, comments: [
            'Absolutely stellar service! The uptime has been 100% since I subscribed. Worth every penny.',
            'Best API service I have used. Lightning fast responses and excellent documentation.',
            'Outstanding reliability and performance. Their support team is incredibly responsive.',
            'Flawless service with amazing features. Integration was smooth and hassle-free.',
            'Exceeded all my expectations. The API is well-designed and scales beautifully.',
            'Perfect for production use. Never had a single issue in 2 months of heavy usage.',
        ]},
        { rating: 4, percentage: 0.30, comments: [
            'Great service overall. Would love to see more advanced filtering options in the future.',
            'Very reliable with good performance. Documentation could be slightly more detailed.',
            'Solid API with excellent uptime. Only minor suggestion: add webhook support.',
            'Really good service. The only thing missing is a GraphQL endpoint option.',
            'Works great for my needs. Pricing is fair but would appreciate a team plan.',
        ]},
        { rating: 3, percentage: 0.20, comments: [
            'Decent service but experienced occasional slowdowns during peak hours.',
            'Works as advertised but response times can be inconsistent. Mixed experience overall.',
            'Good features but the rate limiting is quite aggressive for the price point.',
            'Average performance. Gets the job done but nothing exceptional compared to competitors.',
        ]},
        { rating: 2, percentage: 0.07, comments: [
            'Disappointed with the frequent downtimes. Had to implement fallback solutions.',
            'Support is slow to respond. Waited 3 days for a critical issue to be addressed.',
        ]},
        { rating: 1, percentage: 0.03, comments: [
            'Terrible experience. Service went down during a critical demo. No warning or communication.',
        ]},
    ];

    // Generate reviews based on distribution
    const sampleReviews = [];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 60); // Start from 60 days ago

    let reviewCount = 0;
    const targetReviews = Math.min(existingSubscriptions.length, 15);

    for (const distribution of ratingDistribution) {
        const countForRating = Math.ceil(targetReviews * distribution.percentage);
        
        for (let i = 0; i < countForRating && reviewCount < targetReviews; i++) {
            const subscription = existingSubscriptions[reviewCount];
            const comment = distribution.comments[i % distribution.comments.length];
            
            // Calculate review date (between subscription start and now, within 60 days)
            const subscriptionDate = new Date(subscription.startDate);
            const minDate = subscriptionDate > baseDate ? subscriptionDate : baseDate;
            const daysAfterSubscription = Math.floor(Math.random() * 60);
            const reviewDate = new Date(minDate);
            reviewDate.setDate(reviewDate.getDate() + daysAfterSubscription);

            sampleReviews.push({
                serviceId: subscription.serviceId,
                userId: subscription.userId,
                rating: distribution.rating,
                comment: comment,
                createdAt: reviewDate.toISOString(),
                updatedAt: reviewDate.toISOString(),
            });

            reviewCount++;
        }
    }

    await db.insert(serviceReviews).values(sampleReviews);
    
    console.log(`✅ Service reviews seeder completed successfully. Created ${sampleReviews.length} reviews.`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});