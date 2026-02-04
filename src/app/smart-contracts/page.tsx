import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Code2, FileCode, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

export default function SmartContractsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Smart Contracts
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Explore the smart contracts powering our infrastructure marketplace
              </p>
              <Button size="lg" asChild>
                <Link href="https://github.com/sui-foundation" target="_blank">
                  View on GitHub
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Contract Overview */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto space-y-12">
              {/* Core Contracts */}
              <div>
                <h2 className="text-3xl font-bold mb-6">Core Contracts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <FileCode className="h-5 w-5" />
                          Service Registry
                        </CardTitle>
                        <Badge>v1.0.0</Badge>
                      </div>
                      <CardDescription>Main marketplace contract for service listings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Contract Address:</p>
                        <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                          0x...service_registry_address
                        </code>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Key Functions:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• list_service() - Register new service</li>
                          <li>• update_service() - Modify service details</li>
                          <li>• get_service() - Query service information</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          Subscription Manager
                        </CardTitle>
                        <Badge>v1.0.0</Badge>
                      </div>
                      <CardDescription>Handles service subscriptions and payments</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Contract Address:</p>
                        <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                          0x...subscription_manager_address
                        </code>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Key Functions:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• subscribe() - Create new subscription</li>
                          <li>• renew() - Extend subscription</li>
                          <li>• cancel() - Cancel subscription</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Payment Processor
                        </CardTitle>
                        <Badge>v1.0.0</Badge>
                      </div>
                      <CardDescription>Secure payment handling with multi-token support</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Contract Address:</p>
                        <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                          0x...payment_processor_address
                        </code>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Key Functions:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• process_payment() - Handle payment</li>
                          <li>• refund() - Issue refund</li>
                          <li>• get_balance() - Check account balance</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Code2 className="h-5 w-5" />
                          Usage Tracker
                        </CardTitle>
                        <Badge>v1.0.0</Badge>
                      </div>
                      <CardDescription>On-chain quota and usage monitoring</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Contract Address:</p>
                        <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                          0x...usage_tracker_address
                        </code>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Key Functions:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• track_usage() - Record API call</li>
                          <li>• get_quota() - Check remaining quota</li>
                          <li>• reset_quota() - Reset usage counter</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Contract Source Code */}
              <div>
                <h2 className="text-3xl font-bold mb-6">Example: Service Listing Contract</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>service_registry.move</CardTitle>
                    <CardDescription>Move smart contract for service registration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-6 rounded-lg font-mono text-sm overflow-x-auto">
                      <pre>{`module sui_discovery::service_registry {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::String;

    /// Service struct representing a listed infrastructure service
    struct Service has key, store {
        id: UID,
        owner: address,
        name: String,
        description: String,
        service_type: String,
        endpoint: String,
        is_active: bool,
        created_at: u64,
    }

    /// Register a new service on the marketplace
    public entry fun list_service(
        name: String,
        description: String,
        service_type: String,
        endpoint: String,
        ctx: &mut TxContext
    ) {
        let service = Service {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            name,
            description,
            service_type,
            endpoint,
            is_active: true,
            created_at: tx_context::epoch(ctx),
        };
        
        transfer::share_object(service);
    }

    /// Update service details (only owner can update)
    public entry fun update_service(
        service: &mut Service,
        name: String,
        description: String,
        endpoint: String,
        ctx: &mut TxContext
    ) {
        assert!(service.owner == tx_context::sender(ctx), 0);
        service.name = name;
        service.description = description;
        service.endpoint = endpoint;
    }

    /// Deactivate a service
    public entry fun deactivate_service(
        service: &mut Service,
        ctx: &mut TxContext
    ) {
        assert!(service.owner == tx_context::sender(ctx), 0);
        service.is_active = false;
    }
}`}</pre>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Security & Audits */}
              <div>
                <h2 className="text-3xl font-bold mb-6">Security & Audits</h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Third-Party Audited</p>
                          <p className="text-sm text-muted-foreground">
                            All smart contracts have been audited by leading blockchain security firms
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Open Source</p>
                          <p className="text-sm text-muted-foreground">
                            All contract code is publicly available for community review
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Bug Bounty Program</p>
                          <p className="text-sm text-muted-foreground">
                            Active bug bounty program for responsible disclosure
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
