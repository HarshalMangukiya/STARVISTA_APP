import { prisma } from '../config/database.js';
import { Resident, Gender, PaymentStatus } from '@prisma/client';

export class ResidentRepository {
  async findById(id: string) {
    return prisma.resident.findFirst({
      where: { id, is_active: true },
      include: {
        room: true,
        property: true,
        rent_cycles: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });
  }

  async findByPropertyId(propertyId: string) {
    return prisma.resident.findMany({
      where: { property_id: propertyId, is_active: true },
      include: {
        room: true,
        rent_cycles: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findByRoomId(roomId: string) {
    return prisma.resident.findMany({
      where: { room_id: roomId, is_active: true },
      include: {
        rent_cycles: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async createWithRentCycle(data: {
    property_id: string;
    room_id: string;
    name: string;
    gender: Gender;
    email?: string;
    phone: string;
    remarks?: string;
    start_date: Date;
    end_date: Date;
    monthly_rent: number;
    firestore_id?: string;
  }) {
    // Database transaction to allocate bed and record rent cycle atomically
    return prisma.$transaction(async (tx) => {
      // 1. Check room capacity
      const room = await tx.room.findUnique({
        where: { id: data.room_id },
        include: {
          _count: {
            select: { residents: { where: { is_active: true } } },
          },
        },
      });

      if (!room || !room.is_active) {
        throw new Error('Room not found or inactive');
      }

      if (room._count.residents >= room.capacity) {
        throw new Error('Room is already at full capacity');
      }

      // 2. Create resident
      const resident = await tx.resident.create({
        data: {
          property_id: data.property_id,
          room_id: data.room_id,
          name: data.name,
          gender: data.gender,
          email: data.email,
          phone: data.phone,
          remarks: data.remarks || '',
          firestore_id: data.firestore_id,
        },
      });

      // 3. Determine initial payment status
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffTime = data.end_date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let status: PaymentStatus = 'PAID';
      if (diffDays <= 0) {
        status = 'PENDING';
      } else if (diffDays <= 7) {
        status = 'UPCOMING';
      }

      // 4. Create rent cycle
      await tx.rentCycle.create({
        data: {
          resident_id: resident.id,
          property_id: data.property_id,
          room_id: data.room_id,
          start_date: data.start_date,
          end_date: data.end_date,
          amount: data.monthly_rent,
          status,
        },
      });

      return resident;
    });
  }

  async update(id: string, data: Partial<Resident>): Promise<Resident> {
    return prisma.resident.update({
      where: { id },
      data,
    });
  }

  async updateRentCycle(
    residentId: string,
    data: {
      property_id: string;
      room_id: string;
      start_date: Date;
      end_date: Date;
      amount?: number;
      notes?: string;
    }
  ) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = data.end_date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status: PaymentStatus = 'PAID';
    if (diffDays <= 0) {
      status = 'PENDING';
    } else if (diffDays <= 7) {
      status = 'UPCOMING';
    }

    return prisma.rentCycle.create({
      data: {
        resident_id: residentId,
        property_id: data.property_id,
        room_id: data.room_id,
        start_date: data.start_date,
        end_date: data.end_date,
        amount: data.amount || 0,
        status,
        notes: data.notes,
      },
    });
  }

  async softDelete(id: string): Promise<Resident> {
    return prisma.resident.update({
      where: { id },
      data: { is_active: false },
    });
  }
}

export const residentRepository = new ResidentRepository();
