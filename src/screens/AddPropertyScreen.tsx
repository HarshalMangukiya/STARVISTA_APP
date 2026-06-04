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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadPropertyImage, saveProperty, updateProperty } from '../services/propertyService';
import { auth, serializeError } from '../config/firebase';
import styles from '../styles/styles';

interface ImageAsset {
  uri: string;
  fileName?: string;
  type?: string;
  isRemote?: boolean;
}

const AddPropertyScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [propertyName, setPropertyName] = useState('');
  const [address, setAddress] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageAsset | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
  };

  const validateInputs = (): boolean => {
    if (!propertyName.trim()) {
      Alert.alert('Validation Error', 'Please enter property name');
      return false;
    }
    if (!address.trim()) {
      Alert.alert('Validation Error', 'Please enter Address');
      return false;
    }
    // Images are now OPTIONAL
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
      console.log(`📸 Image to upload: ${selectedImage ? 1 : 0}`);

      const propertyId = await saveProperty({
        name: propertyName.trim(),
        address: address.trim(),
        image_url: '',
        total_rooms: 0,
      });

      // Upload image if selected
      if (selectedImage) {
        console.log('📤 Uploading image...');
        const imageUrl = await uploadPropertyImage(propertyId, selectedImage.uri);
        console.log('✓ Image uploaded');

        // Update property with image_url
        await updateProperty(propertyId, { image_url: imageUrl });
        console.log('✓ Property updated with image');
      } else {
        console.log('⏭️  No image uploaded');
      }

      console.log('✓ Property saved successfully');

      Alert.alert('Success', 'Property saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form and navigate back
            setPropertyName('');
            setAddress('');
            setSelectedImage(null);
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

  const handleDiscardDraft = () => {
    Alert.alert('Discard Draft', 'Are you sure you want to discard this draft?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          setPropertyName('');
          setAddress('');
          setSelectedImage(null);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.statusBarShield, { height: insets.top, backgroundColor: '#fff' }]} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={[styles.header, { paddingTop: 10 }]}>
            <Text style={styles.headerTitle}>New Property</Text>
          </View>

          {/* Property Name Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter property name (e.g., Star Hostel)"
              value={propertyName}
              onChangeText={setPropertyName}
              editable={!isLoading}
              placeholderTextColor="#bbb"
            />
          </View>

          {/* Image Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Upload Image (Optional)</Text>
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
              placeholder="Address"
              value={address}
              onChangeText={setAddress}
              editable={!isLoading}
              multiline
              numberOfLines={3}
              placeholderTextColor="#bbb"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.discardButton]}
              onPress={handleDiscardDraft}
              disabled={isLoading}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="trash-outline" size={18} color="#555" style={{ marginRight: 6 }} />
                <Text style={styles.discardButtonText}>Discard</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSaveProperty}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark-done" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.saveButtonText}>Save Property</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AddPropertyScreen;
