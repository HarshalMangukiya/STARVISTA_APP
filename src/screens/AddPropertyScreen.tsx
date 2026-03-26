import React, { useState } from 'react';
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
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadImages, saveProperty } from '../services/propertyService';
import { auth } from '../config/firebase';
import styles from '../styles/styles';

interface ImageAsset {
  uri: string;
  fileName?: string;
  type?: string;
}

const AddPropertyScreen = ({ navigation }: any) => {
  const [propertyName, setPropertyName] = useState('');
  const [address, setAddress] = useState('');
  const [selectedImages, setSelectedImages] = useState<ImageAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectImages = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 5, // Max 5 images
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Failed to pick image');
        } else if (response.assets) {
          const newImages = response.assets
            .filter((asset) => asset.uri)
            .map((asset) => ({
              uri: asset.uri!,
              fileName: asset.fileName,
              type: asset.type,
            }));
          setSelectedImages([...selectedImages, ...newImages]);
        }
      }
    );
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
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
    if (selectedImages.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one image');
      return false;
    }
    return true;
  };

  const handleSaveProperty = async () => {
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

      console.log('🚀 Starting property save process...');
      console.log(`👤 User ID: ${currentUser.uid}`);
      console.log(`📸 Images to upload: ${selectedImages.length}`);

      // Upload images
      console.log('📤 Step 1: Uploading images to Firebase Storage...');
      const imageUris = selectedImages.map((img) => img.uri);
      const imageUrls = await uploadImages(imageUris, currentUser.uid);
      console.log(`✓ Successfully uploaded ${imageUrls.length} images`);

      // Save property to Firestore
      console.log('💾 Step 2: Saving property to Firestore...');
      await saveProperty({
        propertyName: propertyName.trim(),
        address: address.trim(),
        imageUrls,
        ownerId: currentUser.uid,
      });
      console.log('✓ Property saved successfully');

      Alert.alert('Success', 'Property saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form and navigate back
            setPropertyName('');
            setAddress('');
            setSelectedImages([]);
            navigation.goBack();
          },
        },
      ]);
    } catch (error: any) {
      console.error('❌ Error saving property:', error);
      const errorMessage = error?.message || 'Failed to save property. Please try again.';

      // Show detailed error message
      Alert.alert('Error', errorMessage, [
        {
          text: 'Dismiss',
          style: 'default',
        },
        {
          text: 'View Details',
          onPress: () => {
            console.log('Full error:', error);
            Alert.alert('Error Details', JSON.stringify(error, null, 2));
          },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscardDraft = () => {
    Alert.alert('Discard Draft', 'Are you sure you want to discard this draft?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          setPropertyName('');
          setAddress('');
          setSelectedImages([]);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Property</Text>
      </View>

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
        <Text style={styles.label}>Upload Images</Text>
        <TouchableOpacity
          style={styles.imagePickerButton}
          onPress={handleSelectImages}
          disabled={isLoading || selectedImages.length >= 5}
        >
          <Text style={styles.imagePickerButtonText}>
            + Add Images ({selectedImages.length}/5)
          </Text>
        </TouchableOpacity>

        {/* Image Preview */}
        {selectedImages.length > 0 && (
          <FlatList
            data={selectedImages}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imagePreviewList}
            contentContainerStyle={{ gap: 10 }}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: item.uri }}
                  style={styles.imagePreview}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Text style={styles.removeImageButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          />
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
          onPress={handleDiscardDraft}
          disabled={isLoading}
        >
          <Text style={styles.discardButtonText}>Discard Draft</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSaveProperty}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Property</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

export default AddPropertyScreen;
