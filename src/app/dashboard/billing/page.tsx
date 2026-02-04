'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, FileText, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface BillingRecord {
  id: number;
  date: string;
  serviceName: string;
  tier: string;
  amount: string;
  status: 'paid' | 'pending' | 'failed' | 'free';
  invoiceUrl?: string;
}

export default function BillingPage() {
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    // Simulate loading - replace with actual API call
    setTimeout(() => {
      setLoading(false);
      // Mock data
      setBillingHistory([]);
      setTotalSpent(0);
    }, 500);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'free':
        return (
          <Badge variant="outline">
            <CheckCircle className="h-3 w-3 mr-1" />
            Free
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleDownloadInvoice = (id: number) => {
    toast.info('Invoice download functionality coming soon');
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
              <h1 className="text-4xl font-bold mb-2">Billing History</h1>
              <p className="text-muted-foreground">
                View all your transaction history and download invoices
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleExportCSV}
              disabled={billingHistory.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Total Spent Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Total Spending</CardTitle>
              <CardDescription>Your cumulative spending on infrastructure services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{totalSpent.toFixed(2)} SUI</div>
              <p className="text-sm text-muted-foreground mt-2">
                {billingHistory.filter(b => b.status === 'paid').length} successful transactions
              </p>
            </CardContent>
          </Card>

          {/* Billing Table */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All your payments and subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {billingHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Billing History</h3>
                  <p className="text-muted-foreground mb-4">
                    Your transaction history will appear here once you make your first purchase
                  </p>
                  <Button asChild variant="outline">
                    <a href="/services">Browse Services</a>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billingHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell>{record.serviceName}</TableCell>
                          <TableCell className="capitalize">{record.tier}</TableCell>
                          <TableCell className="font-bold">
                            {record.amount === '0' ? 'Free' : `${record.amount} SUI`}
                          </TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell className="text-right">
                            {record.status === 'paid' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDownloadInvoice(record.id)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Invoice
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Stats */}
          {billingHistory.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {billingHistory
                      .filter(b => {
                        const date = new Date(b.date);
                        const now = new Date();
                        return date.getMonth() === now.getMonth() && 
                               date.getFullYear() === now.getFullYear();
                      })
                      .reduce((sum, b) => sum + parseFloat(b.amount || '0'), 0)
                      .toFixed(2)} SUI
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Last Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {billingHistory
                      .filter(b => {
                        const date = new Date(b.date);
                        const now = new Date();
                        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
                        return date.getMonth() === lastMonth.getMonth() && 
                               date.getFullYear() === lastMonth.getFullYear();
                      })
                      .reduce((sum, b) => sum + parseFloat(b.amount || '0'), 0)
                      .toFixed(2)} SUI
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average per Transaction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {billingHistory.length > 0
                      ? (totalSpent / billingHistory.filter(b => b.status === 'paid').length).toFixed(2)
                      : '0.00'} SUI
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