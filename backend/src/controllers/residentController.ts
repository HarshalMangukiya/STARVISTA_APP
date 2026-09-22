import { Request, Response, NextFunction } from 'express';
import { residentService } from '../services/residentService.js';
import { sendSuccess } from '../utils/response.js';
import { auditService } from '../services/auditService.js';

export class ResidentController {
  async getResidents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const residents = await residentService.getResidentsByRoom(req.params.roomId);
      sendSuccess(res, residents, 'Residents retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async addResident(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resident = await residentService.addResident(
        req.params.propertyId,
        req.params.roomId,
        req.body
      );

      await auditService.log({
        actorId: req.user!.id,
        action: 'RESIDENT_ADD',
        entity: 'Resident',
        entityId: resident.id,
        metadata: {
          propertyId: req.params.propertyId,
          roomId: req.params.roomId,
          name: resident.name,
        },
        ipAddress: req.ip,
      });

      sendSuccess(res, resident, 'Resident added successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateResident(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resident = await residentService.updateResident(req.params.residentId, req.body);

      await auditService.log({
        actorId: req.user!.id,
        action: 'RESIDENT_UPDATE',
        entity: 'Resident',
        entityId: resident.id,
        ipAddress: req.ip,
      });

      sendSuccess(res, resident, 'Resident updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updatePaymentDates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await residentService.updatePaymentDates(req.params.residentId, req.body);

      await auditService.log({
        actorId: req.user!.id,
        action: 'PAYMENT_UPDATE',
        entity: 'RentCycle',
        entityId: result.id,
        metadata: {
          residentId: req.params.residentId,
          startDate: result.startDate,
          endDate: result.endDate,
        },
        ipAddress: req.ip,
      });

      sendSuccess(res, result, 'Payment dates updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteResident(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await residentService.deleteResident(req.params.residentId);

      await auditService.log({
        actorId: req.user!.id,
        action: 'RESIDENT_DELETE',
        entity: 'Resident',
        entityId: req.params.residentId,
        ipAddress: req.ip,
      });

      sendSuccess(res, null, 'Resident removed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const residentController = new ResidentController();
