import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Database, FileSearch, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const features = [
    {
      icon: Database,
      title: 'Automated CISA KEV sync',
      description: 'Daily synchronization with the official CISA Known Exploited Vulnerabilities catalog ensures your scans use the latest threat intelligence.'
    },
    {
      icon: FileSearch,
      title: 'SBOM scanning',
      description: 'Upload CycloneDX, SPDX, or plain text software bills of materials to identify vulnerable components in your applications.'
    },
    {
      icon: Zap,
      title: 'Instant vulnerability matching',
      description: 'Match your software libraries against known exploited vulnerabilities with detailed remediation guidance and CVSS scores.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>CISA KEV Scanner - Identify known exploited vulnerabilities</title>
        <meta name="description" content="Scan your software bill of materials against CISA's Known Exploited Vulnerabilities catalog. Automated daily sync, instant results, and detailed remediation guidance." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1">
          <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-background to-muted/30">
            {/* Added pointer-events-none to prevent background overlay from blocking clicks */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none"></div>
            
            {/* Added relative and z-10 to ensure content is above absolute background */}
            <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-20">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <Shield className="h-4 w-4" />
                    <span>CISA KEV Scanner</span>
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight" style={{ letterSpacing: '-0.02em' }}>
                    Identify known exploited vulnerabilities
                  </h1>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-prose">
                    Scan your software bill of materials against CISA's Known Exploited Vulnerabilities catalog. 
                    Get instant results with detailed remediation guidance.
                  </p>
                  
                  <div className="flex flex-wrap gap-4">
                    <Button asChild size="lg" className="gap-2 cursor-pointer transition-all active:scale-[0.98]">
                      <Link to="/get-started">
                        Get started
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="cursor-pointer transition-all active:scale-[0.98]">
                      <Link to="/learn-more">Learn more</Link>
                    </Button>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-2xl">Access your account</CardTitle>
                      <CardDescription>
                        Sign in or create a new account to view your vulnerability scanning dashboard.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      {/* Navigates to /login using React Router useNavigate */}
                      <Button 
                        onClick={() => navigate('/login')} 
                        className="w-full text-base py-6 cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]"
                      >
                        Sign in
                      </Button>
                      
                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">New to CISA KEV Scanner?</span>
                        </div>
                      </div>

                      {/* Navigates to /register using React Router useNavigate */}
                      <Button 
                        variant="outline" 
                        onClick={() => navigate('/register')} 
                        className="w-full text-base py-6 cursor-pointer transition-all hover:bg-muted active:scale-[0.98]"
                      >
                        Create an account
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </section>

          <section id="features" className="py-24 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Core capabilities</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Built for security teams who need fast, accurate vulnerability intelligence
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex gap-6"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <img 
                  src="https://images.unsplash.com/photo-1694190614093-fd6d69af6327" 
                  alt="Cybersecurity monitoring dashboard with threat detection visualization"
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default HomePage;