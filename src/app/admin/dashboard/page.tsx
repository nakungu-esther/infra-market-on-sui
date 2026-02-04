'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, Users, Package, AlertTriangle, CheckCircle, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Analytics {
  totalUsers: number;
  totalServices: number;
  totalProviders: number;
  totalDevelopers: number;
  pendingServices: number;
  activeServices: number;
  totalRevenue: number;
  last30DaysRevenue: number;
  revenueGrowth: number;
  userGrowth: number;
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
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

      <main className="flex-1 bg-gradient-to-br from-destructive/5 via-background to-accent/5">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center mb-2">
                  <Shield className="h-8 w-8 text-destructive mr-3" />
                  <h1 className="text-4xl font-bold">Admin Dashboard</h1>
                </div>
                <p className="text-muted-foreground">
                  Welcome back, <span className="font-semibold text-foreground">Administrator</span>
                </p>
                <Badge variant="destructive" className="mt-2">
                  <Shield className="h-3 w-3 mr-1" />
                  Administrator
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
                  <span>Total Users</span>
                  <Users className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={analytics?.userGrowth && analytics.userGrowth > 0 ? "text-green-600" : "text-muted-foreground"}>
                    {analytics?.userGrowth > 0 ? '+' : ''}{analytics?.userGrowth?.toFixed(1) || 0}%
                  </span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>Total Services</span>
                  <Package className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics?.totalServices || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics?.activeServices || 0} active, {analytics?.pendingServices || 0} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>Pending Reviews</span>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics?.pendingServices || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Services awaiting approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>Platform Volume</span>
                  <TrendingUp className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics?.totalRevenue?.toFixed(2) || 0} SUI</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={analytics?.revenueGrowth && analytics.revenueGrowth > 0 ? "text-green-600" : "text-muted-foreground"}>
                    {analytics?.revenueGrowth > 0 ? '+' : ''}{analytics?.revenueGrowth?.toFixed(1) || 0}%
                  </span> from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Management Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* User Management */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  User Management
                </CardTitle>
                <CardDescription>Manage platform users and roles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full cursor-pointer" variant="outline" asChild>
                  <Link href="/admin/users">View All Users</Link>
                </Button>
                <div className="pt-2 text-sm text-muted-foreground">
                  <div className="flex justify-between py-1">
                    <span>Providers:</span>
                    <span className="font-medium">{analytics?.totalProviders || 0}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Developers:</span>
                    <span className="font-medium">{analytics?.totalDevelopers || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Management */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2 text-purple-600" />
                  Service Moderation
                </CardTitle>
                <CardDescription>Review and approve services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full cursor-pointer" variant="outline" asChild>
                  <Link href="/admin/services">
                    Pending Approvals
                    {analytics?.pendingServices ? (
                      <Badge variant="destructive" className="ml-2">{analytics.pendingServices}</Badge>
                    ) : null}
                  </Link>
                </Button>
                <Button className="w-full cursor-pointer" variant="outline" asChild>
                  <Link href="/services">All Services</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Platform Analytics */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                  Platform Analytics
                </CardTitle>
                <CardDescription>View insights and reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="pt-2 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Last 30 Days:</span>
                    <span className="font-medium">{analytics?.last30DaysRevenue?.toFixed(2) || 0} SUI</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Total Revenue:</span>
                    <span className="font-medium">{analytics?.totalRevenue?.toFixed(2) || 0} SUI</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Platform Overview
              </CardTitle>
              <CardDescription>Key metrics at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">User Distribution</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Providers</span>
                      <span className="font-medium">{analytics?.totalProviders || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Developers</span>
                      <span className="font-medium">{analytics?.totalDevelopers || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Service Status</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active</span>
                      <span className="font-medium text-green-600">{analytics?.activeServices || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pending</span>
                      <span className="font-medium text-orange-600">{analytics?.pendingServices || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Growth Metrics</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">User Growth</span>
                      <span className={`font-medium ${analytics?.userGrowth && analytics.userGrowth > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {analytics?.userGrowth > 0 ? '+' : ''}{analytics?.userGrowth?.toFixed(1) || 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Revenue Growth</span>
                      <span className={`font-medium ${analytics?.revenueGrowth && analytics.revenueGrowth > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {analytics?.revenueGrowth > 0 ? '+' : ''}{analytics?.revenueGrowth?.toFixed(1) || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}