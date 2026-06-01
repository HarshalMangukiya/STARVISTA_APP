import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
  ToastAndroid,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadPropertyImage, updateProperty } from '../services/propertyService';
import { Property } from '../types';
import { auth, serializeError } from '../config/firebase';
import styles from '../styles/styles';
import { runNetworkDiagnostics, testImageURI } from '../utils/networkUtils';

interface ImageAsset {
  uri: string;
  fileName?: string;
  type?: string;
  isRemote?: boolean;
}

import { deleteImageFromStorage } from '../services/propertyService';

const EditPropertyScreen = ({ route, navigation }: any) => {
  const property: Property = route.params?.property;
  const insets = useSafeAreaInsets();

  const [propertyName, setPropertyName] = useState(property?.propertyName || '');
  const [address, setAddress] = useState(property?.address || '');
  const [selectedImage, setSelectedImage] = useState<ImageAsset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingImage, setHasExistingImage] = useState(false);

  useEffect(() => {
    if (property?.imageUrls && property.imageUrls.length > 0) {
      setSelectedImage({
        uri: property.imageUrls[0],
        isRemote: true,
      });
      setHasExistingImage(true);
    } else {
      setSelectedImage(null);
      setHasExistingImage(false);
    }
  }, [property]);

  const handleSelectImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Failed to pick image');
        } else if (response.assets && response.assets.length > 0) {
          const newImage = response.assets[0];
          if (newImage.uri) {
            setSelectedImage({
              uri: newImage.uri,
              fileName: newImage.fileName,
              type: newImage.type,
              isRemote: false,
            });
          }
        }
      }
    );
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setHasExistingImage(false);
  };

  const validateInputs = (): boolean => {
    if (!propertyName.trim()) {
      Alert.alert('Validation Error', 'Please enter property name');
      return false;
    }
    if (!address.trim()) {
      Alert.alert('Validation Error', 'Please enter address');
      return false;
    }
    return true;
  };

  const handleUpdateProperty = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated. Please log in.');
        setIsLoading(false);
        return;
      }

      console.log('🚀 Starting property update process...', property.id);
      console.log('📱 Device info check...');
      console.log('   Selected image:', selectedImage?.uri?.substring(0, 60));
      console.log('   Is remote:', selectedImage?.isRemote);

      let finalImageUrl: string | undefined = property.imageUrls ? property.imageUrls[0] : undefined;

      // Check if new local image selected
      if (selectedImage && !selectedImage.isRemote) {
        console.log('📤 New local image detected, uploading to Cloudinary...');
        console.log('   Image URI:', selectedImage.uri);
        
        try {
          finalImageUrl = await uploadPropertyImage(property.id!, selectedImage.uri);
          console.log('✅ Image upload completed successfully');
          console.log('   Secure URL:', finalImageUrl);
        } catch (uploadError: any) {
          console.error('❌ Image upload failed:', uploadError);
          console.error('   Error message:', uploadError?.message);
          console.error('   Full error:', uploadError);
          throw uploadError;
        }

        // Optional: Delete old image if existed
        if (property.imageUrls && property.imageUrls[0] !== finalImageUrl) {
          deleteImageFromStorage(property.imageUrls[0]).catch(console.warn);
        }
      }

      console.log('💾 Updating property in Firestore...');
      console.log('   Property ID:', property.id);
      console.log('   Image URL:', finalImageUrl?.substring(0, 60) + '...');
      
      if (!property.id) throw new Error('Property ID is missing');

      await updateProperty(property.id!, {
        propertyName: propertyName.trim(),
        address: address.trim(),
        imageUrls: finalImageUrl ? [finalImageUrl] : [],
      });
      console.log('✅ Property updated successfully in Firestore');

      // Use a brief Toast message on success
      ToastAndroid.show('Property updated successfully', ToastAndroid.SHORT);
      
      // Navigate back to Dashboard
      navigation.goBack();

    } catch (error: any) {
      console.error('❌ Error updating property:', error);
      console.error('   Error type:', error?.constructor?.name);
      const errorMessage = error?.message || 'Failed to update property. Please try again.';

      Alert.alert('Error', errorMessage, [
        { text: 'Dismiss', style: 'default' },
        {
          text: 'View Details',
          onPress: () => {
            console.log('Full error:', error);
            // Properly serialize the error to show all details
            const errorDetails = serializeError(error);
            Alert.alert(
              'Error Details',
              JSON.stringify(errorDetails, null, 2),
              [{ text: 'OK', style: 'default' }]
            );
          },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleRunDiagnostics = async () => {
    Alert.alert('Network Diagnostics', 'Running tests... Check console for details.');
    
    try {
      // Run network diagnostics
      const diagnostics = await runNetworkDiagnostics();
      
      // Test the selected image if one exists
      if (selectedImage && !selectedImage.isRemote) {
        console.log('\n📸 Testing selected image...');
        const imageTest = await testImageURI(selectedImage.uri);
        console.log('Image test result:', imageTest);
      }

      let summary = diagnostics.summary;
      if (selectedImage && !selectedImage.isRemote) {
        summary += '\n\n📸 Selected image: Accessible';
      }

      Alert.alert('Diagnostics Complete', summary);
    } catch (error: any) {
      Alert.alert('Diagnostic Error', error?.message || 'Diagnostics failed');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.statusBarShield, { height: insets.top, backgroundColor: '#fff' }]} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top + 60}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: insets.top }}
        >
        {/* Header */}
        <View style={[styles.header, { paddingTop: 10 }]}>
        <Text style={styles.headerTitle}>Edit Property</Text>
      </View>

      {/* Diagnostic Button (for debugging) */}
      <TouchableOpacity
        style={{
          marginHorizontal: 16,
          marginVertical: 10,
          padding: 12,
          backgroundColor: '#f0f0f0',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#e0e0e0',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPress={handleRunDiagnostics}
      >
        <Ionicons name="settings" size={16} color="#666" style={{ marginRight: 6 }} />
        <Text style={{ textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#666' }}>
          Run Network Diagnostics
        </Text>
      </TouchableOpacity>

      {/* Property Name Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Property Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Star Hostel, City Hotel"
          value={propertyName}
          onChangeText={setPropertyName}
          editable={!isLoading}
          placeholderTextColor="#999"
        />
      </View>

      {/* Image Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Property Image (Optional)</Text>
        <TouchableOpacity
          style={styles.imagePickerButton}
          onPress={handleSelectImage}
          disabled={isLoading}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="image" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.imagePickerButtonText}>
              {selectedImage ? 'Replace Image' : 'Add Image (0/1)'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Single Image Preview */}
        {selectedImage && (
          <View style={styles.singleImagePreviewContainer}>
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.singleImagePreview}
            />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={handleRemoveImage}
              disabled={isLoading}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Address Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Enter complete address"
          value={address}
          onChangeText={setAddress}
          editable={!isLoading}
          multiline
          numberOfLines={3}
          placeholderTextColor="#999"
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.discardButton]}
          onPress={handleCancel}
          disabled={isLoading}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close-outline" size={18} color="#555" style={{ marginRight: 6 }} />
            <Text style={styles.discardButtonText}>Cancel</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleUpdateProperty}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="checkmark-done" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.saveButtonText}>Update Property</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default EditPropertyScreen;
