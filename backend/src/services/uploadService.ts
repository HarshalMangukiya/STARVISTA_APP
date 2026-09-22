import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { BadRequestError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class UploadService {
  /**
   * Upload an image to Cloudinary.
   * Accepts either a base64 data URI or a file URL.
   */
  async uploadImage(
    imageData: string,
    options: {
      folder?: string;
      publicId?: string;
      transformation?: any;
    } = {}
  ): Promise<{ url: string; publicId: string }> {
    if (!isCloudinaryConfigured) {
      throw new BadRequestError(
        'Cloudinary is not configured. Set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.'
      );
    }

    try {
      const result = await cloudinary.uploader.upload(imageData, {
        folder: options.folder || 'starvista',
        public_id: options.publicId,
        transformation: options.transformation || [
          { width: 800, height: 800, crop: 'limit', quality: 'auto:good' },
        ],
        resource_type: 'image',
      });

      logger.info(`Image uploaded to Cloudinary: ${result.public_id}`);

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error: any) {
      logger.error(`Cloudinary upload failed: ${error?.message || error}`);
      throw new BadRequestError('Image upload failed. Please try again.');
    }
  }

  /**
   * Delete an image from Cloudinary by public ID
   */
  async deleteImage(publicId: string): Promise<void> {
    if (!isCloudinaryConfigured) return;

    try {
      await cloudinary.uploader.destroy(publicId);
      logger.info(`Image deleted from Cloudinary: ${publicId}`);
    } catch (error: any) {
      logger.warn(`Cloudinary delete failed for ${publicId}: ${error?.message || error}`);
    }
  }
}

export const uploadService = new UploadService();
