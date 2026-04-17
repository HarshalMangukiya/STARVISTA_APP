import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { residentService } from '../services/residentService';
import { Resident } from '../types';
import { styles } from '../styles/styles';
import { categorizeResidents, getCategoryColor } from '../utils/residentCategorization';

interface ResidentDetailsScreenProps {
  route: any;
  navigation: any;
}

const ResidentDetailsScreen: React.FC<ResidentDetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const { residentId, propertyId } = route.params;
  const [resident, setResident] = useState<Resident | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleEdit = () => {
    navigation.navigate('AddResident', {
      propertyId,
      resident,
      isEditing: true,
    });
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
      <View style={styles.detailsHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resident Details</Text>
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <Text style={styles.editButtonText}>✏️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.detailsScroll}
        contentContainerStyle={styles.detailsContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatarLarge}>
            <Text style={styles.profileAvatarLargeText}>
              {resident.profileImage || '👤'}
            </Text>
            {resident.isOnline && <View style={styles.onlineIndicatorLarge} />}
          </View>

          <Text style={styles.profileName}>{resident.studentName}</Text>
          <Text style={styles.profilePhone}>{resident.mobileNumber}</Text>

          <TouchableOpacity onPress={handleCall} style={styles.callIconButton}>
            <Text style={styles.callIconText}>📞</Text>
          </TouchableOpacity>
        </View>

        {/* Identity Info Cards */}
        <View style={styles.infoCardsContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardLabel}>Gender</Text>
            <Text style={styles.infoCardValue}>{resident.gender}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardLabel}>Email</Text>
            <Text style={[styles.infoCardValue, { fontSize: 12 }]}>{resident.emailId}</Text>
          </View>
        </View>

        {/* Placement Info Cards */}
        <View style={styles.infoCardsContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardLabel}>Room Number</Text>
            <Text style={styles.infoCardValue}>{resident.roomNumber}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardLabel}>Room Type</Text>
            <Text style={styles.infoCardValue}>{resident.roomType}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardLabel}>Rent Amount</Text>
            <Text style={styles.infoCardValue}>₹{resident.rentAmount}</Text>
          </View>
        </View>

        {/* Stay Duration */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Stay Duration</Text>
          <View style={styles.durationRow}>
            <View style={styles.durationField}>
              <Text style={styles.durationLabel}>Check-in</Text>
              <Text style={styles.durationDate}>
                {formatDate(resident.startDate)}
              </Text>
            </View>
            <Text style={styles.durationArrow}>→</Text>
            <View style={styles.durationField}>
              <Text style={styles.durationLabel}>Check-out</Text>
              <Text style={styles.durationDate}>
                {formatDate(resident.endDate)}
              </Text>
            </View>
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
        {resident.remarks && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionCardTitle}>Notes</Text>
            <Text style={styles.notesText}>{resident.remarks}</Text>
          </View>
        )}

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
    </View>
  );
};

export default ResidentDetailsScreen;
