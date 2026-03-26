import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from '@react-native-firebase/auth';
import { auth } from '../config/firebase';
import styles from '../styles/styles';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const getFirebaseErrorMessage = (error: any): string => {
    const errorCode = error?.code || error?.message || '';

    // Handle common Firebase auth errors
    if (errorCode.includes('configuration-not-found') || errorCode.includes('CONFIGURATION_NOT_FOUND')) {
      return 'Firebase not configured. Make sure you:\n1. Downloaded google-services.json\n2. Placed it in android/app/\n3. Ran npm install\n4. Cleaned gradle cache';
    }
    if (errorCode.includes('user-not-found')) {
      return 'No account found with this email. Please sign up first.';
    }
    if (errorCode.includes('wrong-password')) {
      return 'Incorrect password. Please try again.';
    }
    if (errorCode.includes('email-already-in-use')) {
      return 'This email is already registered. Please sign in instead.';
    }
    if (errorCode.includes('invalid-email')) {
      return 'Invalid email address.';
    }
    if (errorCode.includes('weak-password')) {
      return 'Password is too weak. Use at least 6 characters.';
    }
    if (errorCode.includes('network-request-failed')) {
      return 'Network error. Please check your internet connection.';
    }

    return error?.message || 'An error occurred. Please try again.';
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please enter email and password');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert('Success', 'Account created successfully!');
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error);
      Alert.alert('Sign Up Error', errorMessage);
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Success', 'Logged in successfully!');
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error);
      Alert.alert('Sign In Error', errorMessage);
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 16 }}>
        {/* Header */}
        <View style={{ marginTop: 60, marginBottom: 40 }}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#000' }}>
            🏠 STARVISTA
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>
            Property Management
          </Text>
        </View>

        {/* Title */}
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 24 }}>
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </Text>

        {/* Email Input */}
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password Input */}
        <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
          placeholderTextColor="#999"
          secureTextEntry
        />

        {/* Sign In/Up Button */}
        <TouchableOpacity
          style={[styles.button, styles.saveButton, { marginTop: 24 }]}
          onPress={isSignUp ? handleSignUp : handleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Toggle between Sign In and Sign Up */}
        <TouchableOpacity
          style={{ marginTop: 16 }}
          onPress={() => {
            setIsSignUp(!isSignUp);
            setEmail('');
            setPassword('');
          }}
          disabled={isLoading}
        >
          <Text style={{ textAlign: 'center', color: '#007AFF', fontSize: 14 }}>
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>

        {/* Demo Credentials */}
        <View
          style={{
            marginTop: 40,
            backgroundColor: '#f0f0f0',
            padding: 16,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 8 }}>
            Demo Credentials:
          </Text>
          <Text style={{ fontSize: 12, color: '#666' }}>Email: demo@test.com</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>Password: demo123</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default LoginScreen;
