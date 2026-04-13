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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
      const errorMessage = error.message || 'Failed to create account';
      Alert.alert('Sign Up Error', errorMessage);
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
      const errorMessage = error.message || 'Failed to log in';
      Alert.alert('Sign In Error', errorMessage);
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
