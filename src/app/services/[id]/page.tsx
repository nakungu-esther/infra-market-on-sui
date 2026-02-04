'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentDialog } from '@/components/sui/payment-dialog';
import { WalletConnectButton } from '@/components/sui/wallet-connect-button';
import { useCurrentAccount } from '@mysten/dapp-kit';
import {
  CheckCircle2,
  ExternalLink,
  Mail,
  Check,
  ArrowLeft,
  Loader2,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Service {
  id: number;
  name: string;
  description: string;
  serviceType: string;
  status: string;
  metadata: any;
}

interface PricingTier {
  id: number;
  serviceId: number;
  tierName: string;
  priceSui: string;
  priceWal: string;
  priceUsdc: string;
  quotaLimit: number;
  validityDays: number;
  features: string[];
  isActive: boolean;
}

export default function ServiceDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const account = useCurrentAccount();
  const [service, setService] = useState<Service | null>(null);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    fetchServiceData();
  }, [id]);

  const fetchServiceData = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [serviceRes, pricingRes] = await Promise.all([
        fetch(`/api/services/${id}`, { headers }),
        fetch(`/api/pricing?serviceId=${id}`, { headers }),
      ]);

      if (serviceRes.ok) {
        const serviceData = await serviceRes.json();
        setService(serviceData);
      } else {
        toast.error('Failed to load service details');
      }

      if (pricingRes.ok) {
        const pricingData = await pricingRes.json();
        setPricingTiers(pricingData);
      }
    } catch (error) {
      console.error('Error fetching service:', error);
      toast.error('Failed to load service');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (tier: PricingTier) => {
    if (!session?.user) {
      toast.error('Please login to purchase');
      router.push(`/login?redirect=/services/${id}`);
      return;
    }
    
    if (!account) {
      toast.error('Please connect your Sui wallet first');
      return;
    }
    
    setSelectedTier(tier);
    setShowPayment(true);
  };

  const handlePaymentSuccess = (transactionDigest: string) => {
    toast.success('Payment successful! Your subscription is now active.');
    setShowPayment(false);
    router.push('/dashboard/usage');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading service details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
            <Button asChild>
              <Link href="/services">Browse Services</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          {/* Back button */}
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link href="/services">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Services
            </Link>
          </Button>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold">{service.name}</h1>
                  <CheckCircle2 className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={service.status === 'active' ? 'default' : 'secondary'} className="text-base px-3 py-1">
                  {service.status}
                </Badge>
                <WalletConnectButton />
              </div>
            </div>

            <p className="text-lg leading-relaxed mb-6">{service.description}</p>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">{service.serviceType.replace('-', ' ')}</Badge>
            </div>
          </div>

          {/* Pricing Tiers */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Pricing Plans</h2>
            
            {pricingTiers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No pricing tiers available</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {pricingTiers.map((tier) => (
                  <Card key={tier.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="capitalize">{tier.tierName}</CardTitle>
                      <CardDescription>
                        <div className="text-3xl font-bold text-foreground mt-2">
                          {parseFloat(tier.priceSui) === 0 ? 'Free' : `${tier.priceSui} SUI`}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          per {tier.validityDays} days
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          {tier.quotaLimit.toLocaleString()} requests
                        </p>
                        <div className="space-y-2">
                          {tier.features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button 
                        className="w-full mt-auto" 
                        onClick={() => handlePurchase(tier)}
                        variant={parseFloat(tier.priceSui) === 0 ? 'outline' : 'default'}
                        disabled={!session?.user || !account}
                      >
                        {!session?.user ? (
                          'Login Required'
                        ) : !account ? (
                          <>
                            <Wallet className="mr-2 h-4 w-4" />
                            Connect Wallet
                          </>
                        ) : parseFloat(tier.priceSui) === 0 ? (
                          'Get Started'
                        ) : (
                          'Subscribe'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Service Details */}
          <div className="mt-12">
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <p className="font-medium capitalize">{service.serviceType.replace('-', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-medium capitalize">{service.status}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {service.metadata?.contactEmail && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${service.metadata.contactEmail}`}
                          className="text-primary hover:underline"
                        >
                          {service.metadata.contactEmail}
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {service.metadata?.documentationUrl && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Resources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <a
                        href={service.metadata.documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Documentation
                      </a>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="metadata" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      {JSON.stringify(service.metadata || {}, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />

      {/* Sui Payment Dialog */}
      {selectedTier && service && (
        <PaymentDialog
          open={showPayment}
          onOpenChange={setShowPayment}
          serviceId={service.id.toString()}
          serviceName={service.name}
          tierId={selectedTier.id.toString()}
          tierName={selectedTier.tierName}
          price={parseFloat(selectedTier.priceSui)}
          duration={selectedTier.validityDays}
          providerAddress={service.metadata?.providerWalletAddress || process.env.NEXT_PUBLIC_SUI_PLATFORM_ADDRESS || '0x...'}
          quota={`${selectedTier.quotaLimit.toLocaleString()} requests`}
          features={selectedTier.features}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}