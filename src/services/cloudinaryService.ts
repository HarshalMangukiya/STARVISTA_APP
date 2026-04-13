/**
 * Cloudinary Image Upload Service
 * 
 * Uses unsigned uploads with public upload preset for security
 * No need for API key/secret on frontend
 */

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = 'doe8ybkzu';
const CLOUDINARY_UPLOAD_PRESET = 'STARVISTA';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface CloudinaryResponse {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  original_filename: string;
}

interface UploadResult {
  url: string;
  public_id: string;
  secure_url: string;
}

/**
 * Get user-friendly error message from Cloudinary errors
 */
const getErrorMessage = (error: any): string => {
  const errorMessage = error?.message || error?.error?.message || '';
  const errorCode = error?.error?.http_code || error?.status || '';

  console.error('❌ Cloudinary Error Details:', {
    message: errorMessage,
    code: errorCode,
    fullError: error,
  });

  if (errorMessage.includes('Invalid upload preset')) {
    return 'Cloudinary configuration error: Invalid upload preset. Please verify the preset name is correct.';
  }
  if (errorMessage.includes('Request entity too large')) {
    return 'Image file is too large. Please select an image smaller than 100MB.';
  }
  if (errorCode === 400) {
    return 'Bad request to Cloudinary. Please verify the image format and try again.';
  }
  if (errorCode === 401 || errorCode === 403) {
    return 'Cloudinary authentication failed. Please verify your cloud name and upload preset.';
  }
  if (errorCode === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (errorMessage.includes('Network')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  return errorMessage || 'Failed to upload image. Please try again.';
};

/**
 * Convert React Native image URI to FormData blob
 * React Native's FormData can handle URIs directly, no fetch needed
 */
const fileUriToFormDataBlob = (uri: string): any => {
  // React Native FormData can handle file URIs directly
  // Return an object that FormData will convert to a blob
  return {
    uri: uri,
    type: 'image/jpeg',
    name: 'image.jpg',
  };
};

/**
 * Create FormData for Cloudinary upload
 * Unsigned upload requires: file, upload_preset
 */
const createUploadFormData = (fileBlob: any, filename: string): FormData => {
  const formData = new FormData();

  // REQUIRED: The image file (React Native will handle the URI)
  formData.append('file', fileBlob);

  // REQUIRED: Upload preset (configured in Cloudinary console)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  // OPTIONAL: Additional parameters for better organization
  formData.append('folder', 'starvista-properties');
  formData.append('resource_type', 'auto');

  console.log('📝 FormData created with:');
  console.log('   - File: ' + filename);
  console.log('   - Preset:', CLOUDINARY_UPLOAD_PRESET);
  console.log('   - Folder: starvista-properties');

  return formData;
};

/**
 * Upload image to Cloudinary using unsigned upload
 *
 * Why unsigned upload?
 * - No API key/secret needed on frontend
 * - Uses upload preset configured in Cloudinary dashboard
 * - Safer for mobile apps (no credentials exposed)
 * - Perfect for user-uploaded content
 *
 * @param imageUri - Local file URI (file://, content://, etc.)
 * @param filename - Filename for the upload (optional)
 * @returns UploadResult with URL and public_id
 */
export const uploadImageToCloudinary = async (
  imageUri: string,
  filename?: string
): Promise<UploadResult> => {
  const uploadFileName = filename || `starvista-${Date.now()}`;

  try {
    console.log('\n🚀 Starting Cloudinary image upload...');
    console.log(`🔄 Cloud Name: ${CLOUDINARY_CLOUD_NAME}`);
    console.log(`📤 Upload Preset: ${CLOUDINARY_UPLOAD_PRESET}`);
    console.log(`📸 Image URI: ${imageUri.substring(0, 60)}...`);

    // STEP 1: Convert URI to FormData-compatible blob
    console.log('⏳ Preparing image for upload...');
    const fileBlob = fileUriToFormDataBlob(imageUri);

    // STEP 2: Create FormData with required fields
    console.log('⏳ Building upload request...');
    const formData = createUploadFormData(fileBlob, uploadFileName);

    // STEP 3: Upload to Cloudinary with timeout
    console.log('⬆️  Uploading to Cloudinary...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for larger files

    try {
      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`📡 Response received with status: ${response.status}`);

      // STEP 4: Parse response
      if (!response.ok) {
        let errorData: any = { error: { message: `HTTP ${response.status}` } };
        try {
          errorData = await response.json();
          console.error('❌ Cloudinary error response:', errorData);
        } catch (parseError) {
          console.error('❌ Could not parse error response:', await response.text());
        }

        throw {
          message: errorData?.error?.message || `Upload failed with status ${response.status}`,
          error: errorData?.error || { http_code: response.status },
          status: response.status,
        };
      }

      const data: CloudinaryResponse = await response.json();
      console.log('✅ Upload successful!');
      console.log(`   - Public ID: ${data.public_id}`);
      console.log(`   - Dimensions: ${data.width}x${data.height}`);
      console.log(`   - Format: ${data.format}`);
      console.log(`   - Size: ${(data.bytes / 1024).toFixed(2)} KB`);
      console.log(`   - URL: ${data.secure_url.substring(0, 70)}...`);

      // STEP 5: Return structured result
      return {
        url: data.url,
        public_id: data.public_id,
        secure_url: data.secure_url,
      };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('❌ Upload timeout - request exceeded 120 seconds');
        throw new Error('Upload took too long. Please try again with a smaller image.');
      }
      
      throw fetchError;
    }
  } catch (error: any) {
    console.error('❌ Image upload error:', error);
    console.error('   Error type:', error?.name);
    console.error('   Error message:', error?.message);
    const userMessage = getErrorMessage(error);
    throw new Error(`Image upload failed: ${userMessage}`);
  }
};

/**
 * Upload multiple images to Cloudinary in parallel
 *
 * @param imageUris - Array of local file URIs
 * @returns Array of UploadResult objects
 */
export const uploadMultipleImages = async (
  imageUris: string[]
): Promise<UploadResult[]> => {
  try {
    console.log(`📷 Starting upload of ${imageUris.length} images...`);

    // Upload all images in parallel (faster than sequential)
    const uploadPromises = imageUris.map((uri, index) => {
      const filename = `starvista-${Date.now()}-${index}.jpg`;
      return uploadImageToCloudinary(uri, filename);
    });

    const results = await Promise.all(uploadPromises);
    console.log(`✅ Successfully uploaded ${results.length} images`);

    return results;
  } catch (error: any) {
    console.error('❌ Error uploading multiple images:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary using public_id
 *
 * Note: This uses the destroy endpoint and requires authentication
 * For production, implement this on your backend server
 * Do NOT expose your API secret on the frontend!
 *
 * For now, images remain in Cloudinary until manually deleted from dashboard
 */
export const deleteImageFromCloudinary = async (publicId: string): Promise<void> => {
  console.warn('⚠️  Direct deletion from frontend is not implemented.');
  console.warn('    To delete images, use the Cloudinary dashboard or backend API.');
  console.warn(`    Public ID to delete: ${publicId}`);

  // PRODUCTION IMPLEMENTATION:
  // Call your backend API endpoint that will:
  // 1. Use your API Secret (never expose on frontend)
  // 2. Call Cloudinary destroy API
  // 3. Return result to frontend

  // Example (DO NOT IMPLEMENT ON FRONTEND):
  // const response = await fetch('/api/cloudinary/delete', {
  //   method: 'POST',
  //   body: JSON.stringify({ publicId }),
  // });
};

/**
 * DIAGNOSTIC FUNCTION: Test Cloudinary connectivity
 * Call this to verify the Cloudinary setup is correct
 * 
 * Usage:
 * import { testCloudinaryConnection } from './cloudinaryService';
 * await testCloudinaryConnection();
 */
export const testCloudinaryConnection = async (): Promise<void> => {
  console.log('\n🔍 CLOUDINARY CONNECTION TEST');
  console.log('================================');
  console.log(`Cloud Name: ${CLOUDINARY_CLOUD_NAME}`);
  console.log(`Upload Preset: ${CLOUDINARY_UPLOAD_PRESET}`);
  console.log(`Upload URL: ${CLOUDINARY_UPLOAD_URL}`);

  try {
    // Create a minimal FormData to test connectivity
    const testFormData = new FormData();
    testFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    testFormData.append('test', 'true');

    console.log('\n⏳ Testing endpoint connectivity...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const testResponse = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: testFormData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(`✅ Endpoint is reachable (Status: ${testResponse.status})`);
    
    if (testResponse.status === 400) {
      console.log('ℹ️  Got 400 error (expected for test without file)');
      
      try {
        const errorResponse = await testResponse.json();
        console.log('📝 Response:', errorResponse);
        
        if (errorResponse?.error?.message?.includes('Invalid upload preset')) {
          console.error('❌ PROBLEM: Upload preset "' + CLOUDINARY_UPLOAD_PRESET + '" is invalid or not configured for unsigned uploads');
          console.log('💡 Solution: Check Cloudinary dashboard > Settings > Upload > Add upload preset');
        }
      } catch {
        console.log('Response body:', await testResponse.text());
      }
    } else if (testResponse.ok) {
      console.log('✅ Preset is valid and working!');
    }

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('❌ PROBLEM: Request timed out - Cloudinary endpoint may be unreachable');
      console.log('💡 Solution: Check your internet connection or Cloudinary service status');
    } else {
      console.error('❌ PROBLEM: Connection test failed:', error.message);
      console.log('💡 Solution:', error.message);
    }
  }
};

/**
 * Generate thumbnail URL from Cloudinary URL
 *
 * Cloudinary allows URL-based transformations
 * No backend needed - all done through URL query parameters
 *
 * @param secureUrl - The secure_url returned from upload
 * @param width - Thumbnail width in pixels
 * @param height - Thumbnail height in pixels
 * @returns URL to the resized thumbnail
 */
export const generateThumbnail = (
  secureUrl: string,
  width: number = 200,
  height: number = 200
): string => {
  // Insert transformation parameters before the filename
  // Pattern: https://res.cloudinary.com/{cloud}/{type}/upload/{transformations}/{public_id.format}
  // Insert: /w_{width},h_{height},c_fill,q_auto

  const thumbnailUrl = secureUrl.replace(
    '/upload/',
    `/upload/w_${width},h_${height},c_fill,q_auto/`
  );

  console.log('📸 Thumbnail URL generated');
  console.log(`   Original: ${secureUrl.substring(0, 60)}...`);
  console.log(`   Thumbnail: ${thumbnailUrl.substring(0, 80)}...`);

  return thumbnailUrl;
};

/**
 * Optimize Cloudinary URL for web/mobile
 *
 * @param secureUrl - The secure_url from upload
 * @param options - Transformation options
 * @returns Optimized URL
 */
export const optimizeImageUrl = (
  secureUrl: string,
  options?: {
    width?: number;
    quality?: 'auto' | 'low' | 'medium' | 'high';
    format?: 'auto' | 'webp' | 'jpg';
  }
): string => {
  const width = options?.width || 800;
  const quality = options?.quality || 'auto';
  const format = options?.format || 'auto';

  // Format: /upload/w_{width},f_{format},q_{quality}/
  const optimizedUrl = secureUrl.replace(
    '/upload/',
    `/upload/w_${width},f_${format},q_${quality}/`
  );

  return optimizedUrl;
};

/**
 * Configuration and Documentation
 *
 * CLOUDINARY SETUP CHECKLIST:
 * ✅ 1. Create Cloudinary account: https://cloudinary.com
 * ✅ 2. Get Cloud Name: doe8ybkzu
 * ✅ 3. Create Upload Preset:
 *      - Cloudinary Dashboard → Settings → Upload
 *      - Add New Upload Preset
 *      - Name: STARVISTA
 *      - Type: Unsigned
 *      - Save
 *
 * SECURITY NOTES:
 * ✅ Uses unsigned upload (no API secret needed)
 * ✅ No credentials exposed in frontend
 * ✅ Upload Preset configured in Cloudinary dashboard
 * ✅ File size limits can be set in preset settings
 * ✅ Organized in "starvista-properties" folder
 *
 * API LIMITS (Free Tier):
 * - Up to 25 uploads per hour (can be increased)
 * - Up to 25MB file size
 * - Unlimited storage for free tier (with fair use policy)
 *
 * USAGE EXAMPLE:
 * const result = await uploadImageToCloudinary('file:///path/to/image.jpg');
 * // Returns: { url, public_id, secure_url }
 *
 * // Save to Firestore
 * await updateProperty(propertyId, { imageUrl: result.secure_url });
 *
 * // Display in Image component
 * <Image source={{ uri: result.secure_url }} />
 */
