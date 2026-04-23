import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  FlatList,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { residentService } from '../services/residentService';
import { Resident } from '../types';
import { styles } from '../styles/styles';
import { categorizeResidents } from '../utils/residentCategorization';

interface ResidentDetailsScreenProps {
  route: any;
  navigation: any;
}

const ResidentDetailsScreen: React.FC<ResidentDetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const { residentId, propertyId } = route.params;
  const insets = useSafeAreaInsets();
  const [resident, setResident] = useState<Resident | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // States for selection modals
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // State for text edit modal (Android support)
  const [showTextModal, setShowTextModal] = useState(false);
  const [textModalConfig, setTextModalConfig] = useState<{
    title: string;
    field: keyof Resident;
    value: string;
    keyboardType: any;
  }>({
    title: '',
    field: 'studentName',
    value: '',
    keyboardType: 'default',
  });

  const genders = ['Male', 'Female', 'Other'];

  const fetchResident = useCallback(async () => {
    setLoading(true);
    try {
      const data = await residentService.fetchResidentById(residentId, propertyId);
      if (data) {
        setResident(data);
      }
    } catch (error) {
      console.error('Error fetching resident:', error);
      Alert.alert('Error', 'Failed to load resident details');
    } finally {
      setLoading(false);
    }
  }, [residentId, propertyId]);

  useFocusEffect(
    useCallback(() => {
      fetchResident();
    }, [fetchResident])
  );

  const handleCall = () => {
    if (resident) {
      const cleanNumber = resident.mobileNumber.replace(/\D/g, '');
      Linking.openURL(`tel:${cleanNumber}`).catch(() =>
        Alert.alert('Error', 'Unable to make call')
      );
    }
  };

  const handleUpdateField = async (field: keyof Resident, value: string | number) => {
    if (!resident) return;
    
    setUpdating(true);
    try {
      const updatedResident = await residentService.updateResident(propertyId, residentId, { [field]: value });
      if (updatedResident) {
        setResident(updatedResident);
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      Alert.alert('Error', `Failed to update ${field}`);
    } finally {
      setUpdating(false);
    }
  };

  const promptEditText = (title: string, field: keyof Resident, currentValue: string, keyboardType: any = 'default') => {
    setTextModalConfig({
      title,
      field,
      value: currentValue,
      keyboardType,
    });
    setShowTextModal(true);
  };

  const onDateChange = (event: any, selectedDate: Date | undefined, field: 'startDate' | 'endDate') => {
    if (field === 'startDate') setShowStartDatePicker(false);
    else setShowEndDatePicker(false);

    if (selectedDate && event.type !== 'dismissed') {
      const dateString = selectedDate.toISOString().split('T')[0];
      handleUpdateField(field, dateString);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!resident) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyStateTitle}>Resident not found</Text>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return '#2e7d32';
      case 'Pending':
        return '#e65100';
      case 'Upcoming':
        return '#6a1b9a';
      default:
        return '#666';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return '#e8f5e9';
      case 'Pending':
        return '#fff3e0';
      case 'Upcoming':
        return '#f3e5f5';
      default:
        return '#f5f5f5';
    }
  };

  const category = resident ? categorizeResidents([resident]).all[0].category : 'Pending';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.detailsHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resident Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.detailsScroll}
        contentContainerStyle={styles.detailsContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatarLarge}>
            {resident.profileImage && resident.profileImage !== '👤' ? (
              <Text style={styles.profileAvatarLargeText}>
                {resident.profileImage}
              </Text>
            ) : (
              <Ionicons name="person" size={50} color="#cbd5e1" />
            )}
            {resident.isOnline && <View style={styles.onlineIndicatorLarge} />}
          </View>

          <TouchableOpacity 
            style={{ paddingBottom: 4 }}
            onPress={() => promptEditText('Name', 'studentName', resident.studentName)}
          >
            <Text style={styles.profileName}>{resident.studentName}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => promptEditText('Phone', 'mobileNumber', resident.mobileNumber, 'phone-pad')}
          >
            <Text style={styles.profilePhone}>{resident.mobileNumber}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCall} style={styles.callIconButton}>
            <Ionicons name="call" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Identity Info Cards */}
        <View style={styles.infoCardsContainer}>
          <TouchableOpacity 
            style={styles.infoCard}
            onPress={() => setShowGenderModal(true)}
          >
            <Text style={styles.infoCardLabel}>Gender</Text>
            <Text style={styles.infoCardValue}>{resident.gender}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.infoCard}
            onPress={() => promptEditText('Email', 'emailId', resident.emailId, 'email-address')}
          >
            <Text style={styles.infoCardLabel}>Email</Text>
            <Text style={[styles.infoCardValue, { fontSize: 12 }]}>{resident.emailId}</Text>
          </TouchableOpacity>
        </View>

        {/* Placement Info Cards */}
        <View style={styles.infoCardsContainer}>
          <TouchableOpacity 
            style={styles.infoCard}
            onPress={() => promptEditText('Room Number', 'roomNumber', resident.roomNumber, 'default')}
          >
            <Text style={styles.infoCardLabel}>Room Number</Text>
            <Text style={styles.infoCardValue}>{resident.roomNumber}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.infoCard}
            onPress={() => promptEditText('Rent Amount', 'rentAmount', resident.rentAmount.toString(), 'decimal-pad')}
          >
            <Text style={styles.infoCardLabel}>Rent Amount</Text>
            <Text style={styles.infoCardValue}>₹{resident.rentAmount}</Text>
          </TouchableOpacity>
        </View>

        {/* Stay Duration */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Stay Duration</Text>
          <View style={styles.durationRow}>
            <TouchableOpacity 
              style={styles.durationField}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={styles.durationLabel}>Check-in</Text>
              <Text style={styles.durationDate}>
                {formatDate(resident.startDate)}
              </Text>
            </TouchableOpacity>
            <Text style={styles.durationArrow}>→</Text>
            <TouchableOpacity 
              style={styles.durationField}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={styles.durationLabel}>Check-out</Text>
              <Text style={styles.durationDate}>
                {formatDate(resident.endDate)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Status */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Payment Status</Text>
          <View
            style={[
              styles.statusBadgeLarge,
              { backgroundColor: getStatusBgColor(category) },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeLargeText,
                { color: getStatusColor(category) },
              ]}
            >
              {category === 'Paid' ? 'Paid' : category === 'Pending' ? 'Unpaid' : 'Upcoming'}
            </Text>
          </View>
        </View>

        {/* Notes */}
        <TouchableOpacity 
          style={styles.sectionCard}
          onPress={() => promptEditText('Notes', 'remarks', resident.remarks || '')}
        >
          <Text style={styles.sectionCardTitle}>Notes</Text>
          <Text style={styles.notesText}>{resident.remarks || 'No notes added. Tap to add.'}</Text>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Delete Resident', 'Are you sure you want to delete this resident?', [
              { text: 'Cancel', onPress: () => {} },
              {
                text: 'Delete',
                onPress: async () => {
                  try {
                    await residentService.deleteResident(propertyId, residentId);
                    Alert.alert('Success', 'Resident deleted', [
                      {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                      },
                    ]);
                  } catch (error) {
                    Alert.alert('Error', 'Failed to delete resident');
                  }
                },
                style: 'destructive',
              },
            ]);
          }}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>Delete Resident</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Selection Modals */}
      <SelectionModal
        visible={showGenderModal}
        title="Select Gender"
        options={genders}
        onSelect={(value: string) => {
          handleUpdateField('gender', value);
          setShowGenderModal(false);
        }}
        onClose={() => setShowGenderModal(false)}
      />

      {/* Date Pickers */}
      {showStartDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={resident.startDate ? new Date(resident.startDate) : new Date()}
          mode="date"
          display="default"
          onChange={(event: any, date?: Date) => onDateChange(event, date, 'startDate')}
        />
      )}

      {showEndDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={resident.endDate ? new Date(resident.endDate) : new Date()}
          mode="date"
          display="default"
          onChange={(event: any, date?: Date) => onDateChange(event, date, 'endDate')}
        />
      )}

      {/* iOS Date Picker Modal */}
      {Platform.OS === 'ios' && (showStartDatePicker || showEndDatePicker) && (
        <IOSDatePickerModal
          visible={showStartDatePicker || showEndDatePicker}
          title={showStartDatePicker ? 'Check-in Date' : 'Check-out Date'}
          value={
            showStartDatePicker
              ? (resident.startDate ? new Date(resident.startDate) : new Date())
              : (resident.endDate ? new Date(resident.endDate) : new Date())
          }
          onSave={(date: Date) => {
            const field = showStartDatePicker ? 'startDate' : 'endDate';
            const dateString = date.toISOString().split('T')[0];
            handleUpdateField(field, dateString);
            setShowStartDatePicker(false);
            setShowEndDatePicker(false);
          }}
          onClose={() => {
            setShowStartDatePicker(false);
            setShowEndDatePicker(false);
          }}
        />
      )}

      {/* Text Edit Modal (Android Support) */}
      <TextEditModal
        visible={showTextModal}
        config={textModalConfig}
        onSave={(value: string) => {
          handleUpdateField(textModalConfig.field, value);
          setShowTextModal(false);
        }}
        onClose={() => setShowTextModal(false)}
      />

      {/* Updating Indicator Overlay */}
      {updating && (
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      )}
    </View>
  );
};

// Helper Component for Selection Modals
const SelectionModal = ({ visible, title, options, onSelect, onClose }: any) => (
  <Modal visible={visible} transparent animationType="fade">
    <TouchableOpacity
      style={styles.modalOverlay}
      onPress={onClose}
      activeOpacity={1}
    >
      <View style={styles.modalContent}>
        <Text style={[styles.sectionTitle, { marginBottom: 16, paddingHorizontal: 16, paddingTop: 16 }]}>{title}</Text>
        <FlatList
          data={options}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => onSelect(item)}
            >
              <Text style={styles.modalItemText}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
        />
      </View>
    </TouchableOpacity>
  </Modal>
);

// Helper Component for Text Editing (Cross-Platform)
const TextEditModal = ({ visible, config, onSave, onClose }: any) => {
  const [localValue, setLocalValue] = useState(config.value);

  // Sync local value when config changes
  React.useEffect(() => {
    setLocalValue(config.value);
  }, [config.value, visible]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={onClose}
          activeOpacity={1}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { padding: 20 }]}>
            <Text style={styles.sectionTitle}>Edit {config.title}</Text>
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              value={localValue}
              onChangeText={setLocalValue}
              placeholder={`Enter ${config.title.toLowerCase()}...`}
              keyboardType={config.keyboardType}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, paddingBottom: 20 }}>
              <TouchableOpacity 
                style={[styles.button, styles.discardButton]} 
                onPress={onClose}
              >
                <Text style={styles.discardButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#6366f1' }]} 
                onPress={() => onSave(localValue)}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Helper Component for iOS Date Picker Modal
const IOSDatePickerModal = ({ visible, title, value, onSave, onClose }: any) => {
  const [localDate, setLocalDate] = useState(value);

  React.useEffect(() => {
    setLocalDate(value);
  }, [value, visible]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity
        style={styles.modalOverlay}
        onPress={onClose}
        activeOpacity={1}
      >
        <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { padding: 20 }]}>
          <Text style={styles.sectionTitle}>Select {title}</Text>
          <View style={{ alignItems: 'center', marginVertical: 10 }}>
            <DateTimePicker
              value={localDate}
              mode="date"
              display="spinner"
              onChange={(_: any, date?: Date) => {
                if (date) setLocalDate(date);
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, paddingBottom: 20 }}>
            <TouchableOpacity 
              style={[styles.button, styles.discardButton]} 
              onPress={onClose}
            >
              <Text style={styles.discardButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: '#6366f1' }]} 
              onPress={() => onSave(localDate)}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default ResidentDetailsScreen;
