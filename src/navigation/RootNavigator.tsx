import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import DashboardScreen from '../screens/DashboardScreen';
import AddPropertyScreen from '../screens/AddPropertyScreen';
import EditPropertyScreen from '../screens/EditPropertyScreen';
import ResidentsListScreen from '../screens/ResidentsListScreen';
import AddResidentScreen from '../screens/AddResidentScreen';
import ResidentDetailsScreen from '../screens/ResidentDetailsScreen';
import ProfileScreen from '../screens/AuthScreens/ProfileScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DashboardStackScreen = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="DashboardList" component={DashboardScreen} />
      <Stack.Screen
        name="AddProperty"
        component={AddPropertyScreen}
      />
      <Stack.Screen
        name="EditProperty"
        component={EditPropertyScreen}
      />
      <Stack.Screen
        name="ResidentsList"
        component={ResidentsListScreen}
      />
      <Stack.Screen
        name="AddResident"
        component={AddResidentScreen}
      />
      <Stack.Screen
        name="ResidentDetails"
        component={ResidentDetailsScreen}
      />
    </Stack.Navigator>
  );
};

const ProfileStackScreen = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
      />
      <Stack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
      />
    </Stack.Navigator>
  );
};

export const RootNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarLabel: route.name === 'Dashboard' ? 'Properties' : 'Profile',
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#95a5a6',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStackScreen}
        options={{
          tabBarLabel: 'Properties',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default RootNavigator;
