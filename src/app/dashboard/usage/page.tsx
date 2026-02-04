"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  BarChart3,
  Zap,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface Entitlement {
  id: number;
  serviceId: number;
  pricingTier: string;
  quotaLimit: number;
  quotaUsed: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  service: {
    id: number;
    name: string;
    serviceType: string;
  };
}

interface UsageStats {
  totalRequests: number;
  uniqueServices: number;
  uniqueEndpoints: number;
  requestsByService: Array<{ serviceId: number; serviceName: string; requestCount: number }>;
  requestsByEndpoint: Array<{ endpoint: string; requestCount: number }>;
  requestsByDay: Array<{ date: string; requestCount: number }>;
  averageRequestsPerDay: number;
}

export default function UsageDashboardPage() {
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  const handleManualRefresh = () => {
    setLastRefresh(new Date());
    toast.success("Usage data refreshed", { duration: 2000 });
  };

  const getQuotaStatus = (quotaUsed: number, quotaLimit: number) => {
    const percentage = (quotaUsed / quotaLimit) * 100;
    if (percentage >= 90) return { color: "text-red-600", label: "Critical", variant: "destructive" as const };
    if (percentage >= 70) return { color: "text-yellow-600", label: "Warning", variant: "default" as const };
    return { color: "text-green-600", label: "Healthy", variant: "secondary" as const };
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header with Auto-Refresh Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Usage Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Monitor your API usage and quotas across all services
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <Label htmlFor="auto-refresh" className="text-sm">
                  Auto-refresh
                </Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalRequests?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Services</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{entitlements.length}</div>
                <p className="text-xs text-muted-foreground">With active entitlements</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Daily Usage</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.averageRequestsPerDay?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">Requests per day</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Endpoints</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.uniqueEndpoints || 0}</div>
                <p className="text-xs text-muted-foreground">Accessed endpoints</p>
              </CardContent>
            </Card>
          </div>

          {/* Entitlements & Quotas */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Service Quotas</h2>
            {entitlements.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No Active Subscriptions</p>
                  <p className="text-muted-foreground mt-2">
                    Subscribe to services to start tracking usage
                  </p>
                  <Button className="mt-4" asChild>
                    <a href="/services">Browse Services</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {entitlements.map((entitlement) => {
                  const percentage = (entitlement.quotaUsed / entitlement.quotaLimit) * 100;
                  const status = getQuotaStatus(entitlement.quotaUsed, entitlement.quotaLimit);
                  const daysRemaining = Math.ceil(
                    (new Date(entitlement.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <Card key={entitlement.id} className="relative">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{entitlement.service.name}</CardTitle>
                            <CardDescription className="capitalize mt-1">
                              {entitlement.pricingTier} Plan
                            </CardDescription>
                          </div>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Quota Progress */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Quota Used</span>
                            <span className="font-medium">
                              {entitlement.quotaUsed.toLocaleString()} / {entitlement.quotaLimit.toLocaleString()}
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {Math.round(percentage)}% used • {(entitlement.quotaLimit - entitlement.quotaUsed).toLocaleString()} remaining
                          </p>
                        </div>

                        {/* Validity */}
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {daysRemaining > 0 ? `${daysRemaining} days remaining` : "Expired"}
                          </span>
                        </div>

                        {/* Warnings */}
                        {percentage >= 90 && (
                          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 p-3">
                            <div className="flex items-center gap-2 text-sm text-red-800 dark:text-red-200">
                              <AlertCircle className="h-4 w-4" />
                              Quota almost exhausted - consider upgrading
                            </div>
                          </div>
                        )}
                        {daysRemaining <= 7 && daysRemaining > 0 && (
                          <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 p-3">
                            <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                              <AlertCircle className="h-4 w-4" />
                              Subscription expiring soon
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          asChild
                        >
                          <a href={`/services/${entitlement.serviceId}`}>View Service Details</a>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Services */}
          {stats && stats.requestsByService.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Usage by Service</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {stats.requestsByService.slice(0, 5).map((service, idx) => {
                      const maxRequests = Math.max(...stats.requestsByService.map(s => s.requestCount));
                      const percentage = (service.requestCount / maxRequests) * 100;
                      
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{service.serviceName}</span>
                            <span className="text-muted-foreground">
                              {service.requestCount.toLocaleString()} requests
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top Endpoints */}
          {stats && stats.requestsByEndpoint.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Most Used Endpoints</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {stats.requestsByEndpoint.map((endpoint, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {endpoint.endpoint}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {endpoint.requestCount.toLocaleString()}
                          </span>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Daily Usage Trend */}
          {stats && stats.requestsByDay.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Usage Trend (Last 7 Days)</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {stats.requestsByDay.slice(-7).map((day, idx) => {
                      const maxRequests = Math.max(...stats.requestsByDay.map(d => d.requestCount));
                      const percentage = (day.requestCount / maxRequests) * 100;
                      const date = new Date(day.date);
                      
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">
                              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-muted-foreground">
                              {day.requestCount.toLocaleString()} requests
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
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

function getQuotaStatus(quotaUsed: number, quotaLimit: number) {
  const percentage = (quotaUsed / quotaLimit) * 100;
  if (percentage >= 90) return { color: "text-red-600", label: "Critical", variant: "destructive" as const };
  if (percentage >= 70) return { color: "text-yellow-600", label: "Warning", variant: "default" as const };
  return { color: "text-green-600", label: "Healthy", variant: "secondary" as const };
}