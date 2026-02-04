'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { authClient, useSession } from '@/lib/auth-client';
import { toast } from 'sonner';
import { Loader2, LogIn, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending, refetch } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  // Show success message if coming from registration
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      toast.success('Account created successfully! Please log in.');
    }
  }, [searchParams]);

  // Redirect if already logged in with role-based routing
  useEffect(() => {
    if (!isPending && session?.user) {
      const userRole = (session.user as any).role || 'developer';
      const roleRedirects: Record<string, string> = {
        developer: '/dashboard/usage',
        provider: '/provider/dashboard',
        admin: '/admin/dashboard',
      };
      
      const redirect = searchParams.get('redirect') || roleRedirects[userRole] || '/dashboard/usage';
      router.push(redirect);
    }
  }, [session, isPending, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      if (error?.code) {
        toast.error('Invalid email or password. Please make sure you have already registered an account and try again.');
        setIsLoading(false);
        return;
      }

      // Wait a moment for token to be stored, then refetch session
      await new Promise(resolve => setTimeout(resolve, 100));
      const refetchResult = await refetch();

      // Get role from the refetched session data
      const userRole = (refetchResult?.data?.user as any)?.role || 
                       (data?.user as any)?.role || 
                       'developer';

      console.log('User role after login:', userRole);

      const roleRedirects: Record<string, string> = {
        developer: '/dashboard/usage',
        provider: '/provider/dashboard',
        admin: '/admin/dashboard',
      };

      const redirect = searchParams.get('redirect') || roleRedirects[userRole] || '/dashboard/usage';
      
      // Show simple welcome message without role
      toast.success('Login successful! Redirecting to your dashboard...');
      router.push(redirect);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login. Please try again.');
      setIsLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl">Sui Discovery</span>
          </Link>
          <p className="text-muted-foreground text-sm mt-2">
            Welcome back! Login to access your account
          </p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  className="transition-all focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  autoComplete="off"
                  className="transition-all focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, rememberMe: checked as boolean })
                  }
                  disabled={isLoading}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-normal cursor-pointer"
                >
                  Remember me
                </Label>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </>
                )}
              </Button>
              
              <div className="text-center text-sm space-y-2">
                <p className="text-muted-foreground">
                  Don't have an account?{' '}
                  <Link
                    href="/register"
                    className="text-primary hover:text-primary/80 font-semibold underline-offset-4 hover:underline"
                  >
                    Create an account
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  By continuing, you agree to our{' '}
                  <Link href="/terms" className="underline underline-offset-4">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="underline underline-offset-4">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}