import { roomRepository } from '../repositories/roomRepository.js';
import { propertyRepository } from '../repositories/propertyRepository.js';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';
import { CreateRoomInput, UpdateRoomInput } from '../validators/roomValidators.js';
import { logger } from '../utils/logger.js';

export class RoomService {
  async getRoomsByProperty(propertyId: string) {
    // Verify property exists
    const property = await propertyRepository.findById(propertyId);
    if (!property) {
      throw new NotFoundError('Property not found');
    }

    const rooms = await roomRepository.findByPropertyIdWithResidents(propertyId);

    return rooms.map((room: any) => ({
      id: room.id,
      propertyId: room.property_id,
      roomNo: room.room_no,
      capacity: room.capacity,
      monthlyRent: Number(room.monthly_rent),
      residents: (room.residents || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        gender: r.gender,
        email: r.email,
        phone: r.phone,
        remarks: r.remarks,
        startDate: r.rent_cycles?.[0]?.start_date || null,
        endDate: r.rent_cycles?.[0]?.end_date || null,
        rentAmount: r.rent_cycles?.[0]?.amount ? Number(r.rent_cycles[0].amount) : Number(room.monthly_rent),
        paymentStatus: r.rent_cycles?.[0]?.status || 'PAID',
        createdAt: r.created_at,
      })),
      residentCount: (room.residents || []).length,
      createdAt: room.created_at,
      updatedAt: room.updated_at,
    }));
  }

  async getRoomById(roomId: string) {
    const room: any = await roomRepository.findByIdWithResidents(roomId);
    if (!room) {
      throw new NotFoundError('Room not found');
    }

    return {
      id: room.id,
      propertyId: room.property_id,
      roomNo: room.room_no,
      capacity: room.capacity,
      monthlyRent: Number(room.monthly_rent),
      residents: (room.residents || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        gender: r.gender,
        email: r.email,
        phone: r.phone,
        remarks: r.remarks,
        startDate: r.rent_cycles?.[0]?.start_date || null,
        endDate: r.rent_cycles?.[0]?.end_date || null,
        rentAmount: r.rent_cycles?.[0]?.amount ? Number(r.rent_cycles[0].amount) : Number(room.monthly_rent),
        paymentStatus: r.rent_cycles?.[0]?.status || 'PAID',
        createdAt: r.created_at,
      })),
      residentCount: (room.residents || []).length,
      createdAt: room.created_at,
      updatedAt: room.updated_at,
    };
  }

  async createRoom(propertyId: string, input: CreateRoomInput) {
    // Verify property exists
    const property = await propertyRepository.findById(propertyId);
    if (!property) {
      throw new NotFoundError('Property not found');
    }

    const room = await roomRepository.create({
      property_id: propertyId,
      room_no: input.room_no,
      capacity: input.capacity,
      monthly_rent: input.monthly_rent,
    });

    logger.info(`Room created: ${room.id} in property: ${propertyId}`);

    return {
      id: room.id,
      propertyId: room.property_id,
      roomNo: room.room_no,
      capacity: room.capacity,
      monthlyRent: Number(room.monthly_rent),
      createdAt: room.created_at,
      updatedAt: room.updated_at,
    };
  }

  async updateRoom(roomId: string, input: UpdateRoomInput) {
    const room = await roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundError('Room not found');
    }

    const updateData: any = {};
    if (input.room_no !== undefined) updateData.room_no = input.room_no;
    if (input.capacity !== undefined) {
      // Ensure new capacity is not less than current resident count
      const currentResidents = await roomRepository.countActiveResidents(roomId);
      if (input.capacity < currentResidents) {
        throw new BadRequestError(
          `Cannot reduce capacity to ${input.capacity}. Room currently has ${currentResidents} active residents.`
        );
      }
      updateData.capacity = input.capacity;
    }
    if (input.monthly_rent !== undefined) updateData.monthly_rent = input.monthly_rent;

    const updated = await roomRepository.update(roomId, updateData);

    logger.info(`Room updated: ${roomId}`);

    return {
      id: updated.id,
      propertyId: updated.property_id,
      roomNo: updated.room_no,
      capacity: updated.capacity,
      monthlyRent: Number(updated.monthly_rent),
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  }

  async deleteRoom(roomId: string) {
    const room = await roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundError('Room not found');
    }

    // Business rule: Cannot delete a room with active residents
    const activeResidents = await roomRepository.countActiveResidents(roomId);
    if (activeResidents > 0) {
      throw new BadRequestError(
        `Cannot delete room. It currently has ${activeResidents} active resident(s). Please remove all residents before deleting the room.`
      );
    }

    await roomRepository.softDelete(roomId);
    logger.info(`Room soft-deleted: ${roomId}`);
  }
}

export const roomService = new RoomService();
