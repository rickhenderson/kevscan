import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const UserDashboard = () => {
  const { currentUser } = useAuth();
  const [scans, setScans] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scansData, uploadsData] = await Promise.all([
          pb.collection('scans').getList(1, 10, {
            filter: `userId="${currentUser.id}"`,
            sort: '-created',
            $autoCancel: false
          }),
          pb.collection('uploads').getList(1, 10, {
            filter: `userId="${currentUser.id}"`,
            sort: '-created',
            $autoCancel: false
          })
        ]);
        
        setScans(scansData.items);
        setUploads(uploadsData.items);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser.id]);

  const latestScan = scans[0];

  return (
    <>
      <Helmet>
        <title>Dashboard - CISA KEV Scanner</title>
        <meta name="description" content="View your vulnerability scan results and recent uploads" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {currentUser?.name || currentUser?.email}</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total scans</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{scans.length}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total uploads</CardTitle>
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{uploads.length}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Vulnerabilities found</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {scans.reduce((sum, scan) => sum + (scan.totalVulnerabilitiesFound || 0), 0)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {loading ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Latest scan result</CardTitle>
                    <CardDescription>Most recent vulnerability scan</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {latestScan ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <span className={`status-badge ${
                            latestScan.scanStatus === 'completed' ? 'status-completed' :
                            latestScan.scanStatus === 'failed' ? 'status-failed' : 'status-pending'
                          }`}>
                            {latestScan.scanStatus === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {latestScan.scanStatus === 'failed' && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {latestScan.scanStatus === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {latestScan.scanStatus}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Libraries scanned</span>
                          <span className="font-medium">{latestScan.totalLibrariesScanned || 0}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Vulnerabilities found</span>
                          <span className="font-medium text-destructive">{latestScan.totalVulnerabilitiesFound || 0}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Scan date</span>
                          <span className="font-medium">{format(new Date(latestScan.created), 'MMM d, yyyy')}</span>
                        </div>
                        
                        {latestScan.scanStatus === 'completed' && (
                          <Button asChild className="w-full mt-4">
                            <Link to={`/results/${latestScan.id}`}>View full results</Link>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">No scans yet</p>
                        <Button asChild>
                          <Link to="/upload">Upload SBOM</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent uploads</CardTitle>
                    <CardDescription>Your latest SBOM files</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {uploads.length > 0 ? (
                      <div className="space-y-3">
                        {uploads.slice(0, 5).map((upload) => {
                          const relatedScan = scans.find(s => s.uploadId === upload.id);
                          return (
                            <div key={upload.id} className="flex items-center justify-between p-3 rounded-lg border">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{upload.fileName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(upload.created), 'MMM d, yyyy')}
                                </p>
                              </div>
                              {relatedScan && (
                                <div className="ml-4 text-right">
                                  <p className="text-sm font-medium text-destructive">
                                    {relatedScan.totalVulnerabilitiesFound || 0} vulnerabilities
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">No uploads yet</p>
                        <Button asChild>
                          <Link to="/upload">Upload your first SBOM</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="mt-8 flex gap-4">
              <Button asChild size="lg">
                <Link to="/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  New upload
                </Link>
              </Button>
              {latestScan && latestScan.scanStatus === 'completed' && (
                <Button asChild variant="outline" size="lg">
                  <Link to={`/results/${latestScan.id}`}>View latest results</Link>
                </Button>
              )}
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default UserDashboard;