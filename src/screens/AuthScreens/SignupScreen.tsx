import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import { ModernInput, ErrorBox } from '../../components/AuthComponents';
import { validateEmail, validateSecurityKey, validatePassword } from '../../utils/validation';
import { formatSecurityKey } from '../../utils/validation';

const SignupScreen = ({ navigation: navigationProp }: any) => {
  // Use navigation hook as primary, fall back to prop
  const navigationHook = useNavigation();
  const navigation = navigationHook || navigationProp;
  
  console.log('✅✅✅ SIGNUP SCREEN COMPONENT IS LOADING ✅✅✅');
  console.log('📱 SignupScreen mounted - navigation available:', !!navigation);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityKey, setSecurityKey] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [securityKeyError, setSecurityKeyError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugMessage, setDebugMessage] = useState('');

  const { signup, error, clearError } = useAuth();

  useEffect(() => {
    console.log('✅ SignupScreen useEffect mounted');
    clearError();
  }, [clearError]);

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
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

    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Confirm password is required');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
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

  const handleSignup = async () => {
    console.log('👉 SIGNUP HANDLER CALLED');
    console.log('📱 Email:', email);
    console.log('🔐 Password length:', password?.length);
    console.log('🔑 Security Key:', securityKey);
    
    // Reset states
    setDebugMessage('');
    clearError();
    
    // Validation
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!password.trim()) {
      setPasswordError('Password is required');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords must match');
      return;
    }
    if (!securityKey.trim()) {
      setSecurityKeyError('Security key is required');
      return;
    }

    setIsLoading(true);
    setDebugMessage('🔄 Creating account...');
    
    try {
      console.log('📝 Calling signup context function...');
      
      // Call signup from context
      await signup(email, password, securityKey);
      
      console.log('✅ Signup context call completed successfully');
      setDebugMessage('✅ Account created successfully!');
      setIsLoading(false);

      // Show success alert and navigate
      Alert.alert(
        '✅ Success!',
        'Your account has been created successfully.\nYou can now login with your email and password.',
        [
          {
            text: 'Go to Login',
            onPress: () => {
              console.log('📲 Navigating to Login screen');
              // Clear form before navigating
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setSecurityKey('');
              navigation.navigate('Login' as never);
            },
            style: 'default'
          },
        ],
        { cancelable: false }
      );

    } catch (err: any) {
      console.error('❌ Signup failed:', err);
      const message = err?.message || 'Signup failed. Please try again.';
      setDebugMessage('❌ ' + message);
      setIsLoading(false);
      
      Alert.alert('❌ Signup Failed', message, [
        { 
          text: 'Try Again'
        }
      ]);
    }
  };

  const handleSecurityKeyChange = (text: string) => {
    const formatted = formatSecurityKey(text);
    setSecurityKey(formatted);
    setSecurityKeyError('');
  };

  console.log('✅✅✅ RENDERING SIGNUP SCREEN JSX ✅✅✅');

  return (
    <SafeAreaView style={styles.container}>
      <Text style={{ 
        backgroundColor: '#FFD700', 
        color: '#000', 
        fontSize: 18, 
        fontWeight: 'bold', 
        padding: 20,
        textAlign: 'center',
        marginTop: 20,
      }}>
        🎉 SIGNUP SCREEN IS RENDERING! 🎉
      </Text>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Icon name="account-plus" size={48} color="#7c3aed" />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us and start managing your properties</Text>
        </View>

        {/* Card Container */}
        <View style={styles.card}>
          {/* Error Box */}
          {error && <ErrorBox message={error} />}
          
          {/* Debug Message */}
          {debugMessage && (
            <View style={{ backgroundColor: '#e8f4f8', padding: 10, borderRadius: 8, marginBottom: 16 }}>
              <Text style={{ color: '#0288d1', fontSize: 12, fontWeight: '500' }}>Debug: {debugMessage}</Text>
            </View>
          )}

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
            placeholder="Create a strong password"
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

          {/* Confirm Password Input */}
          <ModernInput
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setConfirmPasswordError('');
              clearError();
            }}
            icon="lock-check-outline"
            isPassword={true}
            error={confirmPasswordError}
          />

          {/* Security Key Input */}
          <View>
            <ModernInput
              label="Security Key"
              placeholder="0000-0000"
              value={securityKey}
              onChangeText={handleSecurityKeyChange}
              icon="shield-key-outline"
              keyboardType="numeric"
              error={securityKeyError}
            />
            <Text style={styles.hintText}>
              🔐 Create a 4-digit-4-digit security key. You'll need this to login.
            </Text>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity 
            activeOpacity={0.7}
            style={[
              styles.signupButton,
              {
                backgroundColor: isLoading ? '#9f7aea' : '#7c3aed',
                paddingVertical: 16,
                borderRadius: 12,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 20,
                marginBottom: 12,
                shadowColor: '#7c3aed',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 5,
              }
            ]}
            onPress={() => {
              console.log('🔘 Signup button pressed!');
              handleSignup();
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 }}>
                📝 Sign Up
              </Text>
            )}
          </TouchableOpacity>

          {/* Test Button */}
          <TouchableOpacity 
            activeOpacity={0.7}
            style={{
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: '#f0e6ff',
              alignItems: 'center',
              marginBottom: 16,
              borderWidth: 2,
              borderColor: '#7c3aed',
            }}
            onPress={async () => {
              console.log('🧪 TEST BUTTON PRESSED');
              setDebugMessage('🧪 Testing signup with pre-filled data...');
              setIsLoading(true);
              try {
                console.log('🧪 Calling signup test with test data...');
                await signup('test@staravista.com', 'TestPass123', '1234-5678');
                console.log('🧪 Test signup successful!');
                setDebugMessage('✅ TEST SUCCESS - Account created!');
                setIsLoading(false);
                Alert.alert('✅ Test Passed!', 'Signup works correctly! Now try with your own email.', [
                  { text: 'OK' }
                ]);
              } catch (e: any) {
                console.error('🧪 Test failed:', e);
                const errorMsg = e?.message || 'Unknown error';
                setDebugMessage('❌ TEST FAILED: ' + errorMsg);
                setIsLoading(false);
                Alert.alert('❌ Test Failed', errorMsg, [
                  { text: 'Try Again' }
                ]);
              }
            }}
            disabled={isLoading}
          >
            <Text style={{ color: '#7c3aed', fontSize: 14, fontWeight: '600' }}>
              🧪 Test Sign Up (with pre-filled data)
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already managing with us? </Text>
            <TouchableOpacity 
              activeOpacity={0.6}
              onPress={() => {
                console.log('👉 Login link pressed - navigating to Login');
                navigation.navigate('Login' as never);
              }}
              style={{ paddingVertical: 4 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <View style={styles.featureItem}>
            <View style={styles.featureBadge}>
              <Icon name="shield-check" size={18} color="#7c3aed" />
            </View>
            <Text style={styles.featureText}>Secure Authentication</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBadge}>
              <Icon name="lock-smart" size={18} color="#7c3aed" />
            </View>
            <Text style={styles.featureText}>Two-Factor Security</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBadge}>
              <Icon name="cloud-check" size={18} color="#7c3aed" />
            </View>
            <Text style={styles.featureText}>Data Protection</Text>
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
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
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
  hintText: {
    fontSize: 12,
    color: '#7c3aed',
    marginTop: -10,
    marginBottom: 16,
    fontWeight: '500',
  },
  signupButton: {
    marginTop: 12,
    marginBottom: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  loginText: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 13,
    color: '#7c3aed',
    fontWeight: '700',
  },
  featuresSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f0e6ff',
    borderRadius: 16,
    padding: 16,
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
  },
  featureBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 11,
    color: '#4c1d95',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SignupScreen;
