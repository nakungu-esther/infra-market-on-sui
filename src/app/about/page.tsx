import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Zap, Shield, Users, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-accent/5 via-background to-primary/5 py-20">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-accent to-primary mb-6 shadow-lg">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              About Sui Discovery
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The decentralized marketplace for blockchain infrastructure services on the Sui network
            </p>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  Sui Discovery connects developers building on Sui with essential infrastructure services 
                  through a transparent, blockchain-powered marketplace. We make it easier to find, purchase, 
                  and integrate critical services like RPC nodes, oracles, indexers, and storage solutions.
                </p>
                <p>
                  By leveraging smart contracts and NFT entitlements, we create a seamless payment and 
                  validation system that benefits both service providers and developers.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-2">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                  <CardTitle>Discover</CardTitle>
                  <CardDescription>
                    Browse and search infrastructure services
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Search for RPC nodes, oracles, indexers, and more. Filter by price, uptime, 
                  and features to find exactly what you need for your Sui project.
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-accent">2</span>
                  </div>
                  <CardTitle>Purchase</CardTitle>
                  <CardDescription>
                    Pay with SUI tokens via smart contract
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Connect your Sui wallet and complete payment. The smart contract automatically 
                  mints an NFT entitlement that grants access to your purchased service.
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-secondary">3</span>
                  </div>
                  <CardTitle>Use</CardTitle>
                  <CardDescription>
                    Access services with your NFT entitlement
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Make API requests to your service. The provider validates your NFT ownership 
                  on-chain and tracks usage against your quota automatically.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Benefits for Everyone</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-2 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <CardTitle>For Developers</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Find all infrastructure services in one marketplace
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Instant access after payment - no waiting for approval
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Pay with crypto - SUI tokens or stablecoins
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Transparent pricing and clear usage quotas
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <CardTitle>For Service Providers</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Zap className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      List your services and reach global developers instantly
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Automated payments via smart contracts - no invoicing
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Blockchain-verified entitlements reduce fraud
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Flexible pricing models - subscriptions, credits, or usage-based
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join the Sui Discovery marketplace today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                <Link href="/register?role=developer">
                  Start as Developer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/register?role=provider">
                  List Your Services
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}