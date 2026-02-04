'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    endpoint: '',
    documentation: '',
    pricingFree: '0',
    pricingBasic: '',
    pricingPro: '',
    pricingEnterprise: '',
    quotaFree: '',
    quotaBasic: '',
    quotaPro: '',
    quotaEnterprise: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate form
    if (!formData.name || !formData.description || !formData.category) {
      toast.error('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      toast.success('Service created successfully!');
      router.push('/provider/services');
    }, 1000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => router.push('/provider/services')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Services
            </Button>

            <div className="flex items-center mb-2">
              <Plus className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-4xl font-bold">Add New Service</h1>
            </div>
            <p className="text-muted-foreground">
              List your infrastructure service on the marketplace
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Core details about your service</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Service Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., High-Performance RPC Node"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what your service offers..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rpc">RPC Nodes</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                      <SelectItem value="compute">Compute</SelectItem>
                      <SelectItem value="oracle">Oracle Services</SelectItem>
                      <SelectItem value="indexer">Indexers</SelectItem>
                      <SelectItem value="api">APIs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endpoint">API Endpoint</Label>
                  <Input
                    id="endpoint"
                    placeholder="https://api.yourservice.com"
                    value={formData.endpoint}
                    onChange={(e) => handleInputChange('endpoint', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentation">Documentation URL</Label>
                  <Input
                    id="documentation"
                    placeholder="https://docs.yourservice.com"
                    value={formData.documentation}
                    onChange={(e) => handleInputChange('documentation', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Pricing Tiers</CardTitle>
                <CardDescription>Set pricing for each tier (in SUI tokens)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pricingFree">Free Tier</Label>
                    <Input
                      id="pricingFree"
                      type="number"
                      placeholder="0"
                      value={formData.pricingFree}
                      onChange={(e) => handleInputChange('pricingFree', e.target.value)}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pricingBasic">Basic Tier</Label>
                    <Input
                      id="pricingBasic"
                      type="number"
                      placeholder="10"
                      value={formData.pricingBasic}
                      onChange={(e) => handleInputChange('pricingBasic', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pricingPro">Pro Tier</Label>
                    <Input
                      id="pricingPro"
                      type="number"
                      placeholder="50"
                      value={formData.pricingPro}
                      onChange={(e) => handleInputChange('pricingPro', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pricingEnterprise">Enterprise Tier</Label>
                    <Input
                      id="pricingEnterprise"
                      type="number"
                      placeholder="200"
                      value={formData.pricingEnterprise}
                      onChange={(e) => handleInputChange('pricingEnterprise', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Usage Quotas</CardTitle>
                <CardDescription>Set monthly API call limits for each tier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quotaFree">Free Tier Quota</Label>
                    <Input
                      id="quotaFree"
                      type="number"
                      placeholder="1000"
                      value={formData.quotaFree}
                      onChange={(e) => handleInputChange('quotaFree', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quotaBasic">Basic Tier Quota</Label>
                    <Input
                      id="quotaBasic"
                      type="number"
                      placeholder="10000"
                      value={formData.quotaBasic}
                      onChange={(e) => handleInputChange('quotaBasic', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quotaPro">Pro Tier Quota</Label>
                    <Input
                      id="quotaPro"
                      type="number"
                      placeholder="100000"
                      value={formData.quotaPro}
                      onChange={(e) => handleInputChange('quotaPro', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quotaEnterprise">Enterprise Tier Quota</Label>
                    <Input
                      id="quotaEnterprise"
                      type="number"
                      placeholder="unlimited"
                      value={formData.quotaEnterprise}
                      onChange={(e) => handleInputChange('quotaEnterprise', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/provider/services')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Service
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
