'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useSession } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Mail, Calendar, Shield, Briefcase, Code, Settings, Camera, Upload } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login?redirect=/profile');
    } else if (!isPending) {
      setIsLoading(false);
      // Load avatar from localStorage
      const savedAvatar = localStorage.getItem(`avatar_${session?.user?.id}`);
      if (savedAvatar) {
        setAvatarUrl(savedAvatar);
      }
    }
  }, [session, isPending, router]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarUrl(base64String);
        // Save to localStorage
        localStorage.setItem(`avatar_${session?.user?.id}`, base64String);
        toast.success('Profile picture updated successfully!');
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast.error('Failed to upload image');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload image');
      setIsUploading(false);
    }
  };

  if (isPending || isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user as any;
  const userRole = user.role || 'developer';

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'provider':
        return 'default';
      case 'developer':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'provider':
        return <Briefcase className="h-4 w-4" />;
      case 'developer':
        return <Code className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Platform administrator with full access to moderate services, manage users, and oversee platform operations.';
      case 'provider':
        return 'Service provider who can list infrastructure services, manage pricing, and track revenue.';
      case 'developer':
        return 'Developer who can browse services, make purchases, and integrate infrastructure into applications.';
      default:
        return 'Platform user';
    }
  };

  const getRoleCapabilities = (role: string) => {
    switch (role) {
      case 'admin':
        return [
          'Moderate and approve service listings',
          'Manage platform users and roles',
          'Add verification badges to services',
          'View platform-wide analytics',
          'Resolve disputes between users',
          'Configure platform settings',
        ];
      case 'provider':
        return [
          'Create and manage service listings',
          'Set up pricing tiers and plans',
          'Track revenue and subscriptions',
          'Monitor service usage statistics',
          'Manage customer relationships',
          'Configure API keys and webhooks',
        ];
      case 'developer':
        return [
          'Browse and discover services',
          'Purchase service subscriptions',
          'Monitor usage and quotas',
          'Integrate services via APIs',
          'Rate and review services',
          'Manage payment methods',
        ];
      default:
        return [];
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account information and view your role details
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Left Column - Profile Card */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-4 relative">
                    <div className="relative group">
                      <Avatar className="h-24 w-24">
                        {avatarUrl && <AvatarImage src={avatarUrl} alt={user.name} />}
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-2xl">
                          {getUserInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        onClick={handleAvatarClick}
                        disabled={isUploading}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                      >
                        {isUploading ? (
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        ) : (
                          <Camera className="h-6 w-6 text-white" />
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAvatarClick}
                    disabled={isUploading}
                    className="mb-2"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Upload Photo'}
                  </Button>
                  <CardTitle className="text-2xl">{user.name}</CardTitle>
                  <CardDescription className="flex items-center justify-center gap-2 mt-2">
                    {getRoleIcon(userRole)}
                    <Badge variant={getRoleBadgeVariant(userRole)}>
                      {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="break-all">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {formatDate(user.createdAt)}</span>
                  </div>
                  <Button asChild className="w-full cursor-pointer" variant="outline">
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Role Information */}
            <div className="md:col-span-2 space-y-6">
              {/* Role Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getRoleIcon(userRole)}
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Role
                  </CardTitle>
                  <CardDescription>
                    Your role determines what you can do on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {getRoleDescription(userRole)}
                  </p>
                </CardContent>
              </Card>

              {/* Capabilities */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Capabilities</CardTitle>
                  <CardDescription>
                    What you can do with your {userRole} account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {getRoleCapabilities(userRole).map((capability, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <span className="text-sm">{capability}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks for your role
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {userRole === 'admin' && (
                      <>
                        <Button asChild variant="outline" className="cursor-pointer">
                          <Link href="/admin/dashboard">
                            <Shield className="mr-2 h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="cursor-pointer">
                          <Link href="/services">
                            <Code className="mr-2 h-4 w-4" />
                            Moderate Services
                          </Link>
                        </Button>
                      </>
                    )}
                    {userRole === 'provider' && (
                      <>
                        <Button asChild variant="outline" className="cursor-pointer">
                          <Link href="/provider/dashboard">
                            <Briefcase className="mr-2 h-4 w-4" />
                            Provider Dashboard
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="cursor-pointer">
                          <Link href="/services">
                            <Code className="mr-2 h-4 w-4" />
                            View Services
                          </Link>
                        </Button>
                      </>
                    )}
                    {userRole === 'developer' && (
                      <>
                        <Button asChild variant="outline" className="cursor-pointer">
                          <Link href="/services">
                            <Code className="mr-2 h-4 w-4" />
                            Browse Services
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="cursor-pointer">
                          <Link href="/services">
                            <Briefcase className="mr-2 h-4 w-4" />
                            My Subscriptions
                          </Link>
                        </Button>
                      </>
                    )}
                    <Button asChild variant="outline" className="cursor-pointer">
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Account Settings
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}