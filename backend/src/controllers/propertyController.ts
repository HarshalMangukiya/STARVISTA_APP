import { Request, Response, NextFunction } from 'express';
import { propertyService } from '../services/propertyService.js';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response.js';
import { auditService } from '../services/auditService.js';

export class PropertyController {
  async getProperties(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search } = req.query as any;
      const { properties, total } = await propertyService.getPropertiesByOwner(req.user!.id, {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        search: search as string,
      });

      sendPaginatedSuccess(
        res,
        properties,
        { page: Number(page) || 1, limit: Number(limit) || 20, total },
        'Properties retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  async getProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const property = await propertyService.getPropertyById(req.params.id, req.user!.id);
      sendSuccess(res, property, 'Property retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const property = await propertyService.createProperty(req.user!.id, req.body);

      await auditService.log({
        actorId: req.user!.id,
        action: 'PROPERTY_CREATE',
        entity: 'Property',
        entityId: property.id,
        metadata: { name: property.name },
        ipAddress: req.ip,
      });

      sendSuccess(res, property, 'Property created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const property = await propertyService.updateProperty(req.params.id, req.user!.id, req.body);

      await auditService.log({
        actorId: req.user!.id,
        action: 'PROPERTY_UPDATE',
        entity: 'Property',
        entityId: property.id,
        metadata: { name: property.name },
        ipAddress: req.ip,
      });

      sendSuccess(res, property, 'Property updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await propertyService.deleteProperty(req.params.id, req.user!.id);

      await auditService.log({
        actorId: req.user!.id,
        action: 'PROPERTY_DELETE',
        entity: 'Property',
        entityId: req.params.id,
        ipAddress: req.ip,
      });

      sendSuccess(res, null, 'Property deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const propertyController = new PropertyController();
