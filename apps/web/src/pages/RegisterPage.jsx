
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Mail, Lock, User } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { signup, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Create the account
      await signup(formData.email, formData.password, formData.passwordConfirm, formData.name);
      
      // Automatically log the user in immediately after registration
      await login(formData.email, formData.password);
      
      toast.success('Account created successfully. Welcome!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign up - CISA KEV Scanner</title>
        <meta name="description" content="Create your CISA KEV Scanner account to start scanning for vulnerabilities" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md shadow-lg border-muted">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Create your account</CardTitle>
              <CardDescription>
                Start scanning for vulnerabilities in your software
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Maya Chen"
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="maya@company.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordConfirm">Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="passwordConfirm"
                      name="passwordConfirm"
                      type="password"
                      placeholder="••••••••"
                      value={formData.passwordConfirm}
                      onChange={handleChange}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  {errors.passwordConfirm && <p className="text-sm text-destructive">{errors.passwordConfirm}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create account'}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link 
                  to="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default RegisterPage;
