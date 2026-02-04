'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Users, Search, Mail, Shield, Ban, UserCog } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

interface User {
  id: number;
  name: string;
  email: string;
  role: 'developer' | 'provider' | 'admin';
  status: 'active' | 'banned';
  createdAt: string;
  totalSpent?: number;
  servicesCount?: number;
  revenue?: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
      // Mock data
      setUsers([]);
    }, 500);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const developers = users.filter(u => u.role === 'developer').length;
  const providers = users.filter(u => u.role === 'provider').length;
  const admins = users.filter(u => u.role === 'admin').length;
  const bannedUsers = users.filter(u => u.status === 'banned').length;

  const handleChangeRole = (userId: number, newRole: string) => {
    toast.success(`User role updated to ${newRole}`);
    // Refresh data
  };

  const handleBanUser = (userId: number) => {
    toast.success('User banned successfully');
    // Refresh data
  };

  const handleUnbanUser = (userId: number) => {
    toast.success('User unbanned successfully');
    // Refresh data
  };

  const handleContactUser = (email: string) => {
    toast.info(`Contact functionality coming soon for ${email}`);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'developer':
        return <Badge variant="default">Developer</Badge>;
      case 'provider':
        return <Badge variant="secondary">Provider</Badge>;
      case 'admin':
        return <Badge variant="destructive"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge variant="default" className="bg-green-600">Active</Badge>
    ) : (
      <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" />Banned</Badge>
    );
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
            <h1 className="text-4xl font-bold mb-2">User Management</h1>
            <p className="text-muted-foreground">
              Manage platform users, roles, and permissions
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Developers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{developers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Providers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{providers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Banned Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{bannedUsers}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="developer">Developers</SelectItem>
                <SelectItem value="provider">Providers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Platform user accounts and their details</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    {users.length === 0 ? 'No Users Found' : 'No Results'}
                  </h3>
                  <p className="text-muted-foreground">
                    {users.length === 0
                      ? 'Users will appear here as they register'
                      : 'Try adjusting your search or filters'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-sm">{user.email}</TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setSelectedUser(user)}
                                  >
                                    View
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>User Details</DialogTitle>
                                    <DialogDescription>
                                      Complete information for {selectedUser?.name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  {selectedUser && (
                                    <div className="space-y-4 pt-4">
                                      <div>
                                        <p className="text-sm font-medium mb-1">Name</p>
                                        <p className="text-sm text-muted-foreground">{selectedUser.name}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium mb-1">Email</p>
                                        <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium mb-1">Role</p>
                                        {getRoleBadge(selectedUser.role)}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium mb-1">Status</p>
                                        {getStatusBadge(selectedUser.status)}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium mb-1">Joined</p>
                                        <p className="text-sm text-muted-foreground">
                                          {new Date(selectedUser.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                      {selectedUser.role === 'developer' && selectedUser.totalSpent && (
                                        <div>
                                          <p className="text-sm font-medium mb-1">Total Spent</p>
                                          <p className="text-2xl font-bold">{selectedUser.totalSpent} SUI</p>
                                        </div>
                                      )}
                                      {selectedUser.role === 'provider' && (
                                        <>
                                          <div>
                                            <p className="text-sm font-medium mb-1">Listed Services</p>
                                            <p className="text-2xl font-bold">{selectedUser.servicesCount || 0}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium mb-1">Total Revenue</p>
                                            <p className="text-2xl font-bold">{selectedUser.revenue || 0} SUI</p>
                                          </div>
                                        </>
                                      )}
                                      <div className="flex gap-2 pt-4">
                                        <Select 
                                          defaultValue={selectedUser.role}
                                          onValueChange={(value) => handleChangeRole(selectedUser.id, value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="developer">Developer</SelectItem>
                                            <SelectItem value="provider">Provider</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleContactUser(selectedUser.email)}
                                        >
                                          <Mail className="h-4 w-4 mr-1" />
                                          Contact
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>

                              <Select 
                                defaultValue={user.role}
                                onValueChange={(value) => handleChangeRole(user.id, value)}
                              >
                                <SelectTrigger className="w-[130px] h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="developer">Developer</SelectItem>
                                  <SelectItem value="provider">Provider</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>

                              {user.status === 'active' ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <Ban className="h-4 w-4 mr-1" />
                                      Ban
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Ban User</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to ban {user.name}? They will lose access to the platform.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleBanUser(user.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Ban User
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : (
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleUnbanUser(user.id)}
                                >
                                  Unban
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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