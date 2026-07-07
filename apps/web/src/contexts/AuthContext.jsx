
import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (pb.authStore.isValid) {
      setCurrentUser(pb.authStore.model);
    }
    setInitialLoading(false);

    const unsubscribe = pb.authStore.onChange((token, model) => {
      setCurrentUser(model);
    });

    return () => unsubscribe();
  }, []);

  const parsePocketBaseError = (err) => {
    if (!err || !err.response) return err.message || 'An unexpected error occurred';
    
    const { status, data, message } = err.response;
    
    if (status === 400) {
      if (data?.email?.code === 'validation_not_unique') {
        return 'Email already in use';
      }
      if (data?.identity?.code === 'validation_required' || data?.password?.code === 'validation_required') {
        return 'Email and password are required';
      }
      if (message === 'Failed to authenticate.') {
        return 'Invalid email or password';
      }
    }
    
    if (status === 403 || status === 401) {
      return 'Invalid email or password';
    }
    
    return message || err.message || 'Authentication failed';
  };

  const login = async (email, password) => {
    try {
      // Note: We intentionally do not check for verified status here.
      // Users can log in immediately after registration regardless of email verification status.
      const authData = await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
      setCurrentUser(authData.record);
      return authData;
    } catch (error) {
      throw new Error(parsePocketBaseError(error));
    }
  };

  const signup = async (email, password, passwordConfirm, name) => {
    try {
      // Create user record. The backend custom hook will intercept this success event
      // to generate a proper verification token and send the custom branded email.
      const record = await pb.collection('users').create({
        email,
        password,
        passwordConfirm,
        name,
        role: 'user'
      }, { $autoCancel: false });
      
      return record;
    } catch (error) {
      throw new Error(parsePocketBaseError(error));
    }
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentUser(null);
  };

  const requestPasswordReset = async (email) => {
    try {
      await pb.collection('users').requestPasswordReset(email, { $autoCancel: false });
    } catch (error) {
      throw new Error(parsePocketBaseError(error));
    }
  };

  const confirmPasswordReset = async (token, password, passwordConfirm) => {
    try {
      await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm, { $autoCancel: false });
    } catch (error) {
      throw new Error(parsePocketBaseError(error));
    }
  };

  const confirmVerification = async (token) => {
    try {
      await pb.collection('users').confirmVerification(token, { $autoCancel: false });
    } catch (error) {
      throw new Error(parsePocketBaseError(error));
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  const value = {
    currentUser,
    login,
    signup,
    logout,
    requestPasswordReset,
    confirmPasswordReset,
    confirmVerification,
    isAuthenticated: pb.authStore.isValid,
    isAdmin,
    initialLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
