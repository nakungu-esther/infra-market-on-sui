'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Users, Search, Mail, BarChart3, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Customer {
  id: number;
  name: string;
  email: string;
  tier: string;
  revenue: number;
  status: 'active' | 'churned' | 'overdue';
  subscriptions: Array<{
    serviceName: string;
    tier: string;
    expiresAt: string;
  }>;
  joinedAt: string;
  lastPayment: string;
}

export default function ProviderCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
      // Mock data
      setCustomers([]);
    }, 500);
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const churnedCustomers = customers.filter(c => c.status === 'churned').length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.revenue, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-600">Active</Badge>;
      case 'churned':
        return <Badge variant="secondary">Churned</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleContact = (email: string) => {
    toast.info(`Contact functionality coming soon for ${email}`);
  };

  const handleAdjustQuota = (customerId: number) => {
    toast.info('Quota adjustment functionality coming soon');
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
            <h1 className="text-4xl font-bold mb-2">Customers</h1>
            <p className="text-muted-foreground">
              Manage your subscribers and customer relationships
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>Total Customers</span>
                  <Users className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{customers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeCustomers} active • {churnedCustomers} churned
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>Active Customers</span>
                  <Users className="h-4 w-4 text-green-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{activeCustomers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {customers.length > 0 ? ((activeCustomers / customers.length) * 100).toFixed(1) : 0}% retention rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>Total Revenue</span>
                  <DollarSign className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalRevenue.toFixed(2)} SUI</div>
                <p className="text-xs text-muted-foreground mt-1">
                  From all customers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Customers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>All your subscribers and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    {customers.length === 0 ? 'No Customers Yet' : 'No Results Found'}
                  </h3>
                  <p className="text-muted-foreground">
                    {customers.length === 0
                      ? 'Customers who subscribe to your services will appear here'
                      : 'Try adjusting your search query'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCustomers.map((customer) => (
                    <Card key={customer.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{customer.name}</h3>
                              {getStatusBadge(customer.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              <Mail className="h-3 w-3 inline mr-1" />
                              {customer.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Joined {new Date(customer.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{customer.revenue.toFixed(2)} SUI</div>
                            <p className="text-xs text-muted-foreground">Total revenue</p>
                          </div>
                        </div>

                        {/* Subscriptions */}
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">Active Subscriptions:</p>
                          <div className="space-y-1">
                            {customer.subscriptions.map((sub, idx) => (
                              <div key={idx} className="text-sm text-muted-foreground flex items-center justify-between">
                                <span>• {sub.serviceName} ({sub.tier})</span>
                                <span className="text-xs">
                                  Expires {new Date(sub.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => setSelectedCustomer(customer)}
                              >
                                <BarChart3 className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Customer Details</DialogTitle>
                                <DialogDescription>
                                  Complete information for {selectedCustomer?.name}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedCustomer && (
                                <div className="space-y-4 pt-4">
                                  <div>
                                    <p className="text-sm font-medium mb-1">Contact Information</p>
                                    <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium mb-1">Status</p>
                                    {getStatusBadge(selectedCustomer.status)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium mb-1">Total Revenue</p>
                                    <p className="text-2xl font-bold">{selectedCustomer.revenue.toFixed(2)} SUI</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium mb-2">Subscriptions</p>
                                    <div className="space-y-2">
                                      {selectedCustomer.subscriptions.map((sub, idx) => (
                                        <div key={idx} className="p-3 border rounded-lg">
                                          <p className="font-medium">{sub.serviceName}</p>
                                          <p className="text-sm text-muted-foreground capitalize">{sub.tier} tier</p>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Expires: {new Date(sub.expiresAt).toLocaleDateString()}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleAdjustQuota(customer.id)}
                          >
                            Adjust Quota
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleContact(customer.email)}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Contact
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}