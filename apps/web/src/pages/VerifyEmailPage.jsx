
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { confirmVerification, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Verification token is missing or invalid.');
      return;
    }

    const verifyToken = async () => {
      try {
        await confirmVerification(token);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setErrorMessage(err.message || 'Verification failed. The token may be expired or invalid.');
      }
    };

    verifyToken();
  }, [token, confirmVerification]);

  return (
    <>
      <Helmet>
        <title>Verify Email - CISA KEV Scanner</title>
        <meta name="description" content="Verify your email address for CISA KEV Scanner" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md shadow-lg border-muted">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-muted">
                {status === 'loading' && <Loader2 className="h-8 w-8 text-primary animate-spin" />}
                {status === 'success' && <CheckCircle className="h-8 w-8 text-green-500" />}
                {status === 'error' && <AlertTriangle className="h-8 w-8 text-destructive" />}
              </div>
              <CardTitle className="text-2xl">
                {status === 'loading' && 'Verifying Email...'}
                {status === 'success' && 'Email Verified'}
                {status === 'error' && 'Verification Optional'}
              </CardTitle>
              <CardDescription className="pt-2">
                {status === 'loading' && 'Please wait while we confirm your email address.'}
                {status === 'success' && 'Your email has been successfully verified. You can now access all features.'}
                {status === 'error' && (
                  <>
                    <p className="mb-2 text-destructive">{errorMessage}</p>
                    <p>Verifying your email is optional but recommended for account security. You can still access your dashboard.</p>
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 justify-center pt-6">
              {status === 'success' && (
                <Button asChild className="w-full">
                  <Link to={isAuthenticated ? "/dashboard" : "/login"}>
                    {isAuthenticated ? "Go to Dashboard" : "Sign In"}
                  </Link>
                </Button>
              )}
              
              {status === 'error' && (
                <div className="flex flex-col gap-3">
                  <Button asChild className="w-full">
                    <Link to={isAuthenticated ? "/dashboard" : "/login"}>
                      {isAuthenticated ? "Go to Dashboard" : "Sign In"}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/">Back to Home</Link>
                  </Button>
                </div>
              )}

              {status === 'loading' && (
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                >
                  Skip Verification
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default VerifyEmailPage;
