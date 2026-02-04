'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, 
  Key,
  Copy,
  Plus,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

interface ApiKey {
  id: number;
  keyName: string;
  serviceId: number;
  serviceName: string;
  keyValueMasked: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
  isExpired: boolean;
}

interface Entitlement {
  id: number;
  serviceId: number;
  serviceName: string;
  isActive: boolean;
}

export default function ApiKeysPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    serviceId: '',
    entitlementId: '',
    keyName: '',
  });
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login');
    } else if (session?.user) {
      fetchData();
    }
  }, [session, isPending, router]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      if (!token) return;

      const [keysRes, entitlementsRes] = await Promise.all([
        fetch('/api/developer/api-keys', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/entitlements?isActive=true', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (keysRes.ok) {
        const data = await keysRes.json();
        setApiKeys(data.data.apiKeys);
      }

      if (entitlementsRes.ok) {
        const data = await entitlementsRes.json();
        setEntitlements(data.map((e: any) => ({
          id: e.id,
          serviceId: e.serviceId,
          serviceName: e.service?.name || 'Unknown Service',
          isActive: e.isActive,
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newKeyData.serviceId || !newKeyData.entitlementId || !newKeyData.keyName) {
      toast.error('Please fill in all fields');
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/developer/api-keys', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newKeyData),
      });

      if (response.ok) {
        const data = await response.json();
        setNewlyCreatedKey(data.data.apiKey.keyValue);
        toast.success('API key created successfully');
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to create API key');
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setNewlyCreatedKey(null);
    setNewKeyData({ serviceId: '', entitlementId: '', keyName: '' });
  };

  const selectedServiceEntitlements = entitlements.filter(
    e => e.serviceId.toString() === newKeyData.serviceId
  );

  if (isPending || loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
              <p className="text-muted-foreground mt-2">
                Manage your service API keys for authentication
              </p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={handleCloseCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                {newlyCreatedKey ? (
                  <>
                    <DialogHeader>
                      <DialogTitle>API Key Created!</DialogTitle>
                      <DialogDescription>
                        Save this key securely. You won't be able to see it again.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <code className="flex-1 text-sm font-mono break-all">
                          {newlyCreatedKey}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(newlyCreatedKey)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          Make sure to copy your API key now. You won't be able to see it again!
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCloseCreateDialog}>Done</Button>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle>Create New API Key</DialogTitle>
                      <DialogDescription>
                        Generate a new API key for service authentication
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="service">Service</Label>
                        <Select
                          value={newKeyData.serviceId}
                          onValueChange={(value) => setNewKeyData({ ...newKeyData, serviceId: value, entitlementId: '' })}
                        >
                          <SelectTrigger id="service">
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                          <SelectContent>
                            {entitlements.map((e) => (
                              <SelectItem key={e.serviceId} value={e.serviceId.toString()}>
                                {e.serviceName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {newKeyData.serviceId && (
                        <div className="space-y-2">
                          <Label htmlFor="entitlement">Entitlement</Label>
                          <Select
                            value={newKeyData.entitlementId}
                            onValueChange={(value) => setNewKeyData({ ...newKeyData, entitlementId: value })}
                          >
                            <SelectTrigger id="entitlement">
                              <SelectValue placeholder="Select an entitlement" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedServiceEntitlements.map((e) => (
                                <SelectItem key={e.id} value={e.id.toString()}>
                                  {e.serviceName} - Entitlement #{e.id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="keyName">Key Name</Label>
                        <Input
                          id="keyName"
                          placeholder="Production API Key"
                          value={newKeyData.keyName}
                          onChange={(e) => setNewKeyData({ ...newKeyData, keyName: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreate} disabled={creating}>
                        {creating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create Key'
                        )}
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* API Keys List */}
          <Card>
            <CardHeader>
              <CardTitle>Your API Keys</CardTitle>
              <CardDescription>
                Use these keys to authenticate API requests to your services
              </CardDescription>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <div className="text-center py-12">
                  <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No API Keys Yet</p>
                  <p className="text-muted-foreground mt-2 mb-4">
                    Create an API key to start using your services
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{key.keyName}</p>
                          {key.isActive && !key.isExpired ? (
                            <Badge variant="secondary" className="text-xs">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Inactive</Badge>
                          )}
                          {key.isExpired && (
                            <Badge variant="destructive" className="text-xs">Expired</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{key.serviceName}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {key.keyValueMasked}
                          </code>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(key.createdAt).toLocaleDateString()}
                          {key.lastUsedAt && ` • Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
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
