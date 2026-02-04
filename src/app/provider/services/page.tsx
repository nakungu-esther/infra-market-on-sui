'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit, Trash2, Eye, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useMyServices } from '@/hooks/useServices';
import { servicesApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ProviderServicesPage() {
  const router = useRouter();
  const { services, isLoading, error, refetch } = useMyServices();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await servicesApi.delete(deleteId);
      if (response.success) {
        toast.success('Service deleted successfully');
        refetch();
      } else {
        toast.error(response.error || 'Failed to delete service');
      }
    } catch (error) {
      toast.error('An error occurred while deleting');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const response = await servicesApi.updateStatus(id, status);
      if (response.success) {
        toast.success(`Service status updated to ${status}`);
        refetch();
      } else {
        toast.error(response.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error('An error occurred while updating status');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-8 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold">My Services</h1>
              <p className="text-muted-foreground mt-2">
                Manage your infrastructure service listings
              </p>
            </div>
            <Button asChild className="cursor-pointer">
              <Link href="/provider/services/new">
                <Plus className="h-4 w-4 mr-2" />
                Add New Service
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {services.filter((s) => s.status === 'active').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {services.filter((s) => s.status === 'pending').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Suspended
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {services.filter((s) => s.status === 'suspended').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Services List */}
          {error && (
            <Card className="mb-4 border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {services.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Plus className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No services yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by creating your first infrastructure service listing
                </p>
                <Button asChild className="cursor-pointer">
                  <Link href="/provider/services/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Service
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">{service.name}</CardTitle>
                          <Badge
                            variant={
                              service.status === 'active'
                                ? 'default'
                                : service.status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {service.status}
                          </Badge>
                          {service.tags && service.tags.length > 0 && (
                            <>
                              {service.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag.id} variant="outline" className="text-xs">
                                  {tag.tag}
                                </Badge>
                              ))}
                            </>
                          )}
                        </div>
                        <CardDescription>{service.description || 'No description'}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="cursor-pointer">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/services/${service.id}`} className="cursor-pointer">
                              <Eye className="h-4 w-4 mr-2" />
                              View Public Page
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/provider/services/${service.id}/edit`} className="cursor-pointer">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Service
                            </Link>
                          </DropdownMenuItem>
                          {service.status === 'active' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(service.id, 'archived')}
                              className="cursor-pointer"
                            >
                              Archive
                            </DropdownMenuItem>
                          )}
                          {service.status === 'archived' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(service.id, 'active')}
                              className="cursor-pointer"
                            >
                              Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => setDeleteId(service.id)}
                            className="text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Type</p>
                        <p className="font-medium">{service.serviceType}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Accepting Users</p>
                        <p className="font-medium">{service.isAcceptingUsers ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Created</p>
                        <p className="font-medium">
                          {new Date(service.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Last Updated</p>
                        <p className="font-medium">
                          {new Date(service.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your service listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}