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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import { ModernInput, ModernCheckbox, ModernButton, ErrorBox } from '../../components/AuthComponents';
import { validateEmail, validateSecurityKey, validatePassword } from '../../utils/validation';
import { formatSecurityKey } from '../../utils/validation';

const { height } = Dimensions.get('window');

const LoginScreen = ({ navigation: navigationProp }: any) => {
  // Use the navigation hook as primary, fall back to prop
  const navigation = useNavigation();
  
  console.log('📱 LoginScreen mounted - navigation available:', !!navigation);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [securityKey, setSecurityKey] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [securityKeyError, setSecurityKeyError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, error, clearError, isLoading: authIsLoading } = useAuth();

  useEffect(() => {
    clearError();
  }, []);

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setSecurityKeyError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Invalid email format');
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (!validatePassword(password)) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    if (!securityKey.trim()) {
      setSecurityKeyError('Security Key is required');
      isValid = false;
    } else if (!validateSecurityKey(securityKey)) {
      setSecurityKeyError('Security key must be in format XXXX-XXXX');
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
      console.log('Attempting login with email:', email);
      await login(email, password, securityKey);
      console.log('Login successful');
      // Navigation is handled by RootNavigator based on isSignedIn state
    } catch (err: any) {
      // Error is handled by context
      console.error('Login error:', err?.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityKeyChange = (text: string) => {
    const formatted = formatSecurityKey(text);
    setSecurityKey(formatted);
    setSecurityKeyError('');
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

          {/* Security Key Input */}
          <ModernInput
            label="Security Key"
            placeholder="0000-0000"
            value={securityKey}
            onChangeText={handleSecurityKeyChange}
            icon="shield-key-outline"
            keyboardType="numeric"
            error={securityKeyError}
          />

          {/* Remember Me Checkbox */}
          <ModernCheckbox
            label="Remember me"
            value={rememberMe}
            onValueChange={setRememberMe}
          />

          {/* Forgot Password Link */}
          <TouchableOpacity style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity 
            activeOpacity={0.7}
            style={[
              {
                paddingVertical: 16,
                borderRadius: 12,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: isLoading || authIsLoading ? '#9f7aea' : '#7c3aed',
                marginTop: 8,
                marginBottom: 16,
                shadowColor: '#7c3aed',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 5,
              },
              styles.loginButton,
            ]}
            onPress={handleLogin}
            disabled={isLoading || authIsLoading}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 }}>
              {isLoading || authIsLoading ? '🔄 Logging in...' : '🔓 Login'}
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity 
              activeOpacity={0.6}
              onPress={() => {
                try {
                  console.log('👉 Sign Up link pressed');
                  console.log('📱 Navigation object exists:', !!navigation);
                  
                  if (!navigation) {
                    console.error('❌ ERROR: Navigation is undefined!');
                    return;
                  }
                  
                  console.log('✅ Calling navigation.navigate("Signup")');
                  navigation.navigate('Signup' as never);
                  console.log('✅ Navigation call succeeded');
                } catch (error: any) {
                  console.error('❌ ERROR:', error?.message || error);
                }
              }}
              style={{ paddingVertical: 4 }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Icon name="information-outline" size={16} color="#95a5a6" />
          <Text style={styles.footerText}>Your credentials are securely stored</Text>
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
    paddingHorizontal: 16,
    paddingTop: 20,
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: 4,
  },
  forgotPasswordText: {
    color: '#7c3aed',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
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
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  signupLink: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#95a5a6',
    marginLeft: 6,
  },
});

export default LoginScreen;
