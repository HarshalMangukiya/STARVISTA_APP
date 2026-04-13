import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Pressable,
  Alert,
  Linking,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { residentService } from '../services/residentService';
import { Resident } from '../types';
import { styles } from '../styles/styles';

interface ResidentsListScreenProps {
  route: any;
  navigation: any;
}

const ResidentsListScreen: React.FC<ResidentsListScreenProps> = ({ route, navigation }) => {
  const { propertyId, propertyName } = route.params;
  const [residents, setResidents] = useState<Resident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(false);

  // Toast State for Undo
  const [toast, setToast] = useState<{ visible: boolean; resident: Resident | null }>({ visible: false, resident: null });
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mark as Paid
  const handleMarkAsPaid = async (resident: Resident) => {
    // Optimistic UI Update
    setResidents(prev =>
      prev.map(r => (r.id === resident.id ? { ...r, paymentStatus: 'Paid' } : r))
    );

    // Show Toast
    setToast({ visible: true, resident });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ visible: false, resident: null });
    }, 4000);

    // Backend Update
    try {
      await residentService.updateResident(propertyId, resident.id, { paymentStatus: 'Paid' });
    } catch (error) {
      console.error('Error marking as paid:', error);
      Alert.alert('Error', 'Failed to update payment status on server');
    }
  };

  // Undo Mark as Paid
  const handleUndo = async () => {
    if (!toast.resident) return;
    const residentToUndo = toast.resident;

    // Hide Toast
    setToast({ visible: false, resident: null });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);

    // Revert Optimistic UI
    setResidents(prev =>
      prev.map(r => (r.id === residentToUndo.id ? { ...r, paymentStatus: residentToUndo.paymentStatus } : r))
    );

    // Revert Backend
    try {
      await residentService.updateResident(propertyId, residentToUndo.id, { paymentStatus: residentToUndo.paymentStatus });
    } catch (error) {
      console.error('Error undoing:', error);
      Alert.alert('Error', 'Failed to undo payment status on server');
    }
  };

  // Render Swipe Actions
  const renderRightActions = (progress: any, dragX: any) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.swipeAction}>
        <Animated.View
          style={[
            styles.swipeActionContent,
            {
              transform: [{ scale: trans }],
            },
          ]}
        >
          <Text style={styles.swipeActionText}>Mark as Paid</Text>
          <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
        </Animated.View>
      </View>
    );
  };

  // Fetch residents
  const fetchResidents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await residentService.fetchPropertyResidents(propertyId);
      setResidents(data);
    } catch (error) {
      console.error('Error fetching residents:', error);
      Alert.alert('Error', 'Failed to load residents');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useFocusEffect(
    useCallback(() => {
      fetchResidents();
    }, [fetchResidents])
  );

  // Filter residents based on search and tab
  const filteredResidents = useMemo(() => {
    let filtered = residents;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        r =>
          r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.mobileNumber.includes(searchQuery) ||
          r.emailId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (activeTab !== 'All') {
      filtered = filtered.filter(r => r.paymentStatus === activeTab);
    }

    return filtered;
  }, [residents, searchQuery, activeTab]);

  const handleCall = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() =>
      Alert.alert('Error', 'Unable to make call')
    );
  };

  const handleWhatsAppReminder = (resident: Resident) => {
    if (!resident.mobileNumber) {
      Alert.alert('Error', 'Phone number is missing');
      return;
    }
    
    // Ensure the phone number has a country code, e.g., +91, otherwise assume it
    let cleanNumber = resident.mobileNumber.replace(/\D/g, '');
    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber; // default to +91 if length is 10
    }
    
    // Format the date if possible
    let dueDateStr = 'your upcoming due date';
    if (resident.endDate) {
      try {
        const d = new Date(resident.endDate);
        if (!isNaN(d.getTime())) {
          dueDateStr = d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
        } else {
          dueDateStr = resident.endDate;
        }
      } catch (e) {
        dueDateStr = resident.endDate;
      }
    }

    const message = `Hello ${resident.studentName},

This is a reminder that your rent of ₹${resident.rentAmount} is due on ${dueDateStr}.

Please make the payment on time.

Thank you.`;

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback or warning
        Alert.alert(
          'WhatsApp Not Found',
          'WhatsApp does not seem to be installed. Redirecting to browser...',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open in Browser', onPress: () => Linking.openURL(url) }
          ]
        );
      }
    }).catch(err => {
      Alert.alert('Error', 'Unable to open WhatsApp');
    });
  };

  const renderResidentCard = ({ item }: { item: Resident }) => {
    const cardContent = (
      <Pressable
        onPress={() =>
          navigation.navigate('ResidentDetails', {
            residentId: item.id,
            propertyId: propertyId,
          })
        }
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View style={styles.residentCard}>
          <View style={styles.residentCardContent}>
            <View style={styles.residentAvatarContainer}>
              <Text style={styles.residentAvatar}>{item.profileImage || '👤'}</Text>
              {item.isOnline && <View style={styles.onlineIndicator} />}
            </View>

            <View style={styles.residentInfo}>
              <Text style={styles.residentName}>{item.studentName}</Text>
              <Text style={styles.residentPhone}>{item.mobileNumber}</Text>
              <Text style={styles.residentRoom}>
                Room {item.roomNumber} • {item.roomType}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => handleCall(item.mobileNumber)}
              style={styles.callButton}
            >
              <Text style={styles.callButtonText}>📞</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.residentFooter}>
            <Text style={styles.rentText}>₹{item.rentAmount}/month</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {item.paymentStatus === 'Upcoming' && (
                <TouchableOpacity
                  onPress={() => handleWhatsAppReminder(item)}
                  style={styles.whatsappButton}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                  <Text style={styles.whatsappButtonText}>Reminder</Text>
                </TouchableOpacity>
              )}
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.paymentStatus === 'Paid'
                        ? '#e8f5e9'
                        : item.paymentStatus === 'Pending'
                        ? '#fff3e0'
                        : '#f3e5f5',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color:
                        item.paymentStatus === 'Paid'
                          ? '#2e7d32'
                          : item.paymentStatus === 'Pending'
                          ? '#e65100'
                          : '#6a1b9a',
                    },
                  ]}
                >
                  {item.paymentStatus}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );

    if (item.paymentStatus === 'Pending' || item.paymentStatus === 'Upcoming') {
      return (
        <Swipeable
          renderRightActions={renderRightActions}
          onSwipeableOpen={(direction) => {
            if (direction === 'right') {
              handleMarkAsPaid(item);
            }
          }}
          friction={2}
          rightThreshold={80}
        >
          {cardContent}
        </Swipeable>
      );
    }

    return cardContent;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.residentListHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{propertyName}</Text>
          <Text style={styles.headerSubtitle}>
            Managing {residents.length} accommodations
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {['All', 'Paid', 'Upcoming', 'Pending'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab === 'All'
                ? `All (${residents.length})`
                : `${tab} (${residents.filter(r => r.paymentStatus === tab).length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Residents List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : filteredResidents.length > 0 ? (
        <FlatList
          data={filteredResidents}
          renderItem={renderResidentCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateEmoji}>👥</Text>
          <Text style={styles.emptyStateTitle}>No residents found</Text>
          <Text style={styles.emptyStateText}>
            {searchQuery ? 'Try adjusting your search' : 'Add your first resident to get started'}
          </Text>
        </View>
      )}

      {/* Toast Notification */}
      {toast.visible && toast.resident && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText} numberOfLines={1}>
            Marked {toast.resident.studentName} as paid
          </Text>
          <TouchableOpacity onPress={handleUndo} style={styles.undoButton}>
            <Text style={styles.undoText}>UNDO</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('AddResident', { propertyId })}
        style={styles.fab}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ResidentsListScreen;
