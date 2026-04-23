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
import { validateEmail, validatePassword } from '../../utils/validation';

const SignupScreen = ({ navigation: navigationProp }: any) => {
  // Use navigation hook as primary, fall back to prop
  const navigationHook = useNavigation();
  const navigation = navigationHook || navigationProp;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signup, error, clearError } = useAuth();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const validateForm = (): boolean => {
    let isValid = true;

    // Reset all errors first
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

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

    // Confirm password validation
    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  const handleSignup = async () => {
    // Reset general error state
    clearError();

    // Check all fields at once
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Call signup from context
      await signup(email, password);

      // Show success alert and navigate
      Alert.alert(
        'Success!',
        'Your account has been created successfully.\nYou can now login with your email and password.',
        [
          {
            text: 'Go to Login',
            onPress: () => {
              // Clear form before navigating
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              navigation.navigate('Login' as never);
            },
            style: 'default'
          },
        ],
        { cancelable: false }
      );

    } catch (err: any) {
      console.error('Signup failed:', err);
      // The error is already set in AuthContext by the signup function,
      // which will display it in the ErrorBox component.
      // We don't need a separate Alert.alert for technical/validation errors.
      setIsLoading(false);
    }
  };



  console.log('Rendering signup screen');

  return (
    <SafeAreaView style={styles.container}>
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



          {/* Sign Up Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.signupButton,
              {
                backgroundColor: isLoading ? '#9f7aea' : '#7c3aed',
              }
            ]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already managing with us? </Text>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => {
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
            <Text style={styles.featureText}>Secure</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBadge}>
              <Icon name="lock-smart" size={18} color="#7c3aed" />
            </View>
            <Text style={styles.featureText}>Two-Factor</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBadge}>
              <Icon name="cloud-check" size={18} color="#7c3aed" />
            </View>
            <Text style={styles.featureText}>Protected</Text>
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
  hintText: {
    fontSize: 12,
    color: '#7c3aed',
    marginTop: -10,
    marginBottom: 16,
    fontWeight: '500',
  },
  signupButton: {
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
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
    borderRadius: 12,
    padding: 20,
    gap: 16,
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
