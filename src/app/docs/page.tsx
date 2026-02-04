import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, BookOpen, Shield, Zap, Settings, FileCode } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <Badge variant="secondary" className="mb-2">
              <BookOpen className="h-3 w-3 mr-1" />
              Documentation
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight">
              Sui Infrastructure Platform
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Complete guide to integrating infrastructure services with onchain payments and usage tracking
            </p>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payment">Payments</TabsTrigger>
              <TabsTrigger value="usage">Usage API</TabsTrigger>
              <TabsTrigger value="enforcement">Enforcement</TabsTrigger>
              <TabsTrigger value="integration">Integration</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Architecture</CardTitle>
                  <CardDescription>Three-phase infrastructure service platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 p-4 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="font-semibold">Phase 1</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Service Discovery Portal with comprehensive metadata and filtering
                      </p>
                    </div>
                    <div className="space-y-2 p-4 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="font-semibold">Phase 2</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Onchain Payments with SUI, WAL, and stablecoin support
                      </p>
                    </div>
                    <div className="space-y-2 p-4 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="font-semibold">Phase 3</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Usage Tracking & Enforcement via API gateway integration
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <h4 className="font-semibold">Key Features</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span><strong>Flexible Metadata:</strong> JSON-based service configuration with custom fields</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span><strong>Multi-Token Payments:</strong> Support for SUI, WAL, and USDC stablecoins</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span><strong>Real-Time Tracking:</strong> Automatic usage monitoring and quota enforcement</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span><strong>API Gateway Ready:</strong> Compatible with HAProxy, Envoy, NGINX, Kong</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Start</CardTitle>
                  <CardDescription>Get started in 3 simple steps</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-bold">
                        1
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold">Browse Services</h4>
                        <p className="text-sm text-muted-foreground">
                          Explore RPC nodes, indexers, oracles, and storage solutions on Sui
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-bold">
                        2
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold">Subscribe & Pay</h4>
                        <p className="text-sm text-muted-foreground">
                          Connect your Sui wallet and pay with SUI, WAL, or USDC tokens
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-bold">
                        3
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold">Integrate & Track</h4>
                        <p className="text-sm text-muted-foreground">
                          Use our APIs to track usage and enforce quotas automatically
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Onchain Payment Flow</CardTitle>
                  <CardDescription>Pay for services using Sui blockchain</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-muted p-4 space-y-3">
                    <h4 className="font-semibold text-sm">Payment Process</h4>
                    <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                      <li>User selects a pricing tier (Free, Basic, Pro, Enterprise)</li>
                      <li>User chooses payment token (SUI, WAL, or USDC)</li>
                      <li>Transaction is executed on Sui blockchain</li>
                      <li>Entitlement is created with quota limits</li>
                      <li>User receives access credentials</li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Supported Tokens</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg border p-3 text-center">
                        <div className="font-semibold">SUI</div>
                        <div className="text-xs text-muted-foreground">Native Token</div>
                      </div>
                      <div className="rounded-lg border p-3 text-center">
                        <div className="font-semibold">WAL</div>
                        <div className="text-xs text-muted-foreground">Walrus Token</div>
                      </div>
                      <div className="rounded-lg border p-3 text-center">
                        <div className="font-semibold">USDC</div>
                        <div className="text-xs text-muted-foreground">Stablecoin</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <div className="text-xs text-muted-foreground mb-2">POST /api/entitlements</div>
                    <pre className="text-xs">{`{
  "serviceId": 1,
  "paymentId": "PAY-ABC123",
  "pricingTier": "pro",
  "quotaLimit": 1000000,
  "validFrom": "2024-01-01T00:00:00Z",
  "validUntil": "2024-02-01T00:00:00Z",
  "tokenType": "SUI",
  "amountPaid": "50",
  "txDigest": "0x..."
}`}</pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Usage API Tab */}
            <TabsContent value="usage" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Tracking API</CardTitle>
                  <CardDescription>Track and monitor API consumption</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Verify Entitlement
                      </h4>
                      <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                        <div className="text-xs text-muted-foreground mb-2">POST /api/entitlements/verify</div>
                        <pre className="text-xs">{`{
  "serviceId": 1
}

Response:
{
  "success": true,
  "entitlement": {
    "id": 123,
    "quotaLimit": 1000000,
    "quotaUsed": 45000,
    "remainingQuota": 955000
  }
}`}</pre>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Track Usage
                      </h4>
                      <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                        <div className="text-xs text-muted-foreground mb-2">POST /api/usage/track</div>
                        <pre className="text-xs">{`{
  "serviceId": 1,
  "endpoint": "/rpc/getLatestBlock",
  "requestsCount": 1
}

Response:
{
  "usageLog": {...},
  "remainingQuota": 954999,
  "quotaLimit": 1000000
}`}</pre>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Get Statistics
                      </h4>
                      <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                        <div className="text-xs text-muted-foreground mb-2">GET /api/usage/stats</div>
                        <pre className="text-xs">{`Response:
{
  "totalRequests": 125000,
  "uniqueServices": 5,
  "requestsByService": [...],
  "requestsByDay": [...],
  "averageRequestsPerDay": 4166
}`}</pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Enforcement Tab */}
            <TabsContent value="enforcement" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Gateway Enforcement</CardTitle>
                  <CardDescription>Integrate with your existing infrastructure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">Enforcement Flow</h4>
                      <div className="rounded-lg border divide-y">
                        {[
                          { step: "1", title: "Request Intercepted", desc: "API gateway intercepts incoming request" },
                          { step: "2", title: "Verify Entitlement", desc: "Call /api/entitlements/verify endpoint" },
                          { step: "3", title: "Check Quota", desc: "Validate remaining quota availability" },
                          { step: "4", title: "Allow/Deny", desc: "Forward request or return 403 error" },
                          { step: "5", title: "Track Usage", desc: "Record usage via /api/usage/track" },
                        ].map((item) => (
                          <div key={item.step} className="p-4 flex gap-4">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                              {item.step}
                            </div>
                            <div>
                              <div className="font-medium">{item.title}</div>
                              <div className="text-sm text-muted-foreground">{item.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Supported Gateways</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {["HAProxy", "Envoy", "NGINX", "Kong"].map((gateway) => (
                          <div key={gateway} className="rounded-lg border p-4 text-center">
                            <Settings className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                            <div className="font-medium text-sm">{gateway}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex gap-2">
                        <FileCode className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="font-semibold text-sm text-yellow-900 dark:text-yellow-100">
                            Implementation Required
                          </div>
                          <div className="text-sm text-yellow-800 dark:text-yellow-200">
                            Gateway plugins/sidecars need custom implementation based on your infrastructure. Reference implementation examples available in our GitHub repository.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Integration Tab */}
            <TabsContent value="integration" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Integration Guide</CardTitle>
                  <CardDescription>Step-by-step integration instructions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">For Service Providers</h4>
                      <ol className="space-y-3 text-sm">
                        <li className="flex gap-3">
                          <span className="font-semibold">1.</span>
                          <span>Register your account and select "Provider" role</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="font-semibold">2.</span>
                          <span>Create service listing with detailed metadata</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="font-semibold">3.</span>
                          <span>Configure pricing tiers (Free, Basic, Pro, Enterprise)</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="font-semibold">4.</span>
                          <span>Integrate usage tracking API into your service</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="font-semibold">5.</span>
                          <span>Deploy API gateway enforcement layer</span>
                        </li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">For Developers</h4>
                      <ol className="space-y-3 text-sm">
                        <li className="flex gap-3">
                          <span className="font-semibold">1.</span>
                          <span>Browse service directory and select services</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="font-semibold">2.</span>
                          <span>Connect Sui wallet and subscribe to service tiers</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="font-semibold">3.</span>
                          <span>Receive API credentials and endpoint URLs</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="font-semibold">4.</span>
                          <span>Integrate service APIs into your application</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="font-semibold">5.</span>
                          <span>Monitor usage and quotas in dashboard</span>
                        </li>
                      </ol>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                            API Documentation
                          </div>
                          <div className="text-sm text-blue-800 dark:text-blue-200">
                            Full API reference with examples available at /api/docs (OpenAPI/Swagger spec)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
