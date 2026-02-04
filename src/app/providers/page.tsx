import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Star, Users, Package, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function ProvidersPage() {
  const topProviders = [
    {
      name: 'FastNode Infrastructure',
      description: 'High-performance RPC nodes with 99.9% uptime guarantee',
      services: 5,
      customers: 87,
      rating: 4.8,
      verified: true,
      revenue: '2,450 SUI',
    },
    {
      name: 'Oracle Network Solutions',
      description: 'Real-time price feeds and oracle services for DeFi',
      services: 3,
      customers: 45,
      rating: 4.7,
      verified: true,
      revenue: '1,820 SUI',
    },
    {
      name: 'IPFS Cloud Storage',
      description: 'Decentralized storage solutions for dApps',
      services: 2,
      customers: 34,
      rating: 4.6,
      verified: false,
      revenue: '980 SUI',
    },
    {
      name: 'Sui Analytics Pro',
      description: 'Blockchain analytics and indexing services',
      services: 4,
      customers: 56,
      rating: 4.9,
      verified: true,
      revenue: '1,650 SUI',
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Infrastructure Service Providers
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Discover trusted infrastructure providers powering the Sui ecosystem with reliable and scalable services.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/register?role=provider">Become a Provider</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/services">Browse Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">47</div>
              <div className="text-sm text-muted-foreground">Active Providers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">156</div>
              <div className="text-sm text-muted-foreground">Total Services</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">1,249</div>
              <div className="text-sm text-muted-foreground">Developers Served</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">99.7%</div>
              <div className="text-sm text-muted-foreground">Avg Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Providers */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-4">Top Infrastructure Providers</h2>
            <p className="text-muted-foreground">Leading providers building the Sui infrastructure ecosystem</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topProviders.map((provider, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {provider.name}
                        {provider.verified && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">{provider.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{provider.services} Services</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{provider.customers} Customers</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span>{provider.rating}/5.0</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span>{provider.revenue}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/services">View Services</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Become a Provider?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              List your infrastructure services and reach thousands of developers building on Sui
            </p>
            <Button size="lg" asChild>
              <Link href="/register?role=provider">Get Started Today</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}