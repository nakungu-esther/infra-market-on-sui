import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, ArrowLeft, Share2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Blog post data
const blogPosts: Record<string, {
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  content: string;
}> = {
  'introducing-sui-discovery': {
    title: 'Introducing Sui Infrastructure Service Discovery',
    excerpt: 'Learn about our mission to simplify infrastructure discovery for Sui developers and providers.',
    date: '2024-11-20',
    readTime: '5 min read',
    category: 'Announcement',
    content: `
      <h2>Welcome to Sui Infrastructure Service Discovery</h2>
      <p>We're excited to announce the launch of Sui Discovery, a comprehensive platform designed to connect infrastructure service providers with developers building on the Sui blockchain.</p>
      
      <h3>The Problem We're Solving</h3>
      <p>As the Sui ecosystem grows, developers face increasing challenges in discovering and integrating the right infrastructure services for their applications. Whether it's RPC nodes, oracles, indexers, or storage solutions, finding reliable providers has been a time-consuming process.</p>
      
      <h3>Our Solution</h3>
      <p>Sui Discovery provides a unified marketplace where developers can:</p>
      <ul>
        <li>Browse vetted infrastructure service providers</li>
        <li>Compare pricing and performance metrics</li>
        <li>Pay for services directly on-chain using SUI tokens</li>
        <li>Track usage and manage subscriptions in one place</li>
      </ul>
      
      <h3>For Service Providers</h3>
      <p>Infrastructure providers can list their services, reach a wider audience, and leverage our smart contracts for automated billing and usage tracking.</p>
      
      <h3>What's Next</h3>
      <p>We're continuously expanding our provider network and adding new features. Join us in building the future of Sui infrastructure!</p>
    `
  },
  'choosing-rpc-provider': {
    title: 'How to Choose the Right RPC Provider',
    excerpt: 'A comprehensive guide to selecting the best RPC node provider for your dApp requirements.',
    date: '2024-11-18',
    readTime: '8 min read',
    category: 'Guide',
    content: `
      <h2>Choosing the Right RPC Provider for Your Sui dApp</h2>
      <p>Selecting an RPC provider is one of the most critical decisions when building a decentralized application on Sui. Your choice affects performance, reliability, and user experience.</p>
      
      <h3>Key Factors to Consider</h3>
      
      <h4>1. Performance and Latency</h4>
      <p>Low latency is crucial for responsive dApps. Consider:</p>
      <ul>
        <li>Geographic distribution of nodes</li>
        <li>Average response times</li>
        <li>Load balancing capabilities</li>
      </ul>
      
      <h4>2. Reliability and Uptime</h4>
      <p>Look for providers offering:</p>
      <ul>
        <li>99.9%+ uptime SLAs</li>
        <li>Redundant infrastructure</li>
        <li>Automatic failover</li>
      </ul>
      
      <h4>3. Rate Limits and Pricing</h4>
      <p>Understand the pricing structure:</p>
      <ul>
        <li>Requests per second (RPS) limits</li>
        <li>Monthly request quotas</li>
        <li>Cost per additional request</li>
      </ul>
      
      <h4>4. Support and Documentation</h4>
      <p>Quality documentation and responsive support can save hours of development time.</p>
      
      <h3>Testing Your Provider</h3>
      <p>Before committing, test the provider with:</p>
      <ul>
        <li>Load testing tools</li>
        <li>Monitoring dashboards</li>
        <li>Real-world transaction scenarios</li>
      </ul>
      
      <h3>Conclusion</h3>
      <p>Take time to evaluate multiple providers on our platform. Many offer free tiers for testing before you commit.</p>
    `
  },
  'oracle-best-practices': {
    title: 'Oracle Integration Best Practices',
    excerpt: 'Essential tips for integrating price feeds and external data into your Sui smart contracts.',
    date: '2024-11-15',
    readTime: '6 min read',
    category: 'Tutorial',
    content: `
      <h2>Oracle Integration Best Practices for Sui</h2>
      <p>Oracles bridge the gap between blockchain and real-world data. Here's how to integrate them effectively in your Sui smart contracts.</p>
      
      <h3>Understanding Oracle Types</h3>
      
      <h4>Price Feed Oracles</h4>
      <p>Essential for DeFi applications requiring real-time asset prices:</p>
      <ul>
        <li>Cryptocurrency prices</li>
        <li>Traditional asset prices</li>
        <li>Exchange rates</li>
      </ul>
      
      <h4>Event Oracles</h4>
      <p>Trigger smart contract actions based on external events:</p>
      <ul>
        <li>Sports outcomes</li>
        <li>Weather data</li>
        <li>API responses</li>
      </ul>
      
      <h3>Security Considerations</h3>
      
      <h4>1. Data Freshness</h4>
      <p>Always check the timestamp of oracle data to ensure it's current.</p>
      
      <h4>2. Multiple Data Sources</h4>
      <p>Use aggregated data from multiple oracles to prevent single points of failure.</p>
      
      <h4>3. Price Deviation Checks</h4>
      <p>Implement circuit breakers that pause operations if prices deviate beyond acceptable ranges.</p>
      
      <h3>Implementation Example</h3>
      <p>Here's a basic pattern for consuming oracle data in Move:</p>
      <pre>
      module example::oracle_consumer {
          use oracle::price_feed;
          
          public fun get_latest_price(feed: &PriceFeed): u64 {
              let (price, timestamp) = price_feed::get_price(feed);
              assert!(timestamp > clock::timestamp() - 300, E_STALE_DATA);
              price
          }
      }
      </pre>
      
      <h3>Cost Optimization</h3>
      <p>Oracle calls can be expensive. Cache data when appropriate and batch requests when possible.</p>
    `
  },
  'platform-growth-milestone': {
    title: 'Platform Growth: 100+ Services Live',
    excerpt: 'Celebrating a major milestone as we reach 100 infrastructure services on the marketplace.',
    date: '2024-11-12',
    readTime: '4 min read',
    category: 'Milestone',
    content: `
      <h2>Celebrating 100+ Services on Sui Discovery</h2>
      <p>We're thrilled to announce that Sui Discovery now hosts over 100 infrastructure services, marking a significant milestone in our journey to become the go-to platform for Sui infrastructure.</p>
      
      <h3>Growth by the Numbers</h3>
      <ul>
        <li><strong>100+ Services:</strong> RPC nodes, oracles, indexers, storage, and more</li>
        <li><strong>30+ Providers:</strong> From established companies to innovative startups</li>
        <li><strong>500+ Developers:</strong> Building on our platform daily</li>
        <li><strong>10M+ API Calls:</strong> Processed through our gateway this month</li>
      </ul>
      
      <h3>Service Categories Breakdown</h3>
      <ul>
        <li>RPC Nodes: 35%</li>
        <li>Oracles: 20%</li>
        <li>Indexers: 18%</li>
        <li>Storage: 15%</li>
        <li>Other Services: 12%</li>
      </ul>
      
      <h3>Community Highlights</h3>
      <p>Our growth has been driven by an incredible community:</p>
      <ul>
        <li>Providers continuously improving service quality</li>
        <li>Developers providing valuable feedback</li>
        <li>Contributors enhancing our open-source tools</li>
      </ul>
      
      <h3>What's Coming Next</h3>
      <p>As we continue to grow, we're working on:</p>
      <ul>
        <li>Enhanced discovery algorithms</li>
        <li>More payment token options</li>
        <li>Advanced analytics dashboards</li>
        <li>Geographic expansion</li>
      </ul>
      
      <h3>Thank You</h3>
      <p>This milestone wouldn't be possible without our community. Here's to the next 100 services and beyond!</p>
    `
  },
  'decentralized-storage-nfts': {
    title: 'Decentralized Storage for NFTs',
    excerpt: 'Understanding IPFS and decentralized storage solutions for your NFT projects.',
    date: '2024-11-10',
    readTime: '7 min read',
    category: 'Guide',
    content: `
      <h2>Decentralized Storage for NFTs on Sui</h2>
      <p>Learn how to properly store NFT metadata and assets using decentralized storage solutions.</p>
      
      <h3>Why Decentralized Storage?</h3>
      <p>Storing NFT assets on centralized servers creates risks:</p>
      <ul>
        <li>Server downtime = inaccessible NFTs</li>
        <li>Company closure = lost assets</li>
        <li>Censorship vulnerability</li>
      </ul>
      
      <h3>IPFS: The Standard Solution</h3>
      
      <h4>How IPFS Works</h4>
      <p>InterPlanetary File System (IPFS) uses content addressing:</p>
      <ul>
        <li>Files are identified by their content hash (CID)</li>
        <li>Distributed across multiple nodes</li>
        <li>Permanent and immutable</li>
      </ul>
      
      <h4>Implementing IPFS Storage</h4>
      <p>Steps to integrate IPFS:</p>
      <ol>
        <li>Choose an IPFS pinning service (Pinata, NFT.Storage, etc.)</li>
        <li>Upload your NFT metadata and assets</li>
        <li>Store the IPFS CID in your Sui NFT smart contract</li>
        <li>Ensure metadata follows standards (ERC-721/ERC-1155)</li>
      </ol>
      
      <h3>Alternative Solutions</h3>
      
      <h4>Arweave</h4>
      <p>Permanent storage with one-time payment:</p>
      <ul>
        <li>Pay once, store forever</li>
        <li>Better for long-term archival</li>
        <li>Higher upfront cost</li>
      </ul>
      
      <h4>Walrus (Sui Native)</h4>
      <p>Sui's native decentralized storage solution:</p>
      <ul>
        <li>Optimized for Sui ecosystem</li>
        <li>Native integration with Move</li>
        <li>Competitive pricing</li>
      </ul>
      
      <h3>Best Practices</h3>
      
      <h4>Metadata Structure</h4>
      <pre>
      {
        "name": "NFT Name",
        "description": "NFT Description",
        "image": "ipfs://QmHash...",
        "attributes": [...]
      }
      </pre>
      
      <h4>Redundancy</h4>
      <p>Pin your content with multiple services for maximum reliability.</p>
      
      <h3>Conclusion</h3>
      <p>Proper storage is crucial for NFT longevity. Choose a solution that matches your project's needs and budget.</p>
    `
  },
  'smart-contract-security': {
    title: 'Smart Contract Security Deep Dive',
    excerpt: 'Exploring the security features and audit process for our marketplace smart contracts.',
    date: '2024-11-08',
    readTime: '10 min read',
    category: 'Technical',
    content: `
      <h2>Smart Contract Security: Our Approach</h2>
      <p>Security is paramount when handling payments and user assets. Here's how we ensure our smart contracts are secure.</p>
      
      <h3>Security Principles</h3>
      
      <h4>1. Defense in Depth</h4>
      <p>Multiple layers of security controls:</p>
      <ul>
        <li>Input validation at every entry point</li>
        <li>Access control checks</li>
        <li>Reentrancy guards</li>
        <li>Emergency pause mechanisms</li>
      </ul>
      
      <h4>2. Principle of Least Privilege</h4>
      <p>Contracts only have permissions they absolutely need:</p>
      <ul>
        <li>Capability-based access control</li>
        <li>Time-limited admin privileges</li>
        <li>Multi-signature for critical operations</li>
      </ul>
      
      <h3>Common Vulnerabilities We Prevent</h3>
      
      <h4>Reentrancy Attacks</h4>
      <p>Prevented through:</p>
      <ul>
        <li>Checks-Effects-Interactions pattern</li>
        <li>Reentrancy guards on external calls</li>
        <li>State updates before external interactions</li>
      </ul>
      
      <h4>Integer Overflow/Underflow</h4>
      <p>Move's type system prevents this by default, but we still:</p>
      <ul>
        <li>Use checked arithmetic operations</li>
        <li>Validate all numeric inputs</li>
        <li>Set reasonable bounds on values</li>
      </ul>
      
      <h4>Access Control Issues</h4>
      <p>Strict capability management:</p>
      <pre>
      module marketplace::access {
          struct AdminCap has key, store { id: UID }
          
          public entry fun admin_only_action(
              _: &AdminCap,
              // ... parameters
          ) {
              // Only holders of AdminCap can call this
          }
      }
      </pre>
      
      <h3>Our Audit Process</h3>
      
      <h4>Phase 1: Internal Review</h4>
      <ul>
        <li>Code review by multiple engineers</li>
        <li>Automated security scanning</li>
        <li>Fuzzing and property testing</li>
      </ul>
      
      <h4>Phase 2: External Audit</h4>
      <ul>
        <li>Engagement with reputable security firms</li>
        <li>White-box testing of all critical functions</li>
        <li>Economic attack scenario analysis</li>
      </ul>
      
      <h4>Phase 3: Bug Bounty</h4>
      <ul>
        <li>Public bug bounty program</li>
        <li>Rewards up to $50,000 for critical vulnerabilities</li>
        <li>Ongoing monitoring and updates</li>
      </ul>
      
      <h3>Formal Verification</h3>
      <p>We use Move Prover to mathematically verify critical properties:</p>
      <ul>
        <li>Balance conservation</li>
        <li>Access control invariants</li>
        <li>State transition validity</li>
      </ul>
      
      <h3>Emergency Response</h3>
      <p>Our incident response plan includes:</p>
      <ul>
        <li>24/7 monitoring</li>
        <li>Automatic pause triggers</li>
        <li>Rapid response team</li>
        <li>User communication protocols</li>
      </ul>
      
      <h3>Continuous Improvement</h3>
      <p>Security is an ongoing process. We regularly:</p>
      <ul>
        <li>Review and update our contracts</li>
        <li>Monitor for new attack vectors</li>
        <li>Engage with the security community</li>
        <li>Publish security updates</li>
      </ul>
      
      <h3>Open Source</h3>
      <p>All our smart contracts are open source and available for community review. Transparency is key to security.</p>
    `
  },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Button variant="ghost" size="sm" className="mb-6" asChild>
                <Link href="/blog">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Blog
                </Link>
              </Button>
              
              <Badge className="mb-4">{post.category}</Badge>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {post.title}
              </h1>
              
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.date).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-8 md:p-12">
                  <article 
                    className="prose prose-lg max-w-none dark:prose-invert
                      prose-headings:font-bold prose-headings:tracking-tight
                      prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4
                      prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3
                      prose-h4:text-xl prose-h4:mt-4 prose-h4:mb-2
                      prose-p:text-base prose-p:leading-relaxed prose-p:mb-4
                      prose-ul:my-4 prose-li:my-2
                      prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg
                      prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:rounded"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </CardContent>
              </Card>

              {/* Share Section */}
              <div className="mt-8 flex items-center justify-between">
                <Button variant="outline" asChild>
                  <Link href="/blog">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Blog
                  </Link>
                </Button>
                <Button variant="outline">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Article
                </Button>
              </div>

              {/* Related Articles CTA */}
              <Card className="mt-12 bg-gradient-to-br from-primary/10 to-accent/10">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold mb-4">
                    Explore More Articles
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Discover more insights, tutorials, and updates from the Sui ecosystem
                  </p>
                  <Button asChild>
                    <Link href="/blog">
                      View All Articles
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  return Object.keys(blogPosts).map((slug) => ({
    slug,
  }));
}
