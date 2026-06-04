import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

const HelpSupportScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  const developers = [
    {
      name: 'Harshal Mangukiya',
      role: 'Lead Developer',
      linkedin: 'https://www.linkedin.com/in/harshal-mangukiya-79369434a',
      phone: '8160868146',
      bio: 'Visionary developer passionate about creating seamless property management experiences.',
      icon: 'account-star',
    },
    {
      name: 'Piyush Thummar',
      role: 'Lead Developer',
      linkedin: 'https://www.linkedin.com/in/piyushjt',
      phone: '9601692507',
      bio: 'Expert in mobile architecture and user-centric design paradigms.',
      icon: 'account-tie',
    },
  ];

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('An error occurred', err));
  };

  const handleCall = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch((err) => console.error('An error occurred', err));
  };

  const renderDeveloperCard = (dev: any, index: number) => (
    <View key={index} style={styles.devCard}>
      <View style={styles.devHeader}>
        <View style={styles.devIconContainer}>
          <Icon name={dev.icon} size={32} color="#7c3aed" />
        </View>
        <View style={styles.devTitleContainer}>
          <Text style={styles.devName}>{dev.name}</Text>
          <Text style={styles.devRole}>{dev.role}</Text>
        </View>
      </View>
      <Text style={styles.devBio}>{dev.bio}</Text>

      <View style={styles.contactRow}>
        <TouchableOpacity
          style={styles.contactIconCircle}
          onPress={() => handleOpenLink(dev.linkedin)}
        >
          <Icon name="linkedin" size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.contactIconCircle, { backgroundColor: '#10b981' }]}
          onPress={() => handleCall(dev.phone)}
        >
          <Icon name="phone" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.statusBarShield, { height: insets.top }]} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.introSection}>
          <View style={styles.helpIconContainer}>
            <Icon name="rocket-launch" size={48} color="#7c3aed" />
          </View>
          <Text style={styles.introTitle}>Meet the Developers</Text>
          <Text style={styles.introSubtitle}>
            Dedicated to simplifying property management for owners and organizations.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>The Creative Team</Text>
          {developers.map((dev, index) => renderDeveloperCard(dev, index))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>STARVISTA App v2.0.0</Text>
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
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    zIndex: 900,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  introSection: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  helpIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    padding: 16,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  devCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  devHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  devIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f5f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  devTitleContainer: {
    flex: 1,
  },
  devName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  devRole: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
  },
  devBio: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIconCircle: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0077b5', // LinkedIn Blue
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  contactLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    margin: 16,
    padding: 20,
    borderRadius: 24,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  supportTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  supportTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  supportSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  contactButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  contactButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7c3aed',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  copyright: {
    fontSize: 11,
    color: '#cbd5e1',
    marginTop: 4,
  },
});

export default HelpSupportScreen;
