import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Zap, Code, Globe } from "lucide-react";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="secondary" className="mb-4">
            Built on Sui Blockchain
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Discover Infrastructure Services for{" "}
            <span className="text-primary">Sui Blockchain</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find, integrate, and pay for infrastructure services on Sui. From RPC nodes to indexers, 
            oracles to storage solutions - all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">
                Get Started - Sign Up Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">
                Login to Browse Services
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            🔒 Sign up required to browse and access services
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose Sui Discovery?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A modular, extensible platform for infrastructure service discovery and onchain payments
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Comprehensive Directory</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Browse through a curated list of infrastructure services with detailed metadata, 
                  pricing, and performance metrics.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Onchain Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Pay for services directly on Sui blockchain using SUI, WAL, or stablecoins. 
                  Transparent and secure transactions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Usage Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Automatic entitlement validation and usage tracking. Monitor your quotas 
                  and consumption in real-time.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Developer Friendly</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Machine-readable metadata, comprehensive APIs, and easy integration with 
                  common API gateways.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-12">
              <div className="max-w-3xl mx-auto text-center space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Ready to Get Started?
                </h2>
                <p className="text-lg opacity-90">
                  Join the growing ecosystem of infrastructure providers and developers building on Sui
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/register">
                      Create Free Account
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                    <Link href="/docs">
                      View Documentation
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-muted-foreground">Services</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">20+</div>
              <div className="text-muted-foreground">Providers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">1M+</div>
              <div className="text-muted-foreground">API Calls/Day</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}