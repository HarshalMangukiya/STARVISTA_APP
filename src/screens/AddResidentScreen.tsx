import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { residentService } from '../services/residentService';
import { styles } from '../styles/styles';
import { Resident } from '../types';

interface AddResidentScreenProps {
  route: any;
  navigation: any;
}

const AddResidentScreen: React.FC<AddResidentScreenProps> = ({ route, navigation }) => {
  const { propertyId, isEditing = false, resident } = route.params || {};
  const insets = useSafeAreaInsets();

  // Helper: Split mobile number into country code and number
  const parseMobileNumber = (fullNumber: string): { code: string; number: string } => {
    if (!fullNumber) return { code: '+91', number: '' };
    const match = fullNumber.match(/^(\+\d{1,3})\s*(.+)$/);
    if (match) {
      return { code: match[1], number: match[2] };
    }
    return { code: '+91', number: fullNumber };
  };

  // Initialize state with resident data if editing, else empty
  const [formData, setFormData] = useState({
    studentName: isEditing && resident ? resident.studentName : '',
    gender: isEditing && resident ? resident.gender : '',
    emailId: isEditing && resident ? resident.emailId : '',
    countryCode: isEditing && resident ? parseMobileNumber(resident.mobileNumber).code : '+91',
    mobileNumber: isEditing && resident ? parseMobileNumber(resident.mobileNumber).number : '',
    roomNumber: isEditing && resident ? resident.roomNumber : '',
    rentAmount: isEditing && resident ? resident.rentAmount.toString() : '',
    startDate: isEditing && resident ? resident.startDate : '',
    endDate: isEditing && resident ? resident.endDate : '',
    remarks: isEditing && resident ? (resident.remarks || '') : '',
  });

  const [loading, setLoading] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const genders = ['Male', 'Female', 'Other'];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
  };

  const handleStartDateChange = (event: any, selectedDate: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }

    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        startDate: dateString,
      }));
    }
  };

  const handleEndDateChange = (event: any, selectedDate: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }

    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        endDate: dateString,
      }));
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    if (!formData.studentName.trim()) {
      Alert.alert('Error', 'Please enter student name');
      return false;
    }
    if (!formData.gender) {
      Alert.alert('Error', 'Please select gender');
      return false;
    }
    if (!formData.emailId.trim()) {
      Alert.alert('Error', 'Please enter email ID');
      return false;
    }
    if (!validateEmail(formData.emailId)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!formData.mobileNumber.trim() || formData.mobileNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid mobile number');
      return false;
    }
    if (!formData.roomNumber.trim()) {
      Alert.alert('Error', 'Please enter a room number');
      return false;
    }
    if (!formData.rentAmount.trim() || isNaN(parseFloat(formData.rentAmount))) {
      Alert.alert('Error', 'Please enter a valid rent amount');
      return false;
    }
    if (!formData.startDate) {
      Alert.alert('Error', 'Please select start date');
      return false;
    }
    if (!formData.endDate) {
      Alert.alert('Error', 'Please select end date');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const residentData = {
        studentName: formData.studentName,
        gender: formData.gender,
        emailId: formData.emailId,
        mobileNumber: `${formData.countryCode} ${formData.mobileNumber}`,
        roomNumber: formData.roomNumber,
        rentAmount: parseFloat(formData.rentAmount),
        startDate: formData.startDate,
        endDate: formData.endDate,
        remarks: formData.remarks,
        propertyId,
      };

      if (isEditing && resident?.id) {
        // Update existing resident
        await residentService.updateResident(propertyId, resident.id, residentData);
        Alert.alert('Success', 'Resident updated successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        // Add new resident
        await residentService.addResident(propertyId, residentData);
        Alert.alert('Success', 'Resident added successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error saving resident:', error);
      Alert.alert('Error', isEditing ? 'Failed to update resident' : 'Failed to add resident');
    } finally {
      setLoading(false);
    }
  };

  const headerTitle = isEditing ? 'Edit Resident' : 'Onboard New Tenant';
  const buttonText = isEditing ? 'Update Resident' : 'Save Resident';

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={[styles.formBanner, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.formBackButton}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.formTitle}>{headerTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity Details Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Identity Details</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Student Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter full name"
              placeholderTextColor="#ccc"
              value={formData.studentName}
              onChangeText={(value) => handleInputChange('studentName', value)}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Gender *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowGenderDropdown(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {formData.gender || 'Select gender'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email ID *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              placeholderTextColor="#ccc"
              keyboardType="email-address"
              value={formData.emailId}
              onChangeText={(value) => handleInputChange('emailId', value)}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Mobile Number *</Text>
            <View style={styles.phoneInputContainer}>
              <TextInput
                style={styles.countryCodeInput}
                value={formData.countryCode}
                editable={false}
              />
              <TextInput
                style={styles.phoneInput}
                placeholder="Mobile number"
                placeholderTextColor="#ccc"
                keyboardType="phone-pad"
                value={formData.mobileNumber}
                onChangeText={(value) => handleInputChange('mobileNumber', value)}
              />
            </View>
          </View>
        </View>

        {/* Placement Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Placement</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Room Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter room number"
              placeholderTextColor="#ccc"
              keyboardType="default"
              value={formData.roomNumber}
              onChangeText={(value) => handleInputChange('roomNumber', value)}
            />
          </View>
        </View>

        {/* Agreement & Billing Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Agreement & Billing</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Rent Amount (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter rent amount"
              placeholderTextColor="#ccc"
              keyboardType="decimal-pad"
              value={formData.rentAmount}
              onChangeText={(value) => handleInputChange('rentAmount', value)}
            />
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.label}>Start Date *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setShowEndDatePicker(false);
                  setShowStartDatePicker(true);
                }}
              >
                <Text style={styles.dateButtonText}>
                  {formData.startDate ? formatDate(formData.startDate) : 'Select date'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateField}>
              <Text style={styles.label}>End Date *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setShowStartDatePicker(false);
                  setShowEndDatePicker(true);
                }}
              >
                <Text style={styles.dateButtonText}>
                  {formData.endDate ? formatDate(formData.endDate) : 'Select date'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Remarks Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Additional Information</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Remarks (Optional)</Text>
            <TextInput
              style={styles.remarkInput}
              placeholder="Add any notes or remarks..."
              placeholderTextColor="#ccc"
              multiline
              numberOfLines={4}
              value={formData.remarks}
              onChangeText={(value) => handleInputChange('remarks', value)}
            />
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.formFooter}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={[styles.saveButton, loading && { opacity: 0.6 }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>{buttonText}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Gender Dropdown Modal */}
      <Modal visible={showGenderDropdown} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowGenderDropdown(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={genders}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    handleInputChange('gender', item);
                    setShowGenderDropdown(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Start Date Picker (Android) */}
      {showStartDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={formData.startDate ? new Date(formData.startDate) : new Date()}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
        />
      )}

      {/* End Date Picker (Android) */}
      {showEndDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={formData.endDate ? new Date(formData.endDate) : new Date()}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
        />
      )}

      {/* iOS Date Picker Modal */}
      {Platform.OS === 'ios' && (showStartDatePicker || showEndDatePicker) && (
        <IOSDatePickerModal
          visible={showStartDatePicker || showEndDatePicker}
          title={showStartDatePicker ? 'Start Date' : 'End Date'}
          value={
            showStartDatePicker
              ? (formData.startDate ? new Date(formData.startDate) : new Date())
              : (formData.endDate ? new Date(formData.endDate) : new Date())
          }
          onSave={(date: Date) => {
            const dateString = date.toISOString().split('T')[0];
            if (showStartDatePicker) {
              setFormData(prev => ({ ...prev, startDate: dateString }));
            } else {
              setFormData(prev => ({ ...prev, endDate: dateString }));
            }
            setShowStartDatePicker(false);
            setShowEndDatePicker(false);
          }}
          onClose={() => {
            setShowStartDatePicker(false);
            setShowEndDatePicker(false);
          }}
        />
      )}
    </View>
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

export default AddResidentScreen;