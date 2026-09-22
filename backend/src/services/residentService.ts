import { residentRepository } from '../repositories/residentRepository.js';
import { roomRepository } from '../repositories/roomRepository.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import {
  CreateResidentInput,
  UpdateResidentInput,
  UpdatePaymentDatesInput,
} from '../validators/residentValidators.js';
import { Gender } from '@prisma/client';
import { logger } from '../utils/logger.js';

const normalizeGender = (gender: string): Gender => {
  const upper = gender.toUpperCase();
  if (upper === 'MALE') return 'MALE';
  if (upper === 'FEMALE') return 'FEMALE';
  return 'OTHER';
};

export class ResidentService {
  async getResidentsByRoom(roomId: string) {
    const room = await roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundError('Room not found');
    }

    const residents = await residentRepository.findByRoomId(roomId);

    return residents.map((r: any) => ({
      id: r.id,
      name: r.name,
      gender: r.gender,
      email: r.email,
      phone: r.phone,
      remarks: r.remarks,
      startDate: r.rent_cycles?.[0]?.start_date || null,
      endDate: r.rent_cycles?.[0]?.end_date || null,
      rentAmount: r.rent_cycles?.[0]?.amount ? Number(r.rent_cycles[0].amount) : 0,
      paymentStatus: r.rent_cycles?.[0]?.status || 'PAID',
      createdAt: r.created_at,
    }));
  }

  async addResident(propertyId: string, roomId: string, input: CreateResidentInput) {
    // Verify room exists and belongs to property
    const room = await roomRepository.findById(roomId);
    if (!room || room.property_id !== propertyId) {
      throw new NotFoundError('Room not found in this property');
    }

    const startDate = new Date(input.start_date);
    const endDate = new Date(input.end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestError('Invalid date format for start_date or end_date');
    }

    if (endDate <= startDate) {
      throw new BadRequestError('End date must be after start date');
    }

    const resident = await residentRepository.createWithRentCycle({
      property_id: propertyId,
      room_id: roomId,
      name: input.name,
      gender: normalizeGender(input.gender),
      email: input.email || undefined,
      phone: input.phone,
      remarks: input.remarks,
      start_date: startDate,
      end_date: endDate,
      monthly_rent: Number(room.monthly_rent),
    });

    logger.info(`Resident added: ${resident.id} to room: ${roomId}`);

    return {
      id: resident.id,
      name: resident.name,
      gender: resident.gender,
      email: resident.email,
      phone: resident.phone,
      remarks: resident.remarks,
      startDate,
      endDate,
      rentAmount: Number(room.monthly_rent),
      createdAt: resident.created_at,
    };
  }

  async updateResident(residentId: string, input: UpdateResidentInput) {
    const resident = await residentRepository.findById(residentId);
    if (!resident) {
      throw new NotFoundError('Resident not found');
    }

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.gender !== undefined) updateData.gender = normalizeGender(input.gender);
    if (input.email !== undefined) updateData.email = input.email || null;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.remarks !== undefined) updateData.remarks = input.remarks;

    const updated = await residentRepository.update(residentId, updateData);

    logger.info(`Resident updated: ${residentId}`);

    return {
      id: updated.id,
      name: updated.name,
      gender: updated.gender,
      email: updated.email,
      phone: updated.phone,
      remarks: updated.remarks,
      createdAt: updated.created_at,
    };
  }

  async updatePaymentDates(residentId: string, input: UpdatePaymentDatesInput) {
    const resident: any = await residentRepository.findById(residentId);
    if (!resident) {
      throw new NotFoundError('Resident not found');
    }

    const startDate = new Date(input.start_date);
    const endDate = new Date(input.end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestError('Invalid date format');
    }

    if (endDate <= startDate) {
      throw new BadRequestError('End date must be after start date');
    }

    const rentCycle = await residentRepository.updateRentCycle(residentId, {
      property_id: resident.property_id,
      room_id: resident.room_id,
      start_date: startDate,
      end_date: endDate,
      amount: input.amount,
      notes: input.notes,
    });

    logger.info(`Payment dates updated for resident: ${residentId}`);

    return {
      id: rentCycle.id,
      residentId: rentCycle.resident_id,
      startDate: rentCycle.start_date,
      endDate: rentCycle.end_date,
      amount: Number(rentCycle.amount),
      status: rentCycle.status,
      notes: rentCycle.notes,
      createdAt: rentCycle.created_at,
    };
  }

  async deleteResident(residentId: string) {
    const resident = await residentRepository.findById(residentId);
    if (!resident) {
      throw new NotFoundError('Resident not found');
    }

    await residentRepository.softDelete(residentId);
    logger.info(`Resident soft-deleted: ${residentId}`);
  }
}

export const residentService = new ResidentService();
