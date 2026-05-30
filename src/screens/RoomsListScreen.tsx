import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { roomService } from '../services/roomService';
import { Room, Resident } from '../types';
import styles from '../styles/styles';

interface RoomsListScreenProps {
  route: any;
  navigation: any;
}

type RoomWithResidents = Room & { residents: Resident[] };

const RoomsListScreen: React.FC<RoomsListScreenProps> = ({ route, navigation }) => {
  const { propertyId, propertyName } = route.params;
  const insets = useSafeAreaInsets();
  const [rooms, setRooms] = useState<RoomWithResidents[]>([]);
  const [loading, setLoading] = useState(true);

  // Cache management - track last fetch time to avoid unnecessary refetches
  const lastFetchTimeRef = useRef<number | null>(null);
  const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  // Add Room Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newRoomNo, setNewRoomNo] = useState('');
  const [newCapacity, setNewCapacity] = useState('1');
  const [newRent, setNewRent] = useState('');
  const [savingRoom, setSavingRoom] = useState(false);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await roomService.fetchRoomsWithResidents(propertyId);
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      Alert.alert('Error', 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const timeSinceLastFetch = lastFetchTimeRef.current ? now - lastFetchTimeRef.current : null;

      // Only fetch if data doesn't exist or cache expired (older than 5 minutes)
      if (!timeSinceLastFetch || timeSinceLastFetch > CACHE_DURATION_MS) {
        fetchRooms();
        lastFetchTimeRef.current = now;
      }
      // If cache is fresh, data remains displayed without refetch
    }, [fetchRooms])
  );

  // Force refresh function for manual refresh or after add/delete room
  const forceFetchRooms = useCallback(async () => {
    await fetchRooms();
    lastFetchTimeRef.current = Date.now();
  }, [fetchRooms]);

  const handleAddRoom = async () => {
    if (!newRoomNo.trim()) {
      Alert.alert('Validation Error', 'Please enter room number');
      return;
    }
    if (!newCapacity.trim() || isNaN(Number(newCapacity)) || Number(newCapacity) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid positive capacity');
      return;
    }
    if (!newRent.trim() || isNaN(Number(newRent)) || Number(newRent) < 0) {
      Alert.alert('Validation Error', 'Please enter a valid monthly rent');
      return;
    }

    setSavingRoom(true);
    try {
      await roomService.addRoom(propertyId, {
        room_no: newRoomNo.trim(),
        capacity: Number(newCapacity),
        monthly_rent: Number(newRent),
      });
      setAddModalVisible(false);
      setNewRoomNo('');
      setNewCapacity('1');
      setNewRent('');
      forceFetchRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      Alert.alert('Error', 'Failed to save room. Please try again.');
    } finally {
      setSavingRoom(false);
    }
  };

  const getOccupancyBadge = (occupied: number, capacity: number) => {
    if (occupied === 0) {
      return (
        <View style={[localStyles.badge, { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }]}>
          <Text style={[localStyles.badgeText, { color: '#64748b' }]}>Vacant</Text>
        </View>
      );
    }
    if (occupied < capacity) {
      return (
        <View style={[localStyles.badge, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
          <Text style={[localStyles.badgeText, { color: '#059669' }]}>Available ({occupied}/{capacity})</Text>
        </View>
      );
    }
    if (occupied === capacity) {
      return (
        <View style={[localStyles.badge, { backgroundColor: '#fff7ed', borderColor: '#ffedd5' }]}>
          <Text style={[localStyles.badgeText, { color: '#d97706' }]}>Full ({occupied}/{capacity})</Text>
        </View>
      );
    }
    return (
      <View style={[localStyles.badge, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
        <Text style={[localStyles.badgeText, { color: '#dc2626' }]}>Overfilled ({occupied}/{capacity})</Text>
      </View>
    );
  };

  const formatDateLabel = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getResidentColor = (endDateString: string) => {
    if (!endDateString) return '#1e293b';
    const endDate = new Date(endDateString);
    endDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return '#dc2626'; // Red for today or overdue
    } else if (diffDays <= 7) {
      return '#d97706'; // Dark amber/orange for <= 7 days
    } else {
      return '#16a34a'; // Green for > 7 days
    }
  };

  const renderRoomCard = ({ item }: { item: RoomWithResidents }) => {
    return (
      <TouchableOpacity
        style={localStyles.roomCard}
        onPress={() =>
          navigation.navigate('RoomDetails', {
            roomId: item.id,
            propertyId: propertyId,
            propertyName: propertyName,
            room: item,
            residents: item.residents,
          })
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="home-outline" size={22} color="#6366f1" style={{ marginRight: 8 }} />
          <Text style={localStyles.roomNoTitle}>{item.room_no}</Text>
        </View>

        <View style={localStyles.residentsSection}>
          {item.residents && item.residents.length > 0 ? (
            item.residents.map((res) => {
              const statusColor = getResidentColor(res.end_date);
              return (
                <View key={res.id} style={localStyles.residentRow}>
                  <Text style={[localStyles.residentNameText, { color: statusColor }]}>{res.name}</Text>
                  {res.end_date ? (
                    <Text style={[localStyles.residentDateText, { color: statusColor }]}>
                      {formatDateLabel(res.end_date)}
                    </Text>
                  ) : null}
                </View>
              );
            })
          ) : (
            <Text style={localStyles.noResidentsText}>No residents checked in</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Skeleton Loader Card Component
  const SkeletonCard = () => (
    <View style={[localStyles.roomCard, { opacity: 0.7 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={localStyles.skeletonIcon} />
        <View style={localStyles.skeletonTitle} />
      </View>

      <View style={localStyles.residentsSection}>
        <View style={localStyles.skeletonLine} />
        <View style={[localStyles.skeletonLine, { marginTop: 8 }]} />
        <View style={[localStyles.skeletonLine, { marginTop: 8, width: '70%' }]} />
      </View>
    </View>
  );

  // Generate skeleton array for initial load (6 skeletons)
  const skeletonData = Array.from({ length: 6 }, (_, i) => ({ id: `skeleton-${i}` }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.residentListHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{propertyName}</Text>
          <Text style={styles.headerSubtitle}>
            Managing {rooms.length} rooms
          </Text>
        </View>
      </View>

      {/* Rooms List */}
      {loading && rooms.length === 0 ? (
        <FlatList
          data={skeletonData}
          renderItem={() => <SkeletonCard />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      ) : rooms.length > 0 ? (
        <FlatList
          data={rooms}
          renderItem={renderRoomCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="home-outline" size={72} color="#ddd" />
          <Text style={[styles.emptyStateEmoji, { color: '#1a1a1a', marginTop: 16 }]}>No rooms found</Text>
          <Text style={styles.emptyStateText}>
            Add rooms to this property using the button below.
          </Text>
        </View>
      )}

      {/* FAB to Add Room */}
      <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Add Room Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide" onRequestClose={() => setAddModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAddModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[styles.modalContent, { padding: 20, maxHeight: 500 }]}
            >
              <View style={localStyles.modalHeader}>
                <Text style={styles.sectionTitle}>Add New Room</Text>
                <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Room Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 101, A-1"
                  placeholderTextColor="#ccc"
                  value={newRoomNo}
                  onChangeText={setNewRoomNo}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Capacity (Beds) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 1, 2, 3"
                  placeholderTextColor="#ccc"
                  keyboardType="numeric"
                  value={newCapacity}
                  onChangeText={setNewCapacity}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Monthly Rent (₹) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 15000"
                  placeholderTextColor="#ccc"
                  keyboardType="numeric"
                  value={newRent}
                  onChangeText={setNewRent}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, paddingBottom: 20 }}>
                <TouchableOpacity
                  style={[styles.button, styles.discardButton]}
                  onPress={() => setAddModalVisible(false)}
                  disabled={savingRoom}
                >
                  <Text style={styles.discardButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#6366f1' }]}
                  onPress={handleAddRoom}
                  disabled={savingRoom}
                >
                  {savingRoom ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Add Room</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const localStyles = StyleSheet.create({
  roomCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomNoTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  roomDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  roomDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  residentsSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
  },
  residentsHeader: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  residentsListText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  residentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  residentNameText: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '600',
  },
  residentDateText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  noResidentsText: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  // Skeleton Loader Styles
  skeletonIcon: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  skeletonTitle: {
    width: 80,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
    flex: 1,
  },
  skeletonLine: {
    height: 16,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
});

export default RoomsListScreen;
