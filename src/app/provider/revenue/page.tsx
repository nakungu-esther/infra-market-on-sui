'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, TrendingUp, Download, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  revenueByService: Array<{
    serviceName: string;
    revenue: number;
    percentage: number;
  }>;
  revenueByTier: {
    free: { users: number; revenue: number };
    basic: { users: number; revenue: number };
    pro: { users: number; revenue: number };
    enterprise: { users: number; revenue: number };
  };
  monthlyBreakdown: Array<{
    month: string;
    revenue: number;
  }>;
}

export default function ProviderRevenuePage() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
      // Mock data
      setRevenueData({
        totalRevenue: 0,
        monthlyRevenue: 0,
        revenueGrowth: 0,
        revenueByService: [],
        revenueByTier: {
          free: { users: 0, revenue: 0 },
          basic: { users: 0, revenue: 0 },
          pro: { users: 0, revenue: 0 },
          enterprise: { users: 0, revenue: 0 },
        },
        monthlyBreakdown: [],
      });
    }, 500);
  }, []);

  const handleDownloadReport = () => {
    toast.info('Report download functionality coming soon');
  };

  const handleExportCSV = () => {
    toast.info('CSV export functionality coming soon');
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Revenue Analytics</h1>
              <p className="text-muted-foreground">
                Track your earnings and financial performance
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadReport}>
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>Total Revenue</span>
                  <DollarSign className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{revenueData?.totalRevenue.toFixed(2) || 0} SUI</div>
                <p className="text-xs text-muted-foreground mt-1">All-time earnings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>This Month</span>
                  <BarChart3 className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{revenueData?.monthlyRevenue.toFixed(2) || 0} SUI</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current month revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>Growth Rate</span>
                  <TrendingUp className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${revenueData && revenueData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {revenueData?.revenueGrowth >= 0 ? '+' : ''}{revenueData?.revenueGrowth.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From last month
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue by Service */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Service</CardTitle>
                <CardDescription>Earnings breakdown per service</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueData?.revenueByService && revenueData.revenueByService.length > 0 ? (
                  <div className="space-y-4">
                    {revenueData.revenueByService.map((service, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{service.serviceName}</span>
                          <span className="font-bold">{service.revenue.toFixed(2)} SUI</span>
                        </div>
                        <Progress value={service.percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground">{service.percentage.toFixed(1)}% of total revenue</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No revenue data yet</p>
                    <p className="text-sm mt-2">Start earning when customers subscribe to your services</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue by Tier */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Tier</CardTitle>
                <CardDescription>Earnings distribution across pricing tiers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <div>
                    <p className="text-sm font-medium">Free Tier</p>
                    <p className="text-xs text-muted-foreground">{revenueData?.revenueByTier.free.users || 0} users</p>
                  </div>
                  <span className="font-bold">{revenueData?.revenueByTier.free.revenue.toFixed(2) || 0} SUI</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <div>
                    <p className="text-sm font-medium">Basic Tier</p>
                    <p className="text-xs text-muted-foreground">{revenueData?.revenueByTier.basic.users || 0} users</p>
                  </div>
                  <span className="font-bold">{revenueData?.revenueByTier.basic.revenue.toFixed(2) || 0} SUI</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <div>
                    <p className="text-sm font-medium">Pro Tier</p>
                    <p className="text-xs text-muted-foreground">{revenueData?.revenueByTier.pro.users || 0} users</p>
                  </div>
                  <span className="font-bold">{revenueData?.revenueByTier.pro.revenue.toFixed(2) || 0} SUI</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Enterprise Tier</p>
                    <p className="text-xs text-muted-foreground">{revenueData?.revenueByTier.enterprise.users || 0} users</p>
                  </div>
                  <span className="font-bold">{revenueData?.revenueByTier.enterprise.revenue.toFixed(2) || 0} SUI</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Month (Last 6 Months)</CardTitle>
              <CardDescription>Monthly revenue trends</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueData?.monthlyBreakdown && revenueData.monthlyBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {revenueData.monthlyBreakdown.slice(-6).map((month, idx) => {
                    const maxRevenue = Math.max(...revenueData.monthlyBreakdown.map(m => m.revenue));
                    const percentage = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
                    
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{month.month}</span>
                          <span className="font-bold">{month.revenue.toFixed(2)} SUI</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No historical data available</p>
                  <p className="text-sm mt-2">Monthly revenue will be tracked here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Metrics */}
          {revenueData && revenueData.totalRevenue > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    MRR (Monthly Recurring Revenue)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{revenueData.monthlyRevenue.toFixed(2)} SUI</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    ARPU (Avg Revenue Per User)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(
                      revenueData.totalRevenue /
                      (revenueData.revenueByTier.basic.users +
                        revenueData.revenueByTier.pro.users +
                        revenueData.revenueByTier.enterprise.users || 1)
                    ).toFixed(2)} SUI
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Paying Customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {revenueData.revenueByTier.basic.users +
                      revenueData.revenueByTier.pro.users +
                      revenueData.revenueByTier.enterprise.users}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Free Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{revenueData.revenueByTier.free.users}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}