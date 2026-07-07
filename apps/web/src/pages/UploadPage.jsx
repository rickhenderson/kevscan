import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import apiServerClient from '@/lib/apiServerClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const UploadPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    const validTypes = ['application/json', 'application/xml', 'text/xml', 'text/plain'];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.json') && !selectedFile.name.endsWith('.xml')) {
      toast.error('Invalid file type. Please upload JSON, XML, or plain text files.');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    
    setUploading(true);
    
    try {
      const base64File = await convertToBase64(file);
      
      const uploadResponse = await apiServerClient.fetch('/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: base64File,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream'
        })
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const uploadData = await uploadResponse.json();

      // Ownership (userId) is now set server-side by the API from the verified
      // session, so there's no client-side patch to apply here anymore.

      toast.success(`File uploaded successfully. ${uploadData.librariesCount} libraries detected.`);
      
      const scanResponse = await apiServerClient.fetch('/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: uploadData.scanId,
          uploadId: uploadData.uploadId
        })
      });
      
      if (!scanResponse.ok) {
        throw new Error('Scan failed');
      }
      
      toast.success('Scan completed successfully');
      navigate(`/results/${uploadData.scanId}`);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Upload SBOM - CISA KEV Scanner</title>
        <meta name="description" content="Upload your software bill of materials for vulnerability scanning" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Upload SBOM</h1>
              <p className="text-muted-foreground">Upload your software bill of materials for vulnerability scanning</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>File upload</CardTitle>
                <CardDescription>
                  Supported formats: CycloneDX (JSON/XML), SPDX (JSON), Plain text
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                      dragActive ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {file ? (
                      <div className="space-y-4">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFile(null)}
                        >
                          Remove file
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                        <div>
                          <p className="font-medium mb-1">Drop your SBOM file here</p>
                          <p className="text-sm text-muted-foreground">or click to browse</p>
                        </div>
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept=".json,.xml,.txt"
                          className="hidden"
                          id="file-upload"
                          disabled={uploading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('file-upload').click()}
                          disabled={uploading}
                        >
                          Select file
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Maximum file size: 10MB
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format">File format (optional)</Label>
                    <Select value={format} onValueChange={setFormat} disabled={uploading}>
                      <SelectTrigger id="format">
                        <SelectValue placeholder="Auto-detect format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cyclonedx-json">CycloneDX JSON</SelectItem>
                        <SelectItem value="cyclonedx-xml">CycloneDX XML</SelectItem>
                        <SelectItem value="spdx-json">SPDX JSON</SelectItem>
                        <SelectItem value="plaintext">Plain text</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <FileText className="h-5 w-5 text-primary mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Supported formats</p>
                        <ul className="text-muted-foreground space-y-1">
                          <li>• CycloneDX JSON or XML</li>
                          <li>• SPDX JSON</li>
                          <li>• Plain text list of libraries</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={!file || uploading}>
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading and scanning...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload and scan
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default UploadPage;