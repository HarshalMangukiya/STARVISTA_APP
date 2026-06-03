import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  FlatList,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Timestamp } from '@react-native-firebase/firestore';
import { roomService } from '../services/roomService';
import { Room, Resident } from '../types';
import styles from '../styles/styles';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft: () => void;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({ children, onSwipeLeft }) => {
  const pan = React.useRef(new Animated.ValueXY()).current;
  const [isActionTriggered, setIsActionTriggered] = React.useState(false);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && gestureState.dx < -10;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx < 0 && !isActionTriggered) {
          pan.setValue({ x: Math.max(gestureState.dx, -120), y: 0 });
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -100 && !isActionTriggered) {
          setIsActionTriggered(true);
          onSwipeLeft();
          // Reset after action is triggered
          setTimeout(() => {
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
            }).start(() => {
              setIsActionTriggered(false);
            });
          }, 200);
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  React.useEffect(() => {
    // Reset card position if it was swiped but modal closed
    if (!isActionTriggered) {
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
      }).start();
    }
  }, [isActionTriggered]);

  return (
    <View style={localStyles.swipeContainer}>
      <View style={localStyles.swipeUnderlay}>
        <Ionicons name="card" size={18} color="#fff" />
        <Text style={localStyles.swipeUnderlayText}>Update Payment</Text>
      </View>
      <Animated.View
        style={{
          transform: [{ translateX: pan.x }],
        }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

interface RoomDetailsScreenProps {
  route: any;
  navigation: any;
}

const RoomDetailsScreen: React.FC<RoomDetailsScreenProps> = ({ route, navigation }) => {
  const { roomId, propertyId, name } = route.params;
  const insets = useSafeAreaInsets();

  const [room, setRoom] = useState<Room | null>(route.params?.room ? {
    id: route.params.room.id,
    room_no: route.params.room.room_no,
    capacity: route.params.room.capacity,
    monthly_rent: route.params.room.monthly_rent,
    propertyId: route.params.room.propertyId,
  } : null);
  const [residents, setResidents] = useState<Resident[]>(route.params?.residents || []);
  const [loading, setLoading] = useState(!route.params?.room);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Room Modal State
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [roomNo, setRoomNo] = useState(route.params?.room?.room_no || '');
  const [roomCapacity, setRoomCapacity] = useState(route.params?.room?.capacity?.toString() || '');
  const [roomRent, setRoomRent] = useState(route.params?.room?.monthly_rent?.toString() || '');

  // Resident Modal State (Shared for Add & Edit)
  const [residentModalVisible, setResidentModalVisible] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [resName, setResName] = useState('');
  const [resGender, setResGender] = useState('Male');
  const [resPhone, setResPhone] = useState('');
  const [resStartDate, setResStartDate] = useState('');
  const [resEndDate, setResEndDate] = useState('');
  const [resRemarks, setResRemarks] = useState('');

  // Date picker visibility
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);

  const genders = ['Male', 'Female', 'Other'];

  // Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedResidentForPayment, setSelectedResidentForPayment] = useState<Resident | null>(null);
  const [paymentStartDate, setPaymentStartDate] = useState('');
  const [paymentEndDate, setPaymentEndDate] = useState('');
  const [showPaymentStartDatePicker, setShowPaymentStartDatePicker] = useState(false);
  const [showPaymentEndDatePicker, setShowPaymentEndDatePicker] = useState(false);
  const [quickSelectOption, setQuickSelectOption] = useState<'1' | '3' | '6' | 'custom' | null>(null);

  const patchResidentLocally = useCallback(
    (residentId: string, updates: Partial<Resident>) => {
      setResidents((previousResidents) =>
        previousResidents.map((resident) =>
          resident.id === residentId
            ? {
              ...resident,
              ...updates,
              room_no: updates.room_no ?? room?.room_no ?? resident.room_no,
              monthly_rent: updates.monthly_rent ?? room?.monthly_rent ?? resident.monthly_rent,
              roomNumber: updates.room_no ?? room?.room_no ?? resident.roomNumber,
              rentAmount: updates.monthly_rent ?? room?.monthly_rent ?? resident.rentAmount,
              studentName: updates.name ?? resident.studentName ?? resident.name,
              emailId: updates.email ?? resident.emailId ?? resident.email,
              mobileNumber: updates.phone ?? resident.mobileNumber ?? resident.phone,
              startDate: updates.start_date ?? resident.startDate ?? resident.start_date,
              endDate: updates.end_date ?? resident.endDate ?? resident.end_date,
              createdAt: resident.createdAt ?? resident.created_at,
            }
            : resident
        )
      );
    },
    [room]
  );

  const addResidentLocally = useCallback(
    (residentData: {
      name: string;
      gender: string;
      phone: string;
      start_date: string;
      end_date: string;
      remarks?: string;
    }) => {
      const now = Timestamp.now();
      const optimisticResident: Resident = {
        id: `temp-${Date.now()}`,
        name: residentData.name,
        gender: residentData.gender,
        email: '',
        phone: residentData.phone,
        room_no: room?.room_no || '',
        monthly_rent: room?.monthly_rent || 0,
        start_date: residentData.start_date,
        end_date: residentData.end_date,
        remarks: residentData.remarks || '',
        propertyId,
        created_at: now,
        studentName: residentData.name,
        emailId: '',
        mobileNumber: residentData.phone,
        roomNumber: room?.room_no || '',
        rentAmount: room?.monthly_rent || 0,
        startDate: residentData.start_date,
        endDate: residentData.end_date,
        createdAt: now,
      };

      setResidents((previousResidents) => [optimisticResident, ...previousResidents]);
    },
    [propertyId, room]
  );

  const removeResidentLocally = useCallback((residentId: string) => {
    setResidents((previousResidents) => previousResidents.filter((resident) => resident.id !== residentId));
  }, []);

  const loadData = useCallback(async (forceRefresh: boolean = false) => {
    if (!route.params?.room || forceRefresh) {
      setLoading(true);
    }
    try {
      // Check if room data is passed via route params (from RoomsListScreen)
      if (!forceRefresh && route.params?.room && route.params?.residents) {
        // Use passed data directly - no need to fetch
        setRoom({
          id: route.params.room.id,
          room_no: route.params.room.room_no,
          capacity: route.params.room.capacity,
          monthly_rent: route.params.room.monthly_rent,
          propertyId: route.params.room.propertyId,
        });
        setResidents(route.params.residents);

        // Prep fields for edit room
        setRoomNo(route.params.room.room_no);
        setRoomCapacity(route.params.room.capacity.toString());
        setRoomRent(route.params.room.monthly_rent.toString());
      } else {
        // Fallback to fetching if no data passed (for direct navigation)
        const allRooms = await roomService.fetchRoomsWithResidents(propertyId);
        const currentRoom = allRooms.find((r) => r.id === roomId);
        if (currentRoom) {
          setRoom({
            id: currentRoom.id,
            room_no: currentRoom.room_no,
            capacity: currentRoom.capacity,
            monthly_rent: currentRoom.monthly_rent,
            propertyId: currentRoom.propertyId,
          });
          setResidents(currentRoom.residents);

          // Prep fields for edit room
          setRoomNo(currentRoom.room_no);
          setRoomCapacity(currentRoom.capacity.toString());
          setRoomRent(currentRoom.monthly_rent.toString());
        } else {
          Alert.alert('Error', 'Room not found');
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('Error loading room details:', error);
      Alert.alert('Error', 'Failed to load room details');
    } finally {
      setLoading(false);
    }
  }, [propertyId, roomId, navigation, route.params]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Room Updates
  const handleUpdateRoom = async () => {
    if (!roomNo.trim()) {
      Alert.alert('Validation Error', 'Room number is required');
      return;
    }
    if (!roomCapacity.trim() || isNaN(Number(roomCapacity)) || Number(roomCapacity) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid room capacity');
      return;
    }
    if (!roomRent.trim() || isNaN(Number(roomRent)) || Number(roomRent) < 0) {
      Alert.alert('Validation Error', 'Please enter a valid monthly rent');
      return;
    }

    setActionLoading(true);
    try {
      await roomService.updateRoom(propertyId, roomId, {
        room_no: roomNo.trim(),
        capacity: Number(roomCapacity),
        monthly_rent: Number(roomRent),
      });
      setRoomModalVisible(false);
      loadData(true);
      Alert.alert('Success', 'Room details updated successfully');
    } catch (error) {
      console.error('Error updating room:', error);
      Alert.alert('Error', 'Failed to update room details');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Room Deletion
  const handleDeleteRoom = () => {
    if (residents.length > 0) {
      Alert.alert(
        'Cannot Delete Room',
        'This room has checked-in residents. Please remove or reassign all residents before deleting the room.'
      );
      return;
    }

    Alert.alert(
      'Delete Room',
      'Are you sure you want to delete this room? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await roomService.deleteRoom(propertyId, roomId);
              Alert.alert('Success', 'Room deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting room:', error);
              Alert.alert('Error', 'Failed to delete room');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Open modal to update payment
  const handleOpenPaymentModal = (resident: Resident) => {
    setSelectedResidentForPayment(resident);
    setPaymentStartDate(resident.end_date || resident.start_date);
    setPaymentEndDate('');
    setQuickSelectOption(null);
    setPaymentModalVisible(true);
  };

  // Quick Select handler
  const handleQuickSelect = (months: number) => {
    if (months === -1) {
      setQuickSelectOption('custom');
      return;
    }
    setQuickSelectOption(months === 1 ? '1' : months === 3 ? '3' : '6');
    const start = paymentStartDate ? new Date(paymentStartDate) : new Date();
    if (!isNaN(start.getTime())) {
      const newEnd = new Date(start);
      newEnd.setMonth(newEnd.getMonth() + months);
      setPaymentEndDate(newEnd.toISOString().split('T')[0]);
    }
  };

  // Save updated payment dates
  const handleUpdatePayment = async () => {
    if (!selectedResidentForPayment) return;
    if (!paymentStartDate) {
      Alert.alert('Validation Error', 'Please select start date');
      return;
    }
    if (!paymentEndDate) {
      Alert.alert('Validation Error', 'Please select end date');
      return;
    }

    setActionLoading(true);
    try {
      await roomService.updateResidentInRoom(
        propertyId,
        roomId,
        selectedResidentForPayment.id,
        {
          start_date: paymentStartDate,
          end_date: paymentEndDate,
          remarks: '',
        }
      );
      setPaymentModalVisible(false);
      patchResidentLocally(selectedResidentForPayment.id, {
        start_date: paymentStartDate,
        end_date: paymentEndDate,
        remarks: '',
      });
      Alert.alert('Success', 'Payment dates updated successfully');
    } catch (error) {
      console.error('Error updating payment dates:', error);
      Alert.alert('Error', 'Failed to update payment dates');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to format date for display (DD/MM/YYYY)
  const displayDateFormat = (dateStr: string): string => {
    if (!dateStr) return 'dd/mm/yyyy';
    const [yyyy, mm, dd] = dateStr.split('-');
    return `${dd}/${mm}/${yyyy}`;
  };

  // Open modal to add resident
  const handleOpenAddResident = () => {
    if (room && residents.length >= room.capacity) {
      Alert.alert('Room Full', 'This room is already at full capacity. Increase the capacity to add more residents.');
      return;
    }
    setEditingResident(null);
    setResName('');
    setResGender('Male');
    setResPhone('');

    // Set default dates: check-in is today, check-out is 1 month from now
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    setResStartDate(today.toISOString().split('T')[0]);
    setResEndDate(nextMonth.toISOString().split('T')[0]);
    setResRemarks('');
    setResidentModalVisible(true);
  };

  // Open modal to edit resident
  const handleOpenEditResident = (resident: Resident) => {
    setEditingResident(resident);
    setResName(resident.name);
    setResGender(resident.gender || 'Male');
    setResPhone(resident.phone);
    // For payment tracking, carry the previous checkout forward as the new check-in.
    // Leave checkout blank so the user can choose the next billing end date manually.
    setResStartDate(resident.end_date || resident.start_date);
    setResEndDate('');
    setResRemarks(resident.remarks || '');
    setResidentModalVisible(true);
  };

  // Save Resident (Add or Edit)
  const handleSaveResident = async () => {
    if (!resName.trim()) {
      Alert.alert('Validation Error', 'Please enter resident name');
      return;
    }
    if (resPhone.trim() && resPhone.replace(/\D/g, '').length < 8) {
      Alert.alert('Validation Error', 'Please enter a valid mobile number');
      return;
    }
    if (!resStartDate) {
      Alert.alert('Validation Error', 'Please select a check-in start date');
      return;
    }
    if (!resEndDate) {
      Alert.alert('Validation Error', 'Please select a check-out end date');
      return;
    }

    setActionLoading(true);
    try {
      const data = {
        name: resName.trim(),
        gender: resGender,
        phone: resPhone.trim(),
        start_date: resStartDate,
        end_date: resEndDate,
        remarks: resRemarks.trim(),
      };

      if (editingResident) {
        await roomService.updateResidentInRoom(propertyId, roomId, editingResident.id, data);
        patchResidentLocally(editingResident.id, data);
        Alert.alert('Success', 'Resident details updated successfully');
      } else {
        await roomService.addResidentToRoom(propertyId, roomId, data);
        addResidentLocally(data);
        Alert.alert('Success', 'Resident onboarded successfully');
      }
      setResidentModalVisible(false);
    } catch (error) {
      console.error('Error saving resident:', error);
      Alert.alert('Error', 'Failed to save resident information');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Resident Deletion
  const handleDeleteResident = (residentId: string, name: string) => {
    Alert.alert(
      'Remove Resident',
      `Are you sure you want to remove ${name} from this room?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await roomService.deleteResidentFromRoom(propertyId, roomId, residentId);
              removeResidentLocally(residentId);
              Alert.alert('Success', 'Resident removed successfully');
            } catch (error) {
              console.error('Error deleting resident:', error);
              Alert.alert('Error', 'Failed to remove resident');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Call Resident
  const handleCall = (phone: string) => {
    const cleanNumber = phone.replace(/\D/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() =>
      Alert.alert('Error', 'Unable to place call')
    );
  };

  // Payment Status Logic
  const getPaymentStatus = (endDateString: string) => {
    if (!endDateString) return 'pending';
    const endDate = new Date(endDateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'pending';
    if (diffDays <= 7) return 'upcoming';
    return 'paid';
  };

  // WhatsApp Rent Reminder
  const handleWhatsAppReminder = (resident: Resident) => {
    if (!resident.phone) {
      Alert.alert('Error', 'Phone number is missing');
      return;
    }

    const status = getPaymentStatus(resident.end_date);

    let cleanNumber = resident.phone.replace(/\D/g, '');
    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber;
    }

    const endDate = new Date(resident.end_date);
    const formattedEndDate = endDate.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });

    let message = '';
    const roomNo = room?.room_no || 'N/A';

    if (status === 'upcoming') {
      message = `Hello ${resident.name},\n\nYour room payment is due soon.\n\nRoom No: ${roomNo}\nDue Date: ${formattedEndDate}\n\nPlease complete your payment on time.\n\nThank you.`;
    } else if (status === 'pending') {
      message = `Hello ${resident.name},\n\nYour room payment is OVERDUE.\n\nRoom No: ${roomNo}\nDue Date: ${formattedEndDate}\n\nPlease make the payment immediately to avoid any inconvenience.\n\nThank you.`;
    }

    const url = message ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}` : `https://wa.me/${cleanNumber}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(url); // Fallback to web link directly
      }
    }).catch(() => {
      Alert.alert('Error', 'Could not open WhatsApp');
    });
  };

  const getCheckoutStatus = (endDateString: string) => {
    if (!endDateString) return { text: 'N/A', color: '#64748b' };
    const endDate = new Date(endDateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Checkout Overdue: ${Math.abs(diffDays)} days ago`, color: '#ef4444', isOverdue: true };
    } else if (diffDays === 0) {
      return { text: 'Checkout: Due today', color: '#f59e0b', isOverdue: false };
    } else if (diffDays <= 7) {
      return { text: `Checkout in ${diffDays} days`, color: '#f59e0b', isOverdue: false };
    } else {
      return { text: `Checkout: ${diffDays} days remaining`, color: '#10b981', isOverdue: false };
    }
  };

  const formatDateLabel = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const occupancy = residents.length;
  const capacity = room?.capacity || 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.detailsHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{room?.room_no} Details</Text>
        <TouchableOpacity onPress={handleDeleteRoom} style={[styles.backButton, { backgroundColor: '#fef2f2' }]}>
          <Ionicons name="trash" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.detailsScroll}
        contentContainerStyle={[styles.detailsContent, { paddingBottom: 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Room Info Card */}
        <View style={localStyles.roomCardInfo}>
          <View style={localStyles.roomCardHeader}>
            <View>
              <Text style={localStyles.roomCardTitle}>Room {room?.room_no}</Text>
              <Text style={localStyles.roomPropertySub}>{name}</Text>
            </View>
            <TouchableOpacity style={localStyles.editRoomBtn} onPress={() => setRoomModalVisible(true)}>
              <Ionicons name="pencil" size={16} color="#6366f1" />
              <Text style={localStyles.editRoomText}>Edit Room</Text>
            </TouchableOpacity>
          </View>

          <View style={localStyles.divider} />

          <View style={localStyles.roomGrid}>
            <View style={localStyles.gridCol}>
              <Text style={localStyles.gridLabel}>Monthly Rent</Text>
              <Text style={localStyles.gridVal}>₹{room?.monthly_rent.toLocaleString('en-IN')}</Text>
            </View>
            <View style={localStyles.gridCol}>
              <Text style={localStyles.gridLabel}>Occupancy</Text>
              <Text style={localStyles.gridVal}>{occupancy} / {capacity} Beds</Text>
            </View>
          </View>
        </View>

        {/* Onboard Resident Option */}
        <View style={localStyles.sectionHeaderContainer}>
          <Text style={localStyles.sectionTitleText}>Room Residents ({occupancy})</Text>
          {occupancy < capacity && (
            <TouchableOpacity style={localStyles.addResidentBtn} onPress={handleOpenAddResident}>
              <Ionicons name="person-add" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={localStyles.addResidentText}>Onboard Resident</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Residents List */}
        {residents.length > 0 ? (
          residents.map((res) => {
            const status = getCheckoutStatus(res.end_date);
            return (
              <SwipeableCard
                key={res.id}
                onSwipeLeft={() => handleOpenPaymentModal(res)}
              >
                <View style={{ marginBottom: 10 }}>
                  <View style={localStyles.residentCardCompact}>
                    {/* Header info */}
                    <View style={localStyles.resCardHeaderCompact}>
                      <View style={localStyles.avatarSmall}>
                        <Ionicons name="person" size={14} color="#6366f1" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={localStyles.resNameTextCompact} numberOfLines={1}>{res.name}</Text>
                        <Text style={localStyles.resGenderTextCompact}>{res.gender}</Text>
                      </View>
                      <View style={localStyles.resHeaderActionsCompact}>
                        <TouchableOpacity
                          style={localStyles.resActionCircleCompact}
                          onPress={() => handleOpenEditResident(res)}
                        >
                          <Ionicons name="pencil" size={14} color="#475569" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[localStyles.resActionCircleCompact, { backgroundColor: '#fef2f2' }]}
                          onPress={() => handleDeleteResident(res.id, res.name)}
                        >
                          <Ionicons name="trash" size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Details Grid */}
                    <View style={localStyles.resGridCompact}>
                      <View style={localStyles.resGridRowCompact}>
                        <View style={localStyles.resGridColCompact}>
                          <Ionicons name="call-outline" size={11} color="#64748b" style={localStyles.resDetailIconCompact} />
                          <Text style={localStyles.resDetailValCompact} numberOfLines={1}>{res.phone}</Text>
                        </View>
                        <View style={localStyles.resGridColCompact}>
                          <Ionicons name="calendar-outline" size={11} color="#64748b" style={localStyles.resDetailIconCompact} />
                          <Text style={localStyles.resDetailValCompact} numberOfLines={1}>
                            In: {formatDateLabel(res.start_date)}
                          </Text>
                        </View>
                      </View>

                      <View style={localStyles.resGridRowCompact}>
                        <View style={[localStyles.resGridColCompact, { flex: 1.2 }]}>
                          <Ionicons
                            name={status.isOverdue ? 'alert-circle-outline' : 'time-outline'}
                            size={11}
                            color={status.color}
                            style={localStyles.resDetailIconCompact}
                          />
                          <Text style={[localStyles.resDetailValCompact, { color: status.color, fontWeight: '700' }]} numberOfLines={1}>
                            {status.text}
                          </Text>
                        </View>
                        <View style={localStyles.resGridColCompact}>
                          <Ionicons name="calendar-outline" size={11} color="#64748b" style={localStyles.resDetailIconCompact} />
                          <Text style={localStyles.resDetailValCompact} numberOfLines={1}>
                            Out: {formatDateLabel(res.end_date)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Bottom Quick Contact Row */}
                    <View style={localStyles.compactContactRow}>
                      <TouchableOpacity
                        style={[localStyles.compactContactBtn, { backgroundColor: '#eff6ff' }]}
                        onPress={() => handleCall(res.phone)}
                      >
                        <Ionicons name="call" size={14} color="#2563eb" style={{ marginRight: 6 }} />
                        <Text style={[localStyles.compactContactBtnText, { color: '#2563eb' }]}>Call</Text>
                      </TouchableOpacity>
                      {(() => {
                        const status = getPaymentStatus(res.end_date);
                        const isPaid = status === 'paid';
                        return (
                          <TouchableOpacity
                            style={[localStyles.compactContactBtn, { backgroundColor: '#ecfdf5' }]}
                            onPress={() => handleWhatsAppReminder(res)}
                          >
                            <Ionicons name="logo-whatsapp" size={14} color="#059669" style={{ marginRight: 6 }} />
                            <Text style={[localStyles.compactContactBtnText, { color: '#059669' }]}>WhatsApp</Text>
                          </TouchableOpacity>
                        );
                      })()}
                    </View>
                  </View>
                  {res.remarks ? (
                    <TouchableOpacity
                      style={localStyles.remarksStackContainer}
                      onPress={() => handleOpenEditResident(res)}
                    >
                      <Ionicons name="document-text-outline" size={12} color="#475569" style={{ marginRight: 6 }} />
                      <Text style={localStyles.remarksStackText} numberOfLines={1}>
                        {res.remarks}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </SwipeableCard>
            );
          })
        ) : (
          <View style={localStyles.emptyResidentsCard}>
            <Ionicons name="people-outline" size={48} color="#cbd5e1" />
            <Text style={localStyles.emptyResidentsTitle}>No Residents Yet</Text>
            <Text style={localStyles.emptyResidentsSub}>Onboard a resident to occupy this room.</Text>
          </View>
        )}
      </ScrollView>

      {/* Edit Room Modal */}
      <Modal visible={roomModalVisible} transparent animationType="slide" onRequestClose={() => setRoomModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRoomModalVisible(false)}
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
                <Text style={styles.sectionTitle}>Edit Room Details</Text>
                <TouchableOpacity onPress={() => setRoomModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Room Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 101"
                  placeholderTextColor="#ccc"
                  value={roomNo}
                  onChangeText={setRoomNo}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Capacity (Beds) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2"
                  placeholderTextColor="#ccc"
                  keyboardType="numeric"
                  value={roomCapacity}
                  onChangeText={setRoomCapacity}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Monthly Rent (₹) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 12000"
                  placeholderTextColor="#ccc"
                  keyboardType="numeric"
                  value={roomRent}
                  onChangeText={setRoomRent}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, paddingBottom: 20 }}>
                <TouchableOpacity
                  style={[styles.button, styles.discardButton]}
                  onPress={() => setRoomModalVisible(false)}
                  disabled={actionLoading}
                >
                  <Text style={styles.discardButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#6366f1' }]}
                  onPress={handleUpdateRoom}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Details</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* Resident Modal (Add/Edit) */}
      <Modal visible={residentModalVisible} transparent animationType="slide" onRequestClose={() => setResidentModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setResidentModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[styles.modalContent, { padding: 20, maxHeight: 650 }]}
            >
              <View style={localStyles.modalHeader}>
                <Text style={styles.sectionTitle}>
                  {editingResident ? 'Edit Resident Info' : 'Onboard Resident'}
                </Text>
                <TouchableOpacity onPress={() => setResidentModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Resident Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter full name"
                    placeholderTextColor="#ccc"
                    value={resName}
                    onChangeText={setResName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Gender *</Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowGenderDropdown(true)}
                  >
                    <Text style={styles.dropdownButtonText}>{resGender}</Text>
                    <Ionicons name="chevron-down" size={20} color="#6366f1" />
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Mobile Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter phone number"
                    placeholderTextColor="#ccc"
                    keyboardType="phone-pad"
                    value={resPhone}
                    onChangeText={setResPhone}
                  />
                </View>

                <View style={styles.dateRow}>
                  <View style={styles.dateField}>
                    <Text style={styles.label}>Check-in Date *</Text>
                    <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartDatePicker(true)}>
                      <Text style={styles.dateButtonText}>{resStartDate ? formatDateLabel(resStartDate) : 'Select check-in'}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dateField}>
                    <Text style={styles.label}>Check-out Date *</Text>
                    <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndDatePicker(true)}>
                      <Text style={styles.dateButtonText}>{resEndDate ? formatDateLabel(resEndDate) : 'Select check-out'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.formGroup, { marginTop: 16 }]}>
                  <Text style={styles.label}>Remarks (Optional)</Text>
                  <TextInput
                    style={styles.remarkInput}
                    placeholder="Add notes, pending items, etc."
                    placeholderTextColor="#ccc"
                    multiline
                    numberOfLines={3}
                    value={resRemarks}
                    onChangeText={setResRemarks}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.button, styles.discardButton]}
                    onPress={() => setResidentModalVisible(false)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.discardButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#6366f1' }]}
                    onPress={handleSaveResident}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>{editingResident ? 'Update' : 'Onboard'}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* Date Pickers (Android & iOS) */}
      {showStartDatePicker && (
        <DateTimePicker
          value={resStartDate ? new Date(resStartDate) : new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartDatePicker(false);
            if (date) setResStartDate(date.toISOString().split('T')[0]);
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={resEndDate ? new Date(resEndDate) : new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndDatePicker(false);
            if (date) setResEndDate(date.toISOString().split('T')[0]);
          }}
        />
      )}

      {/* Gender Dropdown Selection Modal */}
      <Modal visible={showGenderDropdown} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowGenderDropdown(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={genders}
              renderItem={({ item }: { item: string }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setResGender(item);
                    setShowGenderDropdown(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item: string) => item}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Update Payment Bottom Sheet Modal */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <TouchableOpacity
          style={localStyles.paymentModalOverlay}
          activeOpacity={1}
          onPress={() => setPaymentModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={localStyles.paymentModalContent}
            >
              {/* Header */}
              <View style={localStyles.paymentHeader}>
                <Text style={localStyles.paymentHeaderTitle}>Update Payment</Text>
                <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Resident Info */}
              <View style={localStyles.paymentResidentRow}>
                <Text style={localStyles.paymentResidentLabel}>Resident: </Text>
                <Text style={localStyles.paymentResidentName}>{selectedResidentForPayment?.name}</Text>
              </View>

              {/* Quick Select */}
              <View style={localStyles.quickSelectSection}>
                <Text style={localStyles.paymentSectionLabel}>Quick Select</Text>
                <View style={localStyles.quickSelectGrid}>
                  <TouchableOpacity
                    style={[
                      localStyles.quickSelectBtn,
                      quickSelectOption === '1' && localStyles.quickSelectBtnActive,
                    ]}
                    onPress={() => handleQuickSelect(1)}
                  >
                    <Text style={localStyles.quickSelectText}>1 Month</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      localStyles.quickSelectBtn,
                      quickSelectOption === '3' && localStyles.quickSelectBtnActive,
                    ]}
                    onPress={() => handleQuickSelect(3)}
                  >
                    <Text style={localStyles.quickSelectText}>3 Months</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      localStyles.quickSelectBtn,
                      quickSelectOption === '6' && localStyles.quickSelectBtnActive,
                    ]}
                    onPress={() => handleQuickSelect(6)}
                  >
                    <Text style={localStyles.quickSelectText}>6 Months</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      localStyles.quickSelectBtn,
                      quickSelectOption === 'custom' && localStyles.quickSelectBtnActive,
                    ]}
                    onPress={() => handleQuickSelect(-1)}
                  >
                    <Text style={localStyles.quickSelectText}>Custom</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Manual Date Selection */}
              <Text style={localStyles.manualSelectLabel}>Or select dates manually</Text>

              <View style={localStyles.paymentDateRow}>
                <View style={localStyles.paymentDateField}>
                  <Text style={localStyles.paymentInputLabel}>Start Date</Text>
                  <TouchableOpacity
                    style={localStyles.paymentDateInputBtn}
                    onPress={() => setShowPaymentStartDatePicker(true)}
                  >
                    <Text style={localStyles.paymentDateInputText}>
                      {displayDateFormat(paymentStartDate)}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                <View style={localStyles.paymentDateField}>
                  <Text style={localStyles.paymentInputLabel}>End Date</Text>
                  <TouchableOpacity
                    style={localStyles.paymentDateInputBtn}
                    onPress={() => setShowPaymentEndDatePicker(true)}
                  >
                    <Text style={localStyles.paymentDateInputText}>
                      {displayDateFormat(paymentEndDate)}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bottom Buttons */}
              <View style={localStyles.paymentActionsRow}>
                <TouchableOpacity
                  style={localStyles.paymentCancelBtn}
                  onPress={() => setPaymentModalVisible(false)}
                >
                  <Text style={localStyles.paymentCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={localStyles.paymentUpdateBtn}
                  onPress={handleUpdatePayment}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={localStyles.paymentUpdateText}>Update</Text>
                  )}
                </TouchableOpacity>
              </View>

            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* Payment Date Pickers */}
      {showPaymentStartDatePicker && (
        <DateTimePicker
          value={paymentStartDate ? new Date(paymentStartDate) : new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowPaymentStartDatePicker(false);
            if (date) {
              setPaymentStartDate(date.toISOString().split('T')[0]);
              setQuickSelectOption('custom');
            }
          }}
        />
      )}

      {showPaymentEndDatePicker && (
        <DateTimePicker
          value={paymentEndDate ? new Date(paymentEndDate) : new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowPaymentEndDatePicker(false);
            if (date) {
              setPaymentEndDate(date.toISOString().split('T')[0]);
              setQuickSelectOption('custom');
            }
          }}
        />
      )}

      {/* Action Overlay Loader */}
      {actionLoading && (
        <View style={localStyles.overlayLoader}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  roomCardInfo: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    marginBottom: 12,
  },
  roomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roomCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  roomPropertySub: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 0,
  },
  editRoomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editRoomText: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '700',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 8,
  },
  roomGrid: {
    flexDirection: 'row',
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  gridVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  addResidentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 2,
  },
  addResidentText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  residentCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  resCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  resGenderText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  resHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  resActionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  statusStripText: {
    fontSize: 13,
    fontWeight: '700',
  },
  resDetailBlock: {
    gap: 8,
    marginBottom: 14,
  },
  resDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resDetailIcon: {
    marginRight: 8,
  },
  resDetailVal: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  remarksBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  remarksLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  remarksText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  contactToolbar: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  toolbarButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  toolbarButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyResidentsCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 40,
    alignItems: 'center',
    elevation: 1,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  emptyResidentsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
  },
  emptyResidentsSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overlayLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  swipeContainer: {
    position: 'relative',
    marginBottom: 10,
    borderRadius: 12,
  },
  swipeUnderlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: 20,
    borderRadius: 12,
  },
  swipeUnderlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  residentCardCompact: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 2,
  },
  remarksStackContainer: {
    backgroundColor: '#f8fafc',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    marginTop: -12,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopWidth: 0,
    elevation: 1,
  },
  remarksStackText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  resCardHeaderCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resNameTextCompact: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  resGenderTextCompact: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  resHeaderActionsCompact: {
    flexDirection: 'row',
    gap: 8,
  },
  resActionCircleCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resGridCompact: {
    gap: 4,
  },
  compactContactRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  compactContactBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
  },
  compactContactBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resGridRowCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  resGridColCompact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resDetailIconCompact: {
    marginRight: 4,
  },
  resDetailValCompact: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  paymentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  paymentModalContent: {
    backgroundColor: '#121824',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  paymentHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  paymentResidentRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  paymentResidentLabel: {
    fontSize: 15,
    color: '#94a3b8',
  },
  paymentResidentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  quickSelectSection: {
    marginBottom: 24,
  },
  paymentSectionLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 10,
    fontWeight: '600',
  },
  quickSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickSelectBtn: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSelectBtnActive: {
    borderColor: '#2563eb',
    backgroundColor: '#1e3a8a',
  },
  quickSelectText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  manualSelectLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 12,
    fontWeight: '500',
  },
  paymentDateRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  paymentDateField: {
    flex: 1,
  },
  paymentInputLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
    fontWeight: '600',
  },
  paymentDateInputBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  paymentDateInputText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  paymentActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  paymentCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentCancelText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentUpdateBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentUpdateText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default RoomDetailsScreen;
