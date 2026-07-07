import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Users, Shield } from 'lucide-react';
import { format } from 'date-fns';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersData, uploadsData, scansData] = await Promise.all([
        pb.collection('users').getFullList({ $autoCancel: false }),
        pb.collection('uploads').getFullList({ $autoCancel: false }),
        pb.collection('scans').getFullList({ $autoCancel: false })
      ]);
      
      setUsers(usersData);
      setUploads(uploadsData);
      setScans(scansData);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const getUserStats = (userId) => {
    const userUploads = uploads.filter(u => u.userId === userId).length;
    const userScans = scans.filter(s => s.userId === userId);
    const totalVulnerabilities = userScans.reduce((sum, scan) => sum + (scan.totalVulnerabilitiesFound || 0), 0);
    
    return { uploads: userUploads, vulnerabilities: totalVulnerabilities };
  };

  const handleRoleToggle = async (userId, currentRole) => {
    setUpdatingRole(userId);
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await pb.collection('users').update(userId, { role: newRole }, { $autoCancel: false });
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('Failed to update user role');
    } finally {
      setUpdatingRole(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>User management - CISA KEV Scanner</title>
        <meta name="description" content="Manage user accounts and permissions" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <Button asChild variant="ghost" size="sm" className="mb-4">
                <Link to="/admin">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to admin dashboard
                </Link>
              </Button>
              <h1 className="text-3xl font-bold mb-2">User management</h1>
              <p className="text-muted-foreground">Manage user accounts and permissions</p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All users</CardTitle>
                    <CardDescription>{users.length} registered users</CardDescription>
                  </div>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : users.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Registration date</TableHead>
                          <TableHead>Uploads</TableHead>
                          <TableHead>Vulnerabilities</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Admin access</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => {
                          const stats = getUserStats(user.id);
                          return (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">
                                {user.name || 'N/A'}
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                {format(new Date(user.created), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell>{stats.uploads}</TableCell>
                              <TableCell className="text-destructive font-medium">
                                {stats.vulnerabilities}
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  user.role === 'admin' 
                                    ? 'bg-primary/10 text-primary' 
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                                  {user.role || 'user'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={user.role === 'admin'}
                                  onCheckedChange={() => handleRoleToggle(user.id, user.role)}
                                  disabled={updatingRole === user.id}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default AdminUsersPage;