
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import pb from '@/lib/pocketbaseClient.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Download, AlertTriangle, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const ScanResultsPage = () => {
  const { scanId } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [exportingFormat, setExportingFormat] = useState(null);

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const scanData = await pb.collection('scans').getOne(scanId, { $autoCancel: false });
        setScan(scanData);
      } catch (error) {
        console.error('Failed to fetch scan:', error);
        toast.error('Failed to load scan results');
      } finally {
        setLoading(false);
      }
    };

    fetchScan();
  }, [scanId]);

  const getSeverity = (cvssScore) => {
    if (!cvssScore) return 'unknown';
    if (cvssScore >= 9.0) return 'critical';
    if (cvssScore >= 7.0) return 'high';
    if (cvssScore >= 4.0) return 'medium';
    return 'low';
  };

  const handleExport = async (format) => {
    setExportingFormat(format);
    console.log(`[Export] Starting export for scanId: ${scanId}, format: ${format}`);
    
    try {
      const payload = { scanId, format };
      console.log(`[Export] Request payload:`, payload);

      const response = await apiServerClient.fetch('/export-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log(`[Export] Response status:`, response.status);

      if (!response.ok) {
        let errorMessage = 'Export failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If response isn't JSON, try reading as text
          const textData = await response.text();
          if (textData) errorMessage = textData;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      console.log(`[Export] Blob received, size: ${blob.size} bytes`);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scan-results-${scanId}.${format}`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up to prevent memory leaks
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log(`[Export] Download triggered successfully for format: ${format}`);
      toast.success(`Scan results exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('[Export] Error:', error);
      toast.error(`Failed to export: ${error.message}`);
    } finally {
      setExportingFormat(null);
    }
  };

  const vulnerableLibraries = scan?.vulnerableLibraries || [];
  const filteredLibraries = severityFilter === 'all' 
    ? vulnerableLibraries 
    : vulnerableLibraries.filter(lib => getSeverity(lib.cvssScore) === severityFilter);

  return (
    <>
      <Helmet>
        <title>{`Scan results - CISA KEV Scanner`}</title>
        <meta name="description" content="View detailed vulnerability scan results" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="mb-8">
              <Button asChild variant="ghost" size="sm" className="mb-4 text-muted-foreground hover:text-foreground">
                <Link to="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to dashboard
                </Link>
              </Button>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Scan results</h1>
              <p className="text-muted-foreground text-lg">Detailed vulnerability analysis for your uploaded SBOM</p>
            </div>

            {loading ? (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                     <Card key={i} className="shadow-sm border-muted">
                      <CardHeader>
                        <Skeleton className="h-4 w-32" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-8 w-16" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : scan ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Libraries scanned</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{scan.totalLibrariesScanned || 0}</div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Vulnerabilities found</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-destructive">{scan.totalVulnerabilitiesFound || 0}</div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Scan status</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                        ${scan.scanStatus === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        scan.scanStatus === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                        {scan.scanStatus.charAt(0).toUpperCase() + scan.scanStatus.slice(1)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(scan.created), 'MMM d, yyyy HH:mm')}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="shadow-sm overflow-hidden">
                  <CardHeader className="bg-muted/30">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle>Vulnerable libraries</CardTitle>
                        <CardDescription>
                          {filteredLibraries.length} {severityFilter !== 'all' ? severityFilter : ''} vulnerabilities identified
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Select value={severityFilter} onValueChange={setSeverityFilter}>
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Filter by severity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All severities</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <div className="flex items-center gap-2 border-l pl-3 ml-1 border-muted">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport('pdf')}
                            disabled={exportingFormat !== null}
                            className="bg-background"
                          >
                            {exportingFormat === 'pdf' ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="mr-2 h-4 w-4" />
                            )}
                            Export PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport('csv')}
                            disabled={exportingFormat !== null}
                            className="bg-background"
                          >
                            {exportingFormat === 'csv' ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="mr-2 h-4 w-4" />
                            )}
                            Export CSV
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {filteredLibraries.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                              <TableHead>Library name</TableHead>
                              <TableHead>Version</TableHead>
                              <TableHead>CVE ID</TableHead>
                              <TableHead>CVSS score</TableHead>
                              <TableHead>Affected versions</TableHead>
                              <TableHead>Remediation</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredLibraries.map((lib, index) => {
                              const severity = getSeverity(lib.cvssScore);
                              const severityColor = 
                                severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800' :
                                severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800' :
                                severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';

                              return (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{lib.library}</TableCell>
                                  <TableCell className="text-muted-foreground">{lib.version}</TableCell>
                                  <TableCell>
                                    <code className="text-xs bg-muted px-2 py-1 rounded border">{lib.cveId}</code>
                                  </TableCell>
                                  <TableCell>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${severityColor}`}>
                                      {lib.cvssScore ? lib.cvssScore.toFixed(1) : 'N/A'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {Array.isArray(lib.affectedVersions) 
                                      ? lib.affectedVersions.join(', ') 
                                      : lib.affectedVersions || 'N/A'}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {lib.remediationAvailable ? (
                                      <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                                        Available
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">Not available</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-16 px-4">
                        <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No vulnerabilities found</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                          {severityFilter !== 'all' 
                            ? `No ${severityFilter} severity vulnerabilities were detected in this scan.`
                            : 'Great news! All scanned libraries appear to be secure based on current records.'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="text-center py-16">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Scan not found</h3>
                  <p className="text-muted-foreground mb-6">The scan you are looking for does not exist or you do not have permission to view it.</p>
                  <Button asChild>
                    <Link to="/dashboard">Return to dashboard</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default ScanResultsPage;
