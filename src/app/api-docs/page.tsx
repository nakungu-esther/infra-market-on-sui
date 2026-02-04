import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Book, Zap, Shield } from 'lucide-react';

export default function ApiDocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                API Documentation
              </h1>
              <p className="text-xl text-muted-foreground">
                Complete reference for integrating with Sui Infrastructure Service Discovery
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <Tabs defaultValue="getting-started" className="space-y-8">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
                  <TabsTrigger value="authentication">Authentication</TabsTrigger>
                  <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                  <TabsTrigger value="usage-tracking">Usage Tracking</TabsTrigger>
                </TabsList>

                {/* Getting Started */}
                <TabsContent value="getting-started" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Book className="h-5 w-5" />
                        Introduction
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        The Sui Infrastructure Service Discovery API allows you to programmatically browse services, manage subscriptions, and track usage. All API requests are authenticated using bearer tokens.
                      </p>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm font-semibold mb-2">Base URL</p>
                        <code className="text-sm">https://api.suidiscovery.io/api</code>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Start</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                        <li>Create an account and log in</li>
                        <li>Generate an API key from your dashboard</li>
                        <li>Include the API key in the Authorization header</li>
                        <li>Make your first API request</li>
                      </ol>
                      <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                        <pre>{`curl -X GET https://api.suidiscovery.io/api/services \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Authentication */}
                <TabsContent value="authentication" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Authentication
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        All API requests require authentication using a bearer token in the Authorization header.
                      </p>
                      <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                        <pre>Authorization: Bearer YOUR_API_KEY</pre>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold">Obtaining API Keys</h4>
                        <p className="text-sm text-muted-foreground">
                          Generate API keys from your dashboard at <code>/dashboard/api-keys</code>. Each key is associated with your user account and role.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Error Responses</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <Badge variant="destructive">401 Unauthorized</Badge>
                          <p className="text-sm text-muted-foreground mt-2">Invalid or missing API key</p>
                        </div>
                        <div>
                          <Badge variant="destructive">403 Forbidden</Badge>
                          <p className="text-sm text-muted-foreground mt-2">Insufficient permissions for this resource</p>
                        </div>
                        <div>
                          <Badge variant="destructive">429 Too Many Requests</Badge>
                          <p className="text-sm text-muted-foreground mt-2">Rate limit exceeded</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Endpoints */}
                <TabsContent value="endpoints" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        API Endpoints
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Services */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Services</h3>
                        <div className="space-y-4">
                          <div className="border-l-4 border-primary pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge>GET</Badge>
                              <code className="text-sm">/api/services</code>
                            </div>
                            <p className="text-sm text-muted-foreground">List all available services</p>
                          </div>

                          <div className="border-l-4 border-primary pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge>GET</Badge>
                              <code className="text-sm">/api/services/:id</code>
                            </div>
                            <p className="text-sm text-muted-foreground">Get service details</p>
                          </div>

                          <div className="border-l-4 border-green-500 pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">POST</Badge>
                              <code className="text-sm">/api/developer/services/:id/subscribe</code>
                            </div>
                            <p className="text-sm text-muted-foreground">Subscribe to a service</p>
                          </div>
                        </div>
                      </div>

                      {/* Subscriptions */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Subscriptions</h3>
                        <div className="space-y-4">
                          <div className="border-l-4 border-primary pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge>GET</Badge>
                              <code className="text-sm">/api/developer/subscriptions</code>
                            </div>
                            <p className="text-sm text-muted-foreground">List your subscriptions</p>
                          </div>

                          <div className="border-l-4 border-green-500 pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">POST</Badge>
                              <code className="text-sm">/api/developer/subscriptions/:id/cancel</code>
                            </div>
                            <p className="text-sm text-muted-foreground">Cancel a subscription</p>
                          </div>
                        </div>
                      </div>

                      {/* Usage */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Usage</h3>
                        <div className="space-y-4">
                          <div className="border-l-4 border-primary pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge>GET</Badge>
                              <code className="text-sm">/api/usage/stats</code>
                            </div>
                            <p className="text-sm text-muted-foreground">Get usage statistics</p>
                          </div>

                          <div className="border-l-4 border-green-500 pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">POST</Badge>
                              <code className="text-sm">/api/usage/track</code>
                            </div>
                            <p className="text-sm text-muted-foreground">Track API usage</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Usage Tracking */}
                <TabsContent value="usage-tracking" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Usage Tracking
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        Track API usage for quota management and billing. The gateway automatically tracks requests for you.
                      </p>
                      <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                        <pre>{`POST /api/usage/track
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "serviceId": 1,
  "endpoint": "/rpc/v1/call",
  "method": "POST",
  "statusCode": 200,
  "responseTime": 45
}`}</pre>
                      </div>
                      <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                        <pre>{`{
  "success": true,
  "quotaUsed": 1234,
  "quotaLimit": 10000,
  "quotaRemaining": 8766
}`}</pre>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Gateway Integration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        For automated usage tracking, integrate our gateway into your infrastructure. See the{' '}
                        <a href="/integration-guide" className="text-primary hover:underline">
                          Integration Guide
                        </a>{' '}
                        for detailed instructions.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
