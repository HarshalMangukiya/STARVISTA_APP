import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  ToastAndroid,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchUserProperties, deleteProperty } from '../services/propertyService';
import { Property } from '../types';
import styles from '../styles/styles';

const { height } = Dimensions.get('window');

const DashboardScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch properties when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadProperties();
    }, [])
  );

  const loadProperties = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchUserProperties();
      setProperties(data);
    } catch (err) {
      console.error('Error loading properties:', err);
      setError('Failed to load properties');
      Alert.alert('Error', 'Failed to load properties. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLongPress = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setShowBottomSheet(true);
  };

  const handleDeletePress = () => {
    setShowBottomSheet(false);
    setShowDeleteConfirm(true);
  };

  const handleEditPress = () => {
    setShowBottomSheet(false);
    const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
    if (selectedProperty) {
      navigation.navigate('EditProperty', { property: selectedProperty });
    }
    setSelectedPropertyId(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPropertyId) return;

    setIsDeleting(true);
    try {
      await deleteProperty(selectedPropertyId);

      // Remove from list
      setProperties((prev) =>
        prev.filter((p) => p.id !== selectedPropertyId)
      );

      // Show success message
      ToastAndroid.show('Property deleted successfully', ToastAndroid.SHORT);

      // Close dialogs
      setShowDeleteConfirm(false);
      setSelectedPropertyId(null);
    } catch (err: any) {
      console.error('Error deleting property:', err);
      Alert.alert(
        'Delete Failed',
        err?.message || 'Failed to delete property. Please try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setSelectedPropertyId(null);
  };

  const handleBottomSheetClose = () => {
    setShowBottomSheet(false);
    setSelectedPropertyId(null);
  };

  const renderPropertyCard = ({ item }: { item: Property }) => (
    <View>
      <TouchableOpacity
        style={styles.propertyCard}
        onPress={() =>
          navigation.navigate('RoomsList', {
            propertyId: item.id,
            propertyName: item.propertyName,
          })
        }
        onLongPress={() => handleLongPress(item.id!)}
        delayLongPress={500}
      >
        {/* Property Image */}
        <Image
          source={{ uri: item.imageUrls?.[0] || (item as any).imageUrl || 'https://via.placeholder.com/300x200' }}
          style={styles.propertyImage}
        />

        {/* Property Info */}
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyName} numberOfLines={1}>
            {item.propertyName}
          </Text>
          <Text style={styles.propertyAddress} numberOfLines={2}>
            {item.address}
          </Text>
          <Text style={styles.imageCount}>
            {(item.imageUrls && item.imageUrls.length > 0) || (item as any).imageUrl
              ? `${item.imageUrls?.length || 1} image${(item.imageUrls?.length || 1) > 1 ? 's' : ''}`
              : 'No image'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="business-outline" size={80} color="#cbd5e1" />
      <Text style={styles.emptyStateTitle}>No Properties Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Create your first property to get started!
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, paddingBottom: 16 }]}>
        <Text style={styles.dashboardHeaderTitle}>My Properties</Text>
      </View>

      {/* Properties List */}
      {error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadProperties}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={properties}
          renderItem={renderPropertyCard}
          keyExtractor={(item) => item.id || Math.random().toString()}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddProperty')}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Bottom Sheet - Delete Option Menu */}
      <Modal
        visible={showBottomSheet}
        transparent
        animationType="slide"
        onRequestClose={handleBottomSheetClose}
      >
        <TouchableOpacity
          style={styles.bottomSheetOverlay}
          activeOpacity={1}
          onPress={handleBottomSheetClose}
        >
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHandle} />

            <TouchableOpacity
              style={styles.bottomSheetMenuItem}
              onPress={handleEditPress}
              disabled={isDeleting}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="pencil" size={20} color="#6366f1" style={{ marginRight: 8 }} />
                <Text style={styles.bottomSheetMenuItemText}>Edit Property</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomSheetMenuItem}
              onPress={handleDeletePress}
              disabled={isDeleting}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="trash" size={20} color="#ff3b30" style={{ marginRight: 8 }} />
                <Text style={[styles.bottomSheetMenuItemText, { color: '#ff3b30' }]}>Delete Property</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomSheetMenuItemCancel}
              onPress={handleBottomSheetClose}
              disabled={isDeleting}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close" size={20} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.bottomSheetMenuItemCancelText}>Cancel</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.confirmDialogOverlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmDialogTitle}>Delete Property?</Text>

            <Text style={styles.confirmDialogMessage}>
              Are you sure you want to delete this property? This action cannot be undone.
            </Text>

            <View style={styles.confirmDialogButtons}>
              <TouchableOpacity
                style={styles.confirmDialogButtonCancel}
                onPress={handleCancelDelete}
                disabled={isDeleting}
              >
                <Text style={styles.confirmDialogButtonCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmDialogButtonDelete,
                  isDeleting && styles.confirmDialogButtonDisabled,
                ]}
                onPress={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmDialogButtonDeleteText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DashboardScreen;