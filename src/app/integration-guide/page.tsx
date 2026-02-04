import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Code2, CheckCircle, AlertCircle } from 'lucide-react';

export default function IntegrationGuidePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Integration Guide
              </h1>
              <p className="text-xl text-muted-foreground">
                Step-by-step guide to integrate infrastructure services into your dApp
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
                  <TabsTrigger value="rpc-integration">RPC Nodes</TabsTrigger>
                  <TabsTrigger value="oracle-integration">Oracles</TabsTrigger>
                  <TabsTrigger value="storage-integration">Storage</TabsTrigger>
                </TabsList>

                {/* Getting Started */}
                <TabsContent value="getting-started" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Code2 className="h-5 w-5" />
                        Quick Start Integration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-3">1. Subscribe to a Service</h3>
                        <p className="text-muted-foreground mb-3">
                          Browse the marketplace and subscribe to the infrastructure service you need.
                        </p>
                        <div className="bg-muted p-4 rounded-lg">
                          <Badge>Developer Dashboard</Badge>
                          <p className="text-sm mt-2">Navigate to Services → Choose a service → Subscribe</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">2. Get Your API Key</h3>
                        <p className="text-muted-foreground mb-3">
                          After subscribing, you'll receive an API key for authentication.
                        </p>
                        <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                          <pre>API_KEY=sk_live_abc123xyz456...</pre>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">3. Configure Your Application</h3>
                        <p className="text-muted-foreground mb-3">
                          Add the service endpoint and API key to your environment variables.
                        </p>
                        <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                          <pre>{`# .env
RPC_ENDPOINT=https://rpc.fastnode.io/v1
API_KEY=sk_live_abc123xyz456...`}</pre>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">4. Make Your First Request</h3>
                        <p className="text-muted-foreground mb-3">
                          Start using the service in your application code.
                        </p>
                        <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                          <pre>{`import { SuiClient } from '@mysten/sui.js/client';

const client = new SuiClient({
  url: process.env.RPC_ENDPOINT,
  headers: {
    'Authorization': \`Bearer \${process.env.API_KEY}\`
  }
});

// Query the blockchain
const latestCheckpoint = await client.getLatestCheckpointSequenceNumber();
console.log('Latest checkpoint:', latestCheckpoint);`}</pre>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Best Practices</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Store API keys securely</p>
                            <p className="text-sm text-muted-foreground">Never commit keys to version control</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Monitor quota usage</p>
                            <p className="text-sm text-muted-foreground">Track usage to avoid service interruptions</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Implement error handling</p>
                            <p className="text-sm text-muted-foreground">Handle rate limits and network errors gracefully</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Use connection pooling</p>
                            <p className="text-sm text-muted-foreground">Reuse connections for better performance</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* RPC Integration */}
                <TabsContent value="rpc-integration" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>RPC Node Integration</CardTitle>
                      <CardDescription>Connect your dApp to high-performance RPC nodes</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        RPC nodes provide access to the Sui blockchain for querying state and submitting transactions.
                      </p>
                      <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                        <pre>{`import { SuiClient } from '@mysten/sui.js/client';

const client = new SuiClient({
  url: 'https://rpc.fastnode.io/v1',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'X-Request-ID': 'unique-request-id' // Optional for tracking
  }
});

// Query objects
const objects = await client.getOwnedObjects({
  owner: '0x...',
});

// Execute transaction
const txResult = await client.executeTransactionBlock({
  transactionBlock: txBytes,
  signature,
});`}</pre>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Advanced Features</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Load Balancing</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Distribute requests across multiple nodes for better reliability
                        </p>
                        <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                          <pre>{`const nodes = [
  'https://rpc.fastnode.io/v1',
  'https://rpc.fastnode.io/v2',
];

const client = new SuiClient({
  url: nodes[Math.floor(Math.random() * nodes.length)]
});`}</pre>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Oracle Integration */}
                <TabsContent value="oracle-integration" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Oracle Integration</CardTitle>
                      <CardDescription>Access real-time price feeds and external data</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        Oracles provide off-chain data to your smart contracts, such as price feeds for DeFi applications.
                      </p>
                      <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                        <pre>{`// Fetch price data
const response = await fetch('https://oracle.example.io/v1/prices/SUI-USD', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});

const priceData = await response.json();
console.log('SUI Price:', priceData.price);
console.log('Last Updated:', priceData.timestamp);`}</pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Storage Integration */}
                <TabsContent value="storage-integration" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Decentralized Storage Integration</CardTitle>
                      <CardDescription>Store NFT assets and dApp data on IPFS</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        Use decentralized storage for NFT metadata, images, and other large files.
                      </p>
                      <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                        <pre>{`// Upload file to IPFS
const formData = new FormData();
formData.append('file', file);

const response = await fetch('https://ipfs.example.io/v1/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: formData
});

const result = await response.json();
console.log('IPFS Hash:', result.cid);
console.log('Gateway URL:', \`https://ipfs.io/ipfs/\${result.cid}\`);`}</pre>
                      </div>
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
