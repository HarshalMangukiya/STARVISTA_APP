import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../config/firebase';
import { sendPasswordResetEmail } from '@react-native-firebase/auth';
import { ModernInput, ModernCheckbox, ModernButton, ErrorBox } from '../../components/AuthComponents';
import { validateEmail, validatePassword } from '../../utils/validation';

const { height } = Dimensions.get('window');

const LoginScreen = ({ navigation: navigationProp }: any) => {
  // Use the navigation hook as primary, fall back to prop
  const navigation = useNavigation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, error, clearError, isLoading: authIsLoading } = useAuth();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const validateForm = (): boolean => {
    let isValid = true;
    
    // Reset all errors first
    setEmailError('');
    setPasswordError('');

    // Email validation
    if (!email.trim()) {
      setEmailError('Email address is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Password validation
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (!validatePassword(password)) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      // Navigation is handled by RootNavigator based on isSignedIn state
    } catch (err: any) {
      // Error is handled by context
      console.error('Login error:', err?.message || err);
    } finally {
      setIsLoading(false);
    }
  };


  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address to reset password');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Success', 'Password reset link sent! Please check your inbox and SPAM folder.');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      Alert.alert('Error', err?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Icon name="lock-open" size={48} color="#7c3aed" />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to your property management account</Text>
        </View>

        {/* Card Container */}
        <View style={styles.card}>
          {/* Error Box */}
          {error && <ErrorBox message={error} />}

          {/* Email Input */}
          <ModernInput
            label="Email Address"
            placeholder="owner@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError('');
              clearError();
            }}
            icon="email-outline"
            keyboardType="email-address"
            error={emailError}
          />

          {/* Password Input */}
          <ModernInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError('');
              clearError();
            }}
            icon="lock-outline"
            isPassword={true}
            error={passwordError}
          />


          {/* Forgot Password Link */}
          <TouchableOpacity 
            style={styles.forgotPasswordContainer}
            onPress={handleForgotPassword}
            disabled={isLoading || authIsLoading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity 
            activeOpacity={0.7}
            style={[
              styles.loginButton,
              {
                backgroundColor: isLoading || authIsLoading ? '#9f7aea' : '#7c3aed',
              }
            ]}
            onPress={handleLogin}
            disabled={isLoading || authIsLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading || authIsLoading ? 'Logging In...' : 'Login'}
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity 
              activeOpacity={0.6}
              onPress={() => {
                navigation.navigate('Signup' as never);
              }}
              style={{ paddingVertical: 4 }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f0e6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a202c',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 18,
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#7c3aed',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  signupText: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
  },
  signupLink: {
    fontSize: 13,
    color: '#7c3aed',
    fontWeight: '700',
  },
});

export default LoginScreen;
