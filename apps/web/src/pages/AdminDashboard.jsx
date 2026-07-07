import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Upload, AlertTriangle, Clock, FileText, Settings } from 'lucide-react';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalUploads: 0,
    totalVulnerableLibraries: 0,
    lastSyncTime: null,
    nextSyncTime: null
  });
  const [syncLogs, setSyncLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, uploads, scans, logs] = await Promise.all([
          pb.collection('users').getFullList({ $autoCancel: false }),
          pb.collection('uploads').getFullList({ $autoCancel: false }),
          pb.collection('scans').getFullList({ $autoCancel: false }),
          pb.collection('sync_logs').getList(1, 5, { sort: '-created', $autoCancel: false })
        ]);

        const vulnerableLibrariesSet = new Set();
        scans.forEach(scan => {
          if (scan.vulnerableLibraries && Array.isArray(scan.vulnerableLibraries)) {
            scan.vulnerableLibraries.forEach(lib => {
              vulnerableLibrariesSet.add(`${lib.library}@${lib.version}`);
            });
          }
        });

        const lastLog = logs.items[0];

        setStats({
          totalUsers: users.length,
          totalUploads: uploads.length,
          totalVulnerableLibraries: vulnerableLibrariesSet.size,
          lastSyncTime: lastLog?.syncEndTime || lastLog?.syncStartTime,
          nextSyncTime: lastLog?.nextScheduledSync
        });

        setSyncLogs(logs.items);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <Helmet>
        <title>Admin dashboard - CISA KEV Scanner</title>
        <meta name="description" content="System administration and monitoring" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Admin dashboard</h1>
              <p className="text-muted-foreground">System overview and management</p>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total uploads</CardTitle>
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalUploads}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Unique vulnerable libraries</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalVulnerableLibraries}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Last sync</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-medium">
                        {stats.lastSyncTime 
                          ? format(new Date(stats.lastSyncTime), 'MMM d, HH:mm')
                          : 'Never'}
                      </div>
                      {stats.nextSyncTime && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Next: {format(new Date(stats.nextSyncTime), 'MMM d, HH:mm')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent sync events</CardTitle>
                      <CardDescription>Latest CISA KEV database synchronizations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {syncLogs.length > 0 ? (
                        <div className="space-y-3">
                          {syncLogs.map((log) => (
                            <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border">
                              <div>
                                <p className="font-medium">
                                  {format(new Date(log.syncStartTime), 'MMM d, yyyy HH:mm')}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {log.vulnerabilitiesFetched || 0} vulnerabilities fetched
                                </p>
                              </div>
                              <span className={`status-badge ${
                                log.status === 'success' ? 'status-completed' : 'status-failed'
                              }`}>
                                {log.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No sync logs yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick actions</CardTitle>
                      <CardDescription>System management tools</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button asChild className="w-full justify-start">
                        <Link to="/admin/users">
                          <Users className="mr-2 h-4 w-4" />
                          Manage users
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link to="/admin/logs">
                          <FileText className="mr-2 h-4 w-4" />
                          View detailed logs
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link to="/admin/logs">
                          <Settings className="mr-2 h-4 w-4" />
                          Configure sync schedule
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default AdminDashboard;