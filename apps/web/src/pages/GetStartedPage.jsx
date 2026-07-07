import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Shield, UploadCloud, Search, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const GetStartedPage = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: UploadCloud,
      title: 'Upload SBOM files',
      description: 'Easily upload your CycloneDX, SPDX, or plain text files. Our platform accepts standard formats to seamlessly integrate with your build pipeline.'
    },
    {
      icon: Search,
      title: 'Scan for vulnerabilities',
      description: 'We instantly cross-reference your software libraries against the official CISA KEV catalog to find known exploited vulnerabilities in your stack.'
    },
    {
      icon: CheckCircle,
      title: 'Get remediation guidance',
      description: 'Review affected versions, CVSS scores, and precise remediation notes so your engineering team knows exactly how to address the risks.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Get Started - CISA KEV Scanner</title>
        <meta name="description" content="Get started with CISA KEV Scanner and start protecting your software supply chain today." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 py-16 lg:py-24 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            
            <div className="text-center mb-16">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.5 }}
                className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6"
              >
                <Shield className="h-8 w-8 text-primary" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                Secure your supply chain in minutes
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                The CISA KEV Scanner app provides an automated pipeline for comparing your software dependencies against known exploited vulnerabilities. By leveraging up-to-date threat intelligence, you can quickly identify critical risks and apply remediation strategies before they become incidents.
              </p>
            </div>

            <div className="space-y-12 mb-16">
              {steps.map((step, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-card p-6 md:p-8 rounded-2xl border shadow-sm"
                >
                  <div className="flex-shrink-0 w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-lg">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center space-y-6">
              <Button asChild size="lg" className="text-lg px-8 py-6 h-auto">
                <Link to="/register">Create Account</Link>
              </Button>
              <div>
                <button 
                  onClick={() => navigate('/')} 
                  className="text-muted-foreground hover:text-foreground hover:underline transition-colors bg-transparent border-none p-0 cursor-pointer"
                >
                  Back to Home
                </button>
              </div>
            </div>

          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default GetStartedPage;