import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../config/firebase';
import { sendPasswordResetEmail } from '@react-native-firebase/auth';

const ProfileScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          onPress: () => { },
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            setIsLoading(true);
            try {
              await logout();
              // Navigation is handled by RootNavigator based on isSignedIn state
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleChangePassword = () => {
    if (!user?.email) return;

    Alert.alert(
      'Change Password',
      `Send a password reset link to ${user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            try {
              setIsLoading(true);
              await sendPasswordResetEmail(auth, user.email!);
              Alert.alert('Success', 'Password reset email sent! Please check your inbox and SPAM folder.');
            } catch (error: any) {
              console.error('Password reset error:', error);
              Alert.alert('Error', 'Failed to send reset link. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.statusBarShield, { height: insets.top, backgroundColor: '#fff' }]} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.headerSection, { paddingTop: insets.top + 10 }]}>
          <Text style={styles.headerTitle}>My Account</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Icon name="account-outline" size={56} color="#7c3aed" />
              </View>
            )}
          </View>

          {/* User Info */}
          <View style={styles.userInfoContainer}>
            <Text style={styles.userName}>{user?.email || 'User'}</Text>
            <Text style={styles.userRole}>{'Property Owner'}</Text>
          </View>
        </View>


        {/* Account Identity Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="shield-check" size={20} color="#7c3aed" />
            <Text style={styles.sectionTitle}>Account Identity</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Icon name="email" size={18} color="#95a5a6" />
                <Text style={styles.infoLabel}>Email Address</Text>
              </View>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
            <View style={styles.divider} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="lightning-bolt" size={20} color="#7c3aed" />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleChangePassword}
            disabled={isLoading}
          >
            <View style={styles.actionIconContainer}>
              <Icon name="lock-reset" size={20} color="#7c3aed" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Change Password</Text>
              <Text style={styles.actionDescription}>Update your password</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#bdc3c7" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('HelpSupport')}
          >
            <View style={styles.actionIconContainer}>
              <Icon name="help-circle-outline" size={20} color="#7c3aed" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Help & Support</Text>
              <Text style={styles.actionDescription}>Get help and support</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#bdc3c7" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, isLoading && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Icon name="logout" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>
            {isLoading ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>STARVISTA • Secure Property Management</Text>
          <Text style={styles.footerVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statusBarShield: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a202c',
  },
  profileCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0e6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#7c3aed',
  },
  userInfoContainer: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a202c',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
    marginLeft: 10,
  },
  infoValue: {
    fontSize: 13,
    color: '#2c3e50',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  infoValueSuccess: {
    fontSize: 13,
    color: '#27ae60',
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0e6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
    color: '#95a5a6',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    marginHorizontal: 16,
    marginVertical: 20,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerText: {
    fontSize: 12,
    color: '#95a5a6',
    fontWeight: '600',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 11,
    color: '#bdc3c7',
  },
});

export default ProfileScreen;
