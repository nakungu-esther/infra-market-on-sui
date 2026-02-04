import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function BlogPage() {
  const posts = [
    {
      title: 'Introducing Sui Infrastructure Service Discovery',
      excerpt: 'Learn about our mission to simplify infrastructure discovery for Sui developers and providers.',
      date: '2024-11-20',
      readTime: '5 min read',
      category: 'Announcement',
      slug: 'introducing-sui-discovery',
    },
    {
      title: 'How to Choose the Right RPC Provider',
      excerpt: 'A comprehensive guide to selecting the best RPC node provider for your dApp requirements.',
      date: '2024-11-18',
      readTime: '8 min read',
      category: 'Guide',
      slug: 'choosing-rpc-provider',
    },
    {
      title: 'Oracle Integration Best Practices',
      excerpt: 'Essential tips for integrating price feeds and external data into your Sui smart contracts.',
      date: '2024-11-15',
      readTime: '6 min read',
      category: 'Tutorial',
      slug: 'oracle-best-practices',
    },
    {
      title: 'Platform Growth: 100+ Services Live',
      excerpt: 'Celebrating a major milestone as we reach 100 infrastructure services on the marketplace.',
      date: '2024-11-12',
      readTime: '4 min read',
      category: 'Milestone',
      slug: 'platform-growth-milestone',
    },
    {
      title: 'Decentralized Storage for NFTs',
      excerpt: 'Understanding IPFS and decentralized storage solutions for your NFT projects.',
      date: '2024-11-10',
      readTime: '7 min read',
      category: 'Guide',
      slug: 'decentralized-storage-nfts',
    },
    {
      title: 'Smart Contract Security Deep Dive',
      excerpt: 'Exploring the security features and audit process for our marketplace smart contracts.',
      date: '2024-11-08',
      readTime: '10 min read',
      category: 'Technical',
      slug: 'smart-contract-security',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Blog & Resources
              </h1>
              <p className="text-xl text-muted-foreground">
                Insights, tutorials, and updates from the Sui infrastructure ecosystem
              </p>
            </div>
          </div>
        </section>

        {/* Featured Post */}
        <section className="py-12 border-b">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <Badge className="mb-4">Featured Post</Badge>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    <Badge variant="secondary">{posts[0].category}</Badge>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(posts[0].date).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {posts[0].readTime}
                    </span>
                  </div>
                  <CardTitle className="text-3xl mb-3">{posts[0].title}</CardTitle>
                  <CardDescription className="text-base">{posts[0].excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link href={`/blog/${posts[0].slug}`}>
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">Latest Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.slice(1).map((post, idx) => (
                  <Card key={idx} className="hover:shadow-lg transition-shadow flex flex-col">
                    <CardHeader>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Badge variant="outline">{post.category}</Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readTime}
                        </span>
                      </div>
                      <CardTitle className="text-xl line-clamp-2">{post.title}</CardTitle>
                      <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/blog/${post.slug}`}>
                            Read More
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-16 bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
              <p className="text-muted-foreground mb-6">
                Get the latest tutorials, updates, and ecosystem news delivered to your inbox
              </p>
              <div className="flex gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 rounded-lg border bg-background"
                />
                <Button>Subscribe</Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
