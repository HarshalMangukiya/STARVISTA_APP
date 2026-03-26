import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { onAuthStateChanged } from '@react-native-firebase/auth';
import { auth } from './src/config/firebase';
import RootNavigator from './src/navigation/RootNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const subscriber = onAuthStateChanged(auth, (authUser) => {
        if (authUser) {
          setUser(authUser);
          console.log('✓ User logged in:', authUser.uid);
        } else {
          setUser(null);
          console.log('✓ User logged out');
        }
        setInitializing(false);
      });

      return subscriber;
    } catch (err: any) {
      console.error('✗ Auth error:', err);
      setError(err?.message || 'Firebase initialization failed');
      setInitializing(false);
    }
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, color: '#666' }}>Initializing...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ff3b30', marginBottom: 10 }}>
          Firebase Configuration Error
        </Text>
        <Text style={{ color: '#666', marginBottom: 20, textAlign: 'center' }}>
          {error}
        </Text>
        <Text style={{ color: '#999', fontSize: 12, textAlign: 'center' }}>
          Please make sure:{'\n'}
          1. google-services.json is in android/app/{'\n'}
          2. Firebase is set up in your project{'\n'}
          3. You've run "npm install"
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {user ? <RootNavigator /> : <AuthNavigator />}
    </GestureHandlerRootView>
  );
};

export default App;