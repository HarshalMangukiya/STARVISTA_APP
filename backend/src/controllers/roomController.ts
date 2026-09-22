import { Request, Response, NextFunction } from 'express';
import { roomService } from '../services/roomService.js';
import { sendSuccess } from '../utils/response.js';
import { auditService } from '../services/auditService.js';

export class RoomController {
  async getRoomsByProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rooms = await roomService.getRoomsByProperty(req.params.propertyId);
      sendSuccess(res, rooms, 'Rooms retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const room = await roomService.getRoomById(req.params.roomId);
      sendSuccess(res, room, 'Room retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const room = await roomService.createRoom(req.params.propertyId, req.body);

      await auditService.log({
        actorId: req.user!.id,
        action: 'ROOM_CREATE',
        entity: 'Room',
        entityId: room.id,
        metadata: { propertyId: req.params.propertyId, roomNo: room.roomNo },
        ipAddress: req.ip,
      });

      sendSuccess(res, room, 'Room created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const room = await roomService.updateRoom(req.params.roomId, req.body);

      await auditService.log({
        actorId: req.user!.id,
        action: 'ROOM_UPDATE',
        entity: 'Room',
        entityId: room.id,
        metadata: { roomNo: room.roomNo },
        ipAddress: req.ip,
      });

      sendSuccess(res, room, 'Room updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await roomService.deleteRoom(req.params.roomId);

      await auditService.log({
        actorId: req.user!.id,
        action: 'ROOM_DELETE',
        entity: 'Room',
        entityId: req.params.roomId,
        ipAddress: req.ip,
      });

      sendSuccess(res, null, 'Room deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const roomController = new RoomController();
