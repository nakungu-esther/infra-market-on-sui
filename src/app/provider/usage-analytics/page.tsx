'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Activity, TrendingUp, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CustomerUsage {
  customerId: number;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  pricingTier: string;
  quotaUsed: number;
  quotaLimit: number;
  lastRequest: string;
  totalRequests: number;
}

export default function ProviderUsageAnalyticsPage() {
  const [usageData, setUsageData] = useState<CustomerUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalRequests: 0,
    avgUsagePercent: 0,
    activeToday: 0,
  });

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('bearer_token');
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch('/api/provider/customers', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }

      const data = await response.json();
      setUsageData(data);

      // Calculate stats
      const totalCustomers = data.length;
      const totalRequests = data.reduce((sum: number, c: CustomerUsage) => sum + c.totalRequests, 0);
      const avgUsagePercent =
        totalCustomers > 0
          ? data.reduce((sum: number, c: CustomerUsage) => sum + (c.quotaUsed / c.quotaLimit) * 100, 0) /
            totalCustomers
          : 0;
      const activeToday = data.filter((c: CustomerUsage) => {
        const lastReq = new Date(c.lastRequest);
        const today = new Date();
        return lastReq.toDateString() === today.toDateString();
      }).length;

      setStats({
        totalCustomers,
        totalRequests,
        avgUsagePercent: Math.round(avgUsagePercent),
        activeToday,
      });
    } catch (error) {
      console.error('Error fetching usage data:', error);
      toast.error('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
  }, []);

  const exportCSV = () => {
    const headers = [
      'Customer Name',
      'Email',
      'Service',
      'Tier',
      'Quota Used',
      'Quota Limit',
      'Usage %',
      'Last Request',
      'Total Requests',
    ].join(',');

    const rows = usageData.map((row) =>
      [
        row.customerName,
        row.customerEmail,
        row.serviceName,
        row.pricingTier,
        row.quotaUsed,
        row.quotaLimit,
        ((row.quotaUsed / row.quotaLimit) * 100).toFixed(2),
        row.lastRequest,
        row.totalRequests,
      ].join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customer-usage-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('CSV exported successfully');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold">Usage Analytics</h1>
              <p className="text-muted-foreground mt-2">
                Monitor customer usage and API consumption
              </p>
            </div>
            <Button onClick={exportCSV} disabled={loading || usageData.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Usage</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.avgUsagePercent}%</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Today</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeToday}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Usage Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Usage Details</CardTitle>
                  <CardDescription>
                    Real-time usage data for all your customers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {usageData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No customer usage data available
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead className="text-right">Usage</TableHead>
                          <TableHead className="text-right">Requests</TableHead>
                          <TableHead>Last Request</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usageData.map((customer, idx) => {
                          const usagePercent = (customer.quotaUsed / customer.quotaLimit) * 100;
                          return (
                            <TableRow key={idx}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{customer.customerName}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {customer.customerEmail}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{customer.serviceName}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="capitalize">
                                  {customer.pricingTier}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="text-sm">
                                  {customer.quotaUsed.toLocaleString()} /{' '}
                                  {customer.quotaLimit.toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {usagePercent.toFixed(1)}%
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {customer.totalRequests.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {new Date(customer.lastRequest).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(customer.lastRequest).toLocaleTimeString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    usagePercent >= 90
                                      ? 'destructive'
                                      : usagePercent >= 70
                                      ? 'default'
                                      : 'secondary'
                                  }
                                >
                                  {usagePercent >= 90
                                    ? 'Critical'
                                    : usagePercent >= 70
                                    ? 'Warning'
                                    : 'Healthy'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
