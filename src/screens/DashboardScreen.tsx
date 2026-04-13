import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchUserProperties } from '../services/propertyService';
import { Property } from '../services/propertyService';
import styles from '../styles/styles';

const DashboardScreen = ({ navigation }: any) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const renderPropertyCard = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() =>
        navigation.navigate('PropertyDetail', { property: item })
      }
    >
      {/* Property Image */}
      <Image
        source={{ uri: item.imageUrls[0] || 'https://via.placeholder.com/300x200' }}
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
          {item.imageUrls.length} {item.imageUrls.length === 1 ? 'image' : 'images'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🏠</Text>
      <Text style={styles.emptyStateTitle}>No Properties Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Create your first property to get started!
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Properties</Text>
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
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DashboardScreen;
