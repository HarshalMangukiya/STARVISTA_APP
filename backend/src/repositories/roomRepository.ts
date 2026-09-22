import { prisma } from '../config/database.js';
import { Room } from '@prisma/client';

export class RoomRepository {
  async findById(id: string): Promise<Room | null> {
    return prisma.room.findFirst({
      where: { id, is_active: true },
    });
  }

  async findByPropertyId(propertyId: string): Promise<Room[]> {
    return prisma.room.findMany({
      where: { property_id: propertyId, is_active: true },
      orderBy: { room_no: 'asc' },
    });
  }

  async findByPropertyIdWithResidents(propertyId: string) {
    return prisma.room.findMany({
      where: { property_id: propertyId, is_active: true },
      include: {
        residents: {
          where: { is_active: true },
          include: {
            rent_cycles: {
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: { room_no: 'asc' },
    });
  }

  async findByIdWithResidents(id: string) {
    return prisma.room.findFirst({
      where: { id, is_active: true },
      include: {
        residents: {
          where: { is_active: true },
          include: {
            rent_cycles: {
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });
  }

  async create(data: {
    property_id: string;
    room_no: string;
    capacity: number;
    monthly_rent: number;
    firestore_id?: string;
  }): Promise<Room> {
    return prisma.room.create({
      data: {
        property_id: data.property_id,
        room_no: data.room_no,
        capacity: data.capacity,
        monthly_rent: data.monthly_rent,
        firestore_id: data.firestore_id,
      },
    });
  }

  async update(id: string, data: Partial<Room>): Promise<Room> {
    return prisma.room.update({
      where: { id },
      data,
    });
  }

  async countActiveResidents(roomId: string): Promise<number> {
    return prisma.resident.count({
      where: { room_id: roomId, is_active: true },
    });
  }

  async softDelete(id: string): Promise<Room> {
    return prisma.room.update({
      where: { id },
      data: { is_active: false },
    });
  }
}

export const roomRepository = new RoomRepository();
