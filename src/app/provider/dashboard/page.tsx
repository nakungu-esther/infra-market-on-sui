'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Plus, BarChart3, DollarSign, Users, TrendingUp, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface ProviderAnalytics {
  totalRevenue: number;
  activeCustomers: number;
  listedServices: number;
  totalApiCalls: number;
  revenueByTier: {
    free: { count: number; revenue: number };
    basic: { count: number; revenue: number };
    pro: { count: number; revenue: number };
    enterprise: { count: number; revenue: number };
  };
  recentActivity: Array<{
    id: number;
    userId: string;
    userName: string;
    serviceId: number;
    pricingTier: string;
    amountPaid: string;
    createdAt: string;
  }>;
}

export default function ProviderDashboard() {
  const [analytics, setAnalytics] = useState<ProviderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

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
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center mb-2">
                  <Briefcase className="h-8 w-8 text-primary mr-3" />
                  <h1 className="text-4xl font-bold">Provider Dashboard</h1>
                </div>
                <p className="text-muted-foreground">
                  Welcome back, <span className="font-semibold text-foreground">Service Provider</span>
                </p>
                <Badge className="mt-2" variant="secondary">
                  <Briefcase className="h-3 w-3 mr-1" />
                  Service Provider
                </Badge>
              </div>
              <Button asChild className="cursor-pointer">
                <Link href="/profile">View Profile</Link>
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>Total Revenue</span>
                  <DollarSign className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics?.totalRevenue?.toFixed(2) || 0} SUI</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All-time earnings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>Active Customers</span>
                  <Users className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics?.activeCustomers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current subscribers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>Listed Services</span>
                  <Package className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics?.listedServices || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active infrastructure services
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>API Calls</span>
                  <TrendingUp className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics?.totalApiCalls?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total requests served
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-primary" />
                  Add Service
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">List a new infrastructure service</p>
                <Button className="w-full cursor-pointer" variant="outline" asChild>
                  <Link href="/provider/services/new">Create Service</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Package className="h-5 w-5 mr-2 text-accent" />
                  My Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Manage your listed services</p>
                <Button className="w-full cursor-pointer" variant="outline" asChild>
                  <Link href="/provider/services">View All</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">View detailed revenue reports</p>
                <Button className="w-full cursor-pointer" variant="outline" asChild>
                  <Link href="/provider/revenue">See Details</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Manage customer subscriptions</p>
                <Button className="w-full cursor-pointer" variant="outline" asChild>
                  <Link href="/provider/customers">View Customers</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest subscriptions and sales</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{activity.userName}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {activity.pricingTier} tier • {new Date(activity.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary">{activity.amountPaid} SUI</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No recent activity yet</p>
                    <p className="text-sm mt-2">Start by adding your first service to the platform</p>
                    <Button asChild className="mt-4 cursor-pointer" variant="outline">
                      <Link href="/provider/services/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Service
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Tier</CardTitle>
                <CardDescription>Earnings breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Free Tier</p>
                    <p className="text-xs text-muted-foreground">{analytics?.revenueByTier?.free?.count || 0} users</p>
                  </div>
                  <span className="font-bold">{analytics?.revenueByTier?.free?.revenue?.toFixed(2) || 0} SUI</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Basic Tier</p>
                    <p className="text-xs text-muted-foreground">{analytics?.revenueByTier?.basic?.count || 0} users</p>
                  </div>
                  <span className="font-bold">{analytics?.revenueByTier?.basic?.revenue?.toFixed(2) || 0} SUI</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Pro Tier</p>
                    <p className="text-xs text-muted-foreground">{analytics?.revenueByTier?.pro?.count || 0} users</p>
                  </div>
                  <span className="font-bold">{analytics?.revenueByTier?.pro?.revenue?.toFixed(2) || 0} SUI</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Enterprise</p>
                    <p className="text-xs text-muted-foreground">{analytics?.revenueByTier?.enterprise?.count || 0} users</p>
                  </div>
                  <span className="font-bold">{analytics?.revenueByTier?.enterprise?.revenue?.toFixed(2) || 0} SUI</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}