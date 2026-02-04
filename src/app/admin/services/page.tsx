'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Package, Search, CheckCircle, XCircle, AlertTriangle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

interface Service {
  id: number;
  name: string;
  description: string;
  serviceType: string;
  providerName: string;
  providerEmail: string;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  createdAt: string;
  submittedAt: string;
  isVerified: boolean;
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
      // Mock data
      setServices([]);
    }, 500);
  }, []);

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.providerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingServices = services.filter(s => s.status === 'pending');
  const activeServices = services.filter(s => s.status === 'active');
  const suspendedServices = services.filter(s => s.status === 'suspended');
  const rejectedServices = services.filter(s => s.status === 'rejected');

  const handleApprove = (serviceId: number) => {
    toast.success('Service approved successfully');
    // Refresh data
  };

  const handleReject = (serviceId: number) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    toast.success('Service rejected');
    setRejectionReason('');
    // Refresh data
  };

  const handleSuspend = (serviceId: number) => {
    toast.success('Service suspended');
    // Refresh data
  };

  const handleVerify = (serviceId: number) => {
    toast.success('Service verified - badge granted');
    // Refresh data
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-orange-600"><AlertTriangle className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Suspended</Badge>;
      case 'rejected':
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
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
            <h1 className="text-4xl font-bold mb-2">Service Moderation</h1>
            <p className="text-muted-foreground">
              Review and manage service listings on the platform
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{pendingServices.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{activeServices.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Suspended
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{suspendedServices.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{services.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search services or providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Services Tabs */}
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-4">
              <TabsTrigger value="pending">Pending ({pendingServices.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeServices.length})</TabsTrigger>
              <TabsTrigger value="suspended">Suspended ({suspendedServices.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejectedServices.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              {pendingServices.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Pending Services</h3>
                    <p className="text-muted-foreground">
                      All services have been reviewed
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingServices.map((service) => (
                    <Card key={service.id} className="border-orange-200">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-xl">{service.name}</CardTitle>
                              {getStatusBadge(service.status)}
                            </div>
                            <CardDescription>{service.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-1">Provider</p>
                            <p className="font-medium">{service.providerName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Email</p>
                            <p className="font-medium text-xs">{service.providerEmail}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Type</p>
                            <p className="font-medium">{service.serviceType}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Submitted</p>
                            <p className="font-medium">
                              {new Date(service.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(service.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex-1"
                                onClick={() => setSelectedService(service)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reject Service</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Provide a reason for rejecting {selectedService?.name}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <Textarea
                                placeholder="Reason for rejection (will be sent to provider)..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                              />
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setRejectionReason('')}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => selectedService && handleReject(selectedService.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Reject Service
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={`/services/${service.id}`}>View Details</a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="mt-6">
              {activeServices.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No active services</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {activeServices.map((service) => (
                    <Card key={service.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-xl">{service.name}</CardTitle>
                              {getStatusBadge(service.status)}
                              {service.isVerified && (
                                <Badge variant="default" className="bg-blue-600">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <CardDescription>{service.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-muted-foreground mb-1">Provider</p>
                            <p className="font-medium">{service.providerName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Type</p>
                            <p className="font-medium">{service.serviceType}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Active Since</p>
                            <p className="font-medium">
                              {new Date(service.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {!service.isVerified && (
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleVerify(service.id)}
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Grant Verification
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleSuspend(service.id)}
                          >
                            Suspend
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/services/${service.id}`}>View Public Page</a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="suspended" className="mt-6">
              {suspendedServices.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No suspended services</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {suspendedServices.map((service) => (
                    <Card key={service.id} className="border-red-200">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-xl">{service.name}</CardTitle>
                              {getStatusBadge(service.status)}
                            </div>
                            <CardDescription>{service.providerName}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(service.id)}
                          >
                            Reactivate
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/services/${service.id}`}>View Details</a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              {rejectedServices.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No rejected services</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {rejectedServices.map((service) => (
                    <Card key={service.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-xl">{service.name}</CardTitle>
                              {getStatusBadge(service.status)}
                            </div>
                            <CardDescription>{service.providerName}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Rejected on {new Date(service.submittedAt).toLocaleDateString()}
                        </p>
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