import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { FileJson, Fingerprint, BookOpen, AlertTriangle, FileOutput, LayoutDashboard, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const LearnMorePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Multi-format SBOM support',
      description: 'Upload dependency data easily. We natively support CycloneDX (JSON/XML), SPDX, and standard plain text lists. No need for complex pre-processing or custom scripts.',
      icon: FileJson
    },
    {
      title: 'Exact vulnerability matching',
      description: 'Our matching engine evaluates the exact version numbers specified in your SBOM against the CISA catalog, ensuring low false positives and highly accurate alerts.',
      icon: Fingerprint
    },
    {
      title: 'Affected versions & guidance',
      description: 'Quickly see which version ranges are affected and get clear remediation guidance directly from CISA to resolve vulnerabilities immediately.',
      icon: BookOpen
    },
    {
      title: 'Configuration context',
      description: 'We import specific configuration notes from CISA to help you assess actual risk. Sometimes a vulnerability only applies if a specific feature is enabled.',
      icon: AlertTriangle
    },
    {
      title: 'Exportable results',
      description: 'Share your findings with stakeholders or compliance auditors easily. Export detailed scan results as PDF or CSV formats directly from your dashboard.',
      icon: FileOutput
    },
    {
      title: 'Admin monitoring dashboard',
      description: 'For organization admins, monitor system health, track total uploads, view unique vulnerable libraries, and manage synchronization logs across your teams.',
      icon: LayoutDashboard
    }
  ];

  return (
    <>
      <Helmet>
        <title>Learn More - CISA KEV Scanner</title>
        <meta name="description" content="Discover detailed features and technical capabilities of the CISA KEV Scanner platform." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 py-16 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            
            <div className="mb-16 md:mb-24 max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                Advanced vulnerability intelligence
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Dive deeper into the features that power the CISA KEV Scanner. Our platform is built specifically to bridge the gap between compliance requirements and actionable engineering insights.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-x-12 gap-y-16 mb-24">
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="bg-primary/5 rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto border border-primary/10">
              <h2 className="text-3xl font-bold mb-4">Ready to secure your application?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join engineering teams worldwide using CISA KEV Scanner to stay ahead of known exploits.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="w-full sm:w-auto gap-2">
                  <Link to="/get-started">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto"
                  onClick={() => navigate('/')}
                >
                  Back to Home
                </Button>
              </div>
            </div>

          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default LearnMorePage;