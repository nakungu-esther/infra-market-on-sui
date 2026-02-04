'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Package, Calendar, TrendingUp, AlertCircle, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface Subscription {
  id: number;
  serviceId: number;
  serviceName: string;
  pricingTier: string;
  amountPaid: string;
  quotaLimit: number;
  quotaUsed: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  status: 'active' | 'expired' | 'cancelled';
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading - replace with actual API call
    setTimeout(() => {
      setLoading(false);
      // Mock data
      setSubscriptions([]);
    }, 500);
  }, []);

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const expiredSubscriptions = subscriptions.filter(s => s.status === 'expired');
  const cancelledSubscriptions = subscriptions.filter(s => s.status === 'cancelled');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-600">Active</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDaysRemaining = (validUntil: string) => {
    const days = Math.ceil((new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Subscriptions</h1>
            <p className="text-muted-foreground">
              Manage your active service subscriptions and view history
            </p>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activeSubscriptions.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Expired
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{expiredSubscriptions.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cancelled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{cancelledSubscriptions.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Subscriptions Tabs */}
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="active">Active ({activeSubscriptions.length})</TabsTrigger>
              <TabsTrigger value="expired">Expired ({expiredSubscriptions.length})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({cancelledSubscriptions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6">
              {activeSubscriptions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Active Subscriptions</h3>
                    <p className="text-muted-foreground mb-4">
                      Browse our marketplace to find infrastructure services
                    </p>
                    <Button asChild>
                      <Link href="/services">Browse Services</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {activeSubscriptions.map((sub) => {
                    const percentage = (sub.quotaUsed / sub.quotaLimit) * 100;
                    const daysRemaining = getDaysRemaining(sub.validUntil);

                    return (
                      <Card key={sub.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-xl">{sub.serviceName}</CardTitle>
                              <CardDescription className="capitalize mt-1">
                                {sub.pricingTier} Tier
                              </CardDescription>
                            </div>
                            {getStatusBadge(sub.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Pricing & Renewal */}
                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <p className="text-muted-foreground">Price</p>
                              <p className="font-bold text-lg">{sub.amountPaid} SUI/month</p>
                            </div>
                            <div className="text-right">
                              <p className="text-muted-foreground">Renews</p>
                              <p className="font-medium">
                                {new Date(sub.validUntil).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </p>
                              {daysRemaining <= 7 && daysRemaining > 0 && (
                                <p className="text-xs text-orange-600 mt-1">
                                  <AlertCircle className="h-3 w-3 inline mr-1" />
                                  {daysRemaining} days remaining
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quota Usage */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Usage</span>
                              <span className="font-medium">
                                {sub.quotaUsed.toLocaleString()} / {sub.quotaLimit.toLocaleString()} requests
                              </span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {Math.round(percentage)}% used • {(sub.quotaLimit - sub.quotaUsed).toLocaleString()} remaining
                            </p>
                          </div>

                          {/* Warning for high usage */}
                          {percentage >= 90 && (
                            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 p-3">
                              <div className="flex items-center gap-2 text-sm text-red-800 dark:text-red-200">
                                <AlertCircle className="h-4 w-4" />
                                Quota almost exhausted - consider upgrading
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm" asChild className="flex-1">
                              <Link href={`/services/${sub.serviceId}`}>
                                <ArrowUpRight className="h-4 w-4 mr-1" />
                                Upgrade
                              </Link>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => toast.info('Cancel functionality coming soon')}
                            >
                              Cancel
                            </Button>
                            <Button variant="outline" size="sm" asChild className="flex-1">
                              <Link href={`/services/${sub.serviceId}`}>View Details</Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="expired" className="mt-6">
              {expiredSubscriptions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No expired subscriptions</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {expiredSubscriptions.map((sub) => (
                    <Card key={sub.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">{sub.serviceName}</CardTitle>
                            <CardDescription className="capitalize mt-1">
                              {sub.pricingTier} Tier
                            </CardDescription>
                          </div>
                          {getStatusBadge(sub.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground mb-4">
                          Expired on {new Date(sub.validUntil).toLocaleDateString()}
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/services/${sub.serviceId}`}>Renew Subscription</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="mt-6">
              {cancelledSubscriptions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No cancelled subscriptions</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {cancelledSubscriptions.map((sub) => (
                    <Card key={sub.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">{sub.serviceName}</CardTitle>
                            <CardDescription className="capitalize mt-1">
                              {sub.pricingTier} Tier
                            </CardDescription>
                          </div>
                          {getStatusBadge(sub.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground mb-4">
                          Cancelled on {new Date(sub.validUntil).toLocaleDateString()}
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/services/${sub.serviceId}`}>Resubscribe</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}