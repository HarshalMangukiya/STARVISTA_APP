import React, { createContext, useState, useEffect, ReactNode } from 'react';
import authService from '../services/authService';
import { auth } from '../config/firebase';

interface User {
  email: string;
  role: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on app start
  useEffect(() => {
    bootstrapAsync();

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsSignedIn(false);
      }
      // If firebaseUser exists, bootstrapAsync already handled the startup, 
      // and login/signup handles active session updates.
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const bootstrapAsync = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      const loggedIn = await authService.isLoggedIn();
      
      if (currentUser && loggedIn) {
        setUser(currentUser);
        setIsSignedIn(true);
      }
    } catch (error) {
      console.error('Bootstrap error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const loginUser = await authService.login(email, password);
      setUser(loginUser);
      setIsSignedIn(true);
    } catch (err: any) {
      const errorMessage = err?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('AuthContext: Starting signup');
      const newUser = await authService.signup(email, password);
      console.log('AuthContext: Signup successful, user:', newUser.email);
      setUser(newUser);
      // Don't automatically sign in after signup - user must log in
      setIsSignedIn(false);
    } catch (err: any) {
      const errorMessage = err?.message || 'Signup failed. Please try again.';
      console.error('AuthContext signup error:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setIsSignedIn(false);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Logout failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isSignedIn,
    login,
    signup,
    logout,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
