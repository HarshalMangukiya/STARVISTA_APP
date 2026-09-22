import { Request, Response, NextFunction } from 'express';
import { uploadService } from '../services/uploadService.js';
import { sendSuccess } from '../utils/response.js';
import { BadRequestError } from '../utils/errors.js';

export class UploadController {
  async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { image, folder } = req.body;

      if (!image) {
        throw new BadRequestError('Image data is required (base64 or URL)');
      }

      const result = await uploadService.uploadImage(image, {
        folder: folder || 'starvista',
      });

      sendSuccess(res, result, 'Image uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();
