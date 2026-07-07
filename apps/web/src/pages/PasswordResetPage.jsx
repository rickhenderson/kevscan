
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Mail } from 'lucide-react';

const PasswordResetPage = () => {
  const { requestPasswordReset } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (error) {
      toast.error(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Reset password - CISA KEV Scanner</title>
        <meta name="description" content="Reset your CISA KEV Scanner account password" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md shadow-lg border-muted">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Reset your password</CardTitle>
              <CardDescription>
                {sent 
                  ? 'Check your email for a password reset link'
                  : 'Enter your email address and we will send you a reset link'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!sent ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="maya@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending...' : 'Send reset link'}
                  </Button>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    We have sent a password reset link to <strong>{email}</strong>. 
                    Please check your inbox and follow the instructions.
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/login">Back to login</Link>
                  </Button>
                </div>
              )}

              {!sent && (
                <div className="mt-6 text-center text-sm">
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Back to login
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default PasswordResetPage;
