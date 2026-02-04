'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle, CheckCircle, XCircle, MessageSquare, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

interface Dispute {
  id: number;
  reporterName: string;
  reporterEmail: string;
  againstProvider: string;
  serviceName: string;
  issue: string;
  amount: string;
  status: 'open' | 'in_progress' | 'resolved';
  filedAt: string;
  evidence?: string[];
  providerResponse?: string;
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
      // Mock data
      setDisputes([]);
    }, 500);
  }, []);

  const openDisputes = disputes.filter(d => d.status === 'open');
  const inProgressDisputes = disputes.filter(d => d.status === 'in_progress');
  const resolvedDisputes = disputes.filter(d => d.status === 'resolved');

  const handleApproveRefund = (disputeId: number) => {
    if (!resolutionNotes.trim()) {
      toast.error('Please provide resolution notes');
      return;
    }
    toast.success('Refund approved - funds will be returned to customer');
    setResolutionNotes('');
    // Refresh data
  };

  const handleDenyDispute = (disputeId: number) => {
    if (!resolutionNotes.trim()) {
      toast.error('Please provide resolution notes');
      return;
    }
    toast.success('Dispute denied - no refund will be issued');
    setResolutionNotes('');
    // Refresh data
  };

  const handleRequestMoreInfo = (disputeId: number) => {
    toast.info('Request sent to both parties for additional information');
    // Refresh data
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Open</Badge>;
      case 'in_progress':
        return <Badge variant="secondary"><MessageSquare className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
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

      <main className="flex-1 bg-gradient-to-br from-destructive/5 via-background to-accent/5">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Disputes & Reports</h1>
            <p className="text-muted-foreground">
              Manage customer disputes and resolve conflicts
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>Open Disputes</span>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{openDisputes.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Require immediate attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>In Progress</span>
                  <MessageSquare className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{inProgressDisputes.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Under investigation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>Resolved</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{resolvedDisputes.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Successfully closed</p>
              </CardContent>
            </Card>
          </div>

          {/* Disputes Tabs */}
          <Tabs defaultValue="open" className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="open">Open ({openDisputes.length})</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress ({inProgressDisputes.length})</TabsTrigger>
              <TabsTrigger value="resolved">Resolved ({resolvedDisputes.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="open" className="mt-6">
              {openDisputes.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Open Disputes</h3>
                    <p className="text-muted-foreground">All disputes have been addressed</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {openDisputes.map((dispute) => (
                    <Card key={dispute.id} className="border-red-200">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-xl">Dispute #{dispute.id}</CardTitle>
                              {getStatusBadge(dispute.status)}
                            </div>
                            <CardDescription>{dispute.issue}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Dispute Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-1">Reporter</p>
                            <p className="font-medium">{dispute.reporterName}</p>
                            <p className="text-xs text-muted-foreground">{dispute.reporterEmail}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Against</p>
                            <p className="font-medium">{dispute.againstProvider}</p>
                            <p className="text-xs text-muted-foreground">{dispute.serviceName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Amount</p>
                            <p className="font-bold text-lg">{dispute.amount} SUI</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Filed</p>
                            <p className="font-medium">{new Date(dispute.filedAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* Evidence Section */}
                        {dispute.evidence && dispute.evidence.length > 0 && (
                          <div className="rounded-lg border p-4 bg-muted/50">
                            <p className="text-sm font-medium mb-2">Evidence Provided:</p>
                            <ul className="text-sm space-y-1">
                              {dispute.evidence.map((item, idx) => (
                                <li key={idx} className="text-muted-foreground">• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Provider Response */}
                        {dispute.providerResponse && (
                          <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-900/20">
                            <p className="text-sm font-medium mb-2">Provider Response:</p>
                            <p className="text-sm text-muted-foreground">{dispute.providerResponse}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="default"
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => setSelectedDispute(dispute)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve Refund
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approve Refund</DialogTitle>
                                <DialogDescription>
                                  Approve refund of {selectedDispute?.amount} SUI to {selectedDispute?.reporterName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <Textarea
                                  placeholder="Resolution notes (will be shared with both parties)..."
                                  value={resolutionNotes}
                                  onChange={(e) => setResolutionNotes(e.target.value)}
                                  rows={4}
                                />
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => selectedDispute && handleApproveRefund(selectedDispute.id)}
                                >
                                  Approve & Issue Refund
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex-1"
                                onClick={() => setSelectedDispute(dispute)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Deny
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Deny Dispute</DialogTitle>
                                <DialogDescription>
                                  Deny dispute and close without refund
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <Textarea
                                  placeholder="Reason for denial (will be shared with reporter)..."
                                  value={resolutionNotes}
                                  onChange={(e) => setResolutionNotes(e.target.value)}
                                  rows={4}
                                />
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="destructive"
                                  onClick={() => selectedDispute && handleDenyDispute(selectedDispute.id)}
                                >
                                  Deny Dispute
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleRequestMoreInfo(dispute.id)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Request More Info
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="in_progress" className="mt-6">
              {inProgressDisputes.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No disputes in progress</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {inProgressDisputes.map((dispute) => (
                    <Card key={dispute.id} className="border-orange-200">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-xl">Dispute #{dispute.id}</CardTitle>
                              {getStatusBadge(dispute.status)}
                            </div>
                            <CardDescription>{dispute.issue}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-muted-foreground mb-1">Reporter</p>
                            <p className="font-medium">{dispute.reporterName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Amount</p>
                            <p className="font-bold">{dispute.amount} SUI</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setSelectedDispute(dispute);
                            }}
                          >
                            Resolve
                          </Button>
                          <Button variant="outline" size="sm">View Details</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="resolved" className="mt-6">
              {resolvedDisputes.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No resolved disputes yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {resolvedDisputes.map((dispute) => (
                    <Card key={dispute.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-xl">Dispute #{dispute.id}</CardTitle>
                              {getStatusBadge(dispute.status)}
                            </div>
                            <CardDescription>{dispute.issue}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-1">Reporter</p>
                            <p className="font-medium">{dispute.reporterName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Amount</p>
                            <p className="font-bold">{dispute.amount} SUI</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Resolved</p>
                            <p className="font-medium">{new Date(dispute.filedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
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