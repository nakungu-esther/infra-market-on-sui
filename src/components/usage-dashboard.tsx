'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity, TrendingUp, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface UsageData {
  entitlementId: number;
  serviceName: string;
  quotaUsed: number;
  quotaLimit: number;
  validUntil: string;
  pricingTier: string;
  recentRequests: number;
}

export function UsageDashboard() {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsageData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token = localStorage.getItem('bearer_token');
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch('/api/usage/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }

      const data = await response.json();
      setUsageData(data);
    } catch (error) {
      console.error('Error fetching usage data:', error);
      toast.error('Failed to load usage data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsageData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchUsageData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (usageData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Subscriptions</h3>
          <p className="text-muted-foreground">
            Subscribe to services to start tracking your usage
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageData.length}</div>
            <p className="text-xs text-muted-foreground">
              {refreshing && 'Updating...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageData.reduce((sum, d) => sum + d.quotaUsed, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Usage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageData.length > 0
                ? Math.round(
                    (usageData.reduce((sum, d) => sum + (d.quotaUsed / d.quotaLimit) * 100, 0) /
                      usageData.length)
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Of quota consumed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Details */}
      <div className="space-y-4">
        {usageData.map((usage) => {
          const usagePercent = (usage.quotaUsed / usage.quotaLimit) * 100;
          const daysRemaining = Math.ceil(
            (new Date(usage.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          return (
            <Card key={usage.entitlementId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{usage.serviceName}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="capitalize">
                          {usage.pricingTier}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {daysRemaining} days remaining
                        </span>
                      </div>
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      usagePercent >= 90
                        ? 'destructive'
                        : usagePercent >= 70
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {usagePercent.toFixed(1)}% used
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Quota Usage</span>
                    <span className="font-medium">
                      {usage.quotaUsed.toLocaleString()} / {usage.quotaLimit.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={usagePercent} className="h-2" />
                  {usagePercent >= 90 && (
                    <p className="text-xs text-destructive">
                      ⚠️ Approaching quota limit. Consider upgrading your plan.
                    </p>
                  )}
                </div>

                {/* Recent Activity */}
                {usage.recentRequests > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    <span>{usage.recentRequests} requests in the last hour</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
