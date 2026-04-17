import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { residentService } from '../services/residentService';
import { Resident } from '../types';
import { styles } from '../styles/styles';
import {
  categorizeResidents,
  CategorizedResident,
  ResidentCategory,
  getCategoryLabel,
  getCategoryColor,
  formatCheckoutDays,
} from '../utils/residentCategorization';

interface ResidentsListScreenProps {
  route: any;
  navigation: any;
}

const ResidentsListScreen: React.FC<ResidentsListScreenProps> = ({ route, navigation }) => {
  const { propertyId, propertyName } = route.params;
  const [residents, setResidents] = useState<Resident[]>([]);
  const [categorizedResidents, setCategorizedResidents] = useState<CategorizedResident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'Pending' | 'Upcoming' | 'Paid' | 'All'>('Pending');
  const [loading, setLoading] = useState(false);

  // Renewal Modal State
  const [renewalModalVisible, setRenewalModalVisible] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [newStartDate, setNewStartDate] = useState(new Date());
  const [newEndDate, setNewEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dailyRefreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Categorize residents automatically on change
  useEffect(() => {
    const { all } = categorizeResidents(residents);
    setCategorizedResidents(all);
  }, [residents]);

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

  // Set up daily refresh at midnight
  useEffect(() => {
    const setupDailyRefresh = () => {
      // Calculate time until next midnight
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const timeUntilMidnight = tomorrow.getTime() - now.getTime();

      // Schedule first refresh at midnight
      const timeoutId = setTimeout(() => {
        // Re-fetch and categorize residents at midnight
        fetchResidents();

        // Then refresh every 24 hours
        if (dailyRefreshIntervalRef.current) {
          clearInterval(dailyRefreshIntervalRef.current);
        }
        dailyRefreshIntervalRef.current = setInterval(() => {
          fetchResidents();
        }, 24 * 60 * 60 * 1000); // 24 hours
      }, timeUntilMidnight);

      return () => clearTimeout(timeoutId);
    };

    const cleanup = setupDailyRefresh();

    return () => {
      cleanup();
      if (dailyRefreshIntervalRef.current) {
        clearInterval(dailyRefreshIntervalRef.current);
      }
    };
  }, [fetchResidents]);

  // Mark as Paid
  const handleMarkAsPaid = async (resident: Resident) => {
    setSelectedResident(resident);
    setRenewalModalVisible(true);
    
    // Default to today for start date and 1 month from today for end date
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    setNewStartDate(today);
    setNewEndDate(nextMonth);
  };

  const handleConfirmRenewal = async () => {
    if (!selectedResident) return;

    try {
      setLoading(true);
      await residentService.updateResident(propertyId, selectedResident.id, {
        startDate: newStartDate.toISOString().split('T')[0],
        endDate: newEndDate.toISOString().split('T')[0],
      });
      
      setRenewalModalVisible(false);
      fetchResidents();
      Alert.alert('Success', 'Resident renewed successfully');
    } catch (error) {
      console.error('Error renewing resident:', error);
      Alert.alert('Error', 'Failed to renew resident');
    } finally {
      setLoading(false);
    }
  };

  // Undo logic removed as it was tied to isPaid toggle

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

  useFocusEffect(
    useCallback(() => {
      fetchResidents();
    }, [fetchResidents])
  );

  // Filter residents based on search and category
  const filteredResidents = useMemo(() => {
    let filtered = categorizedResidents;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        r =>
          r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.mobileNumber.includes(searchQuery) ||
          r.emailId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (activeTab !== 'All') {
      filtered = filtered.filter(r => r.category === activeTab);
    }

    // Sort by days remaining (ascending)
    return [...filtered].sort((a, b) => (a.daysUntilCheckOut || 0) - (b.daysUntilCheckOut || 0));
  }, [categorizedResidents, searchQuery, activeTab]);

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

  const renderResidentCard = ({ item }: { item: CategorizedResident }) => {
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
              {/* Category and Days Display */}
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.categoryStatusLabel, { color: getCategoryColor(item.category) }]}>
                  {getCategoryLabel(item.category)}
                </Text>
                {item.daysUntilCheckOut !== undefined && (
                  <Text style={[styles.categoryStatusValue, { color: '#666' }]}>
                    {item.category === 'Upcoming'
                      ? `📅 Checkout: ${formatCheckoutDays(item.daysUntilCheckOut)}`
                      : formatCheckoutDays(item.daysUntilCheckOut)}
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleCall(item.mobileNumber)}
              style={styles.callButton}
            >
              <Ionicons name="call" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.residentFooter}>
            <Text style={styles.rentText}>₹{item.rentAmount}/month</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {item.category === 'Upcoming' && (
                <TouchableOpacity
                  onPress={() => handleWhatsAppReminder(item)}
                  style={styles.whatsappButton}
                >
                  <Ionicons name="logo-whatsapp" size={14} color="#fff" />
                  <Text style={styles.whatsappButtonText}>Reminder</Text>
                </TouchableOpacity>
              )}
              {/* Category Badge */}
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: item.category === 'Paid'
                      ? '#10b981'
                      : item.category === 'Upcoming'
                        ? '#f59e0b'
                        : '#ef4444',
                    borderColor: item.category === 'Paid'
                      ? '#059669'
                      : item.category === 'Upcoming'
                        ? '#d97706'
                        : '#dc2626',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: '#fff',
                    },
                  ]}
                >
                  {item.category === 'Paid' ? '✓ Safe' : item.category === 'Upcoming' ? '⏰ Due Soon' : '⚠ Overdue'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );

    if (item.category === 'Pending' || item.category === 'Upcoming') {
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
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{propertyName}</Text>
          <Text style={styles.headerSubtitle}>
            Managing {categorizedResidents.length} residents
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
        <Ionicons name="search" size={18} color="#6366f1" style={{ marginRight: 8 }} />
      </View>

      {/* Tabs */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {(['Pending', 'Upcoming', 'Paid', 'All'] as const).map((tab) => {
            let count = 0;
            if (tab === 'All') {
              count = categorizedResidents.length;
            } else {
              count = categorizedResidents.filter(r => r.category === tab).length;
            }

            return (
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
                  {tab} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
          <Ionicons name="people" size={72} color="#ddd" />
          <Text style={[styles.emptyStateEmoji, { color: '#1a1a1a', marginTop: 16 }]}>No residents found</Text>
          <Text style={styles.emptyStateText}>
            {searchQuery ? 'Try adjusting your search' : 'Add your first resident to get started'}
          </Text>
        </View>
      )}

      {/* Renewal Modal */}
      <Modal
        visible={renewalModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRenewalModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setRenewalModalVisible(false)}
        >
          <View style={[styles.modalContent, { height: 450 }]}>
            <View style={{ padding: 20 }}>
              <Text style={[styles.sectionTitle, { textAlign: 'center', marginBottom: 20 }]}>
                Renew Stay for {selectedResident?.studentName}
              </Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>New Start Date</Text>
                <TouchableOpacity 
                  style={styles.dateButton} 
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text>{newStartDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>New End Date</Text>
                <TouchableOpacity 
                  style={styles.dateButton} 
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text>{newEndDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 30, gap: 10 }}>
                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={handleConfirmRenewal}
                >
                  <Text style={styles.saveButtonText}>Confirm Renewal</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveButton, { backgroundColor: '#ccc' }]} 
                  onPress={() => setRenewalModalVisible(false)}
                >
                  <Text style={styles.saveButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {showStartDatePicker && (
          <DateTimePicker
            value={newStartDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowStartDatePicker(false);
              if (date) setNewStartDate(date);
            }}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={newEndDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowEndDatePicker(false);
              if (date) setNewEndDate(date);
            }}
          />
        )}
      </Modal>

      {/* Toast removed */}

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('AddResident', { propertyId })}
        style={styles.fab}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default ResidentsListScreen;
