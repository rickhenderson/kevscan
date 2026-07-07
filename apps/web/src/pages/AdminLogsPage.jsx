import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const AdminLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [updatingSchedule, setUpdatingSchedule] = useState(false);
  const [cronExpression, setCronExpression] = useState('0 1 * * *');
  const [timezone, setTimezone] = useState('America/New_York');

  useEffect(() => {
    fetchLogs();
    fetchSchedule();
  }, []);

  const fetchLogs = async () => {
    try {
      const logsData = await pb.collection('sync_logs').getFullList({
        sort: '-created',
        $autoCancel: false
      });
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      toast.error('Failed to load sync logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      const response = await apiServerClient.fetch('/schedule-config/current');
      if (response.ok) {
        const data = await response.json();
        setCronExpression(data.schedule || '0 1 * * *');
        setTimezone(data.timezone || 'America/New_York');
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const response = await apiServerClient.fetch('/cisa-kev-sync');
      if (!response.ok) {
        throw new Error('Sync failed');
      }
      const data = await response.json();
      toast.success(`Sync completed. ${data.vulnerabilitiesFetched} vulnerabilities fetched.`);
      await fetchLogs();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync CISA KEV database');
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    setUpdatingSchedule(true);
    try {
      const response = await apiServerClient.fetch('/schedule-config/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cronExpression, timezone })
      });
      
      if (!response.ok) {
        throw new Error('Schedule update failed');
      }
      
      toast.success('Sync schedule updated successfully');
    } catch (error) {
      console.error('Schedule update error:', error);
      toast.error('Failed to update sync schedule');
    } finally {
      setUpdatingSchedule(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sync logs - CISA KEV Scanner</title>
        <meta name="description" content="View and manage CISA KEV database synchronization logs" />
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
              <h1 className="text-3xl font-bold mb-2">Sync logs</h1>
              <p className="text-muted-foreground">CISA KEV database synchronization history</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Synchronization logs</CardTitle>
                      <CardDescription>History of CISA KEV database syncs</CardDescription>
                    </div>
                    <Button onClick={handleManualSync} disabled={syncing}>
                      <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                      {syncing ? 'Syncing...' : 'Manual sync'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : logs.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Vulnerabilities</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Error message</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logs.map((log) => {
                            const duration = log.syncEndTime && log.syncStartTime
                              ? Math.round((new Date(log.syncEndTime) - new Date(log.syncStartTime)) / 1000)
                              : null;
                            
                            return (
                              <TableRow key={log.id}>
                                <TableCell className="font-medium">
                                  {format(new Date(log.syncStartTime), 'MMM d, yyyy HH:mm:ss')}
                                </TableCell>
                                <TableCell>
                                  <span className={`status-badge ${
                                    log.status === 'success' ? 'status-completed' : 'status-failed'
                                  }`}>
                                    {log.status === 'success' ? (
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                    ) : (
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                    )}
                                    {log.status}
                                  </span>
                                </TableCell>
                                <TableCell>{log.vulnerabilitiesFetched || 0}</TableCell>
                                <TableCell>
                                  {duration ? `${duration}s` : 'N/A'}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                  {log.errorMessage || 'None'}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No sync logs yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sync schedule</CardTitle>
                  <CardDescription>Configure automatic synchronization</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateSchedule} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cron">Cron expression</Label>
                      <Input
                        id="cron"
                        value={cronExpression}
                        onChange={(e) => setCronExpression(e.target.value)}
                        placeholder="0 1 * * *"
                        disabled={updatingSchedule}
                      />
                      <p className="text-xs text-muted-foreground">
                        Current: Daily at 1:00 AM
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input
                        id="timezone"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        placeholder="America/New_York"
                        disabled={updatingSchedule}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={updatingSchedule}>
                      {updatingSchedule ? 'Updating...' : 'Update schedule'}
                    </Button>
                  </form>

                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Common cron patterns</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• 0 1 * * * - Daily at 1:00 AM</li>
                      <li>• 0 */6 * * * - Every 6 hours</li>
                      <li>• 0 0 * * 0 - Weekly on Sunday</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default AdminLogsPage;