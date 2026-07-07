import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Mail, Lock } from 'lucide-react';

const AccountSettingsPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || ''
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    password: '',
    passwordConfirm: ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await pb.collection('users').update(currentUser.id, {
        name: formData.name,
        email: formData.email
      }, { $autoCancel: false });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.password !== passwordData.passwordConfirm) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (passwordData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      await pb.collection('users').update(currentUser.id, {
        oldPassword: passwordData.oldPassword,
        password: passwordData.password,
        passwordConfirm: passwordData.passwordConfirm
      }, { $autoCancel: false });
      
      setPasswordData({ oldPassword: '', password: '', passwordConfirm: '' });
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Account settings - CISA KEV Scanner</title>
        <meta name="description" content="Manage your account settings and preferences" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Account settings</h1>
              <p className="text-muted-foreground">Manage your profile and security settings</p>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile information</CardTitle>
                  <CardDescription>Update your account details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : 'Save changes'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Change password</CardTitle>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="oldPassword">Current password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="oldPassword"
                          type="password"
                          value={passwordData.oldPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordData.password}
                          onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm new password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.passwordConfirm}
                          onChange={(e) => setPasswordData({ ...passwordData, passwordConfirm: e.target.value })}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={loading}>
                      {loading ? 'Changing password...' : 'Change password'}
                    </Button>
                  </form>
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

export default AccountSettingsPage;