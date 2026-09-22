import { prisma } from '../config/database.js';
import { Property } from '@prisma/client';

export class PropertyRepository {
  async findById(id: string): Promise<Property | null> {
    return prisma.property.findFirst({
      where: { id, is_active: true },
      include: {
        _count: {
          select: { rooms: { where: { is_active: true } }, residents: { where: { is_active: true } } },
        },
      },
    });
  }

  async findByOwner(
    ownerId: string,
    options: { page?: number; limit?: number; search?: string } = {}
  ): Promise<{ properties: Property[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      owner_id: ownerId,
      is_active: true,
    };

    if (options.search) {
      whereClause.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { address: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: {
              rooms: { where: { is_active: true } },
              residents: { where: { is_active: true } },
            },
          },
        },
      }),
      prisma.property.count({ where: whereClause }),
    ]);

    return { properties, total };
  }

  async findAll(
    options: { page?: number; limit?: number; search?: string } = {}
  ): Promise<{ properties: Property[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause: any = { is_active: true };

    if (options.search) {
      whereClause.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { address: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: {
              rooms: { where: { is_active: true } },
              residents: { where: { is_active: true } },
            },
          },
        },
      }),
      prisma.property.count({ where: whereClause }),
    ]);

    return { properties, total };
  }

  async create(data: {
    name: string;
    address: string;
    image_url?: string;
    owner_id: string;
    total_rooms?: number;
    firestore_id?: string;
  }): Promise<Property> {
    return prisma.property.create({
      data: {
        name: data.name,
        address: data.address,
        image_url: data.image_url || '',
        owner_id: data.owner_id,
        total_rooms: data.total_rooms || 0,
        firestore_id: data.firestore_id,
      },
    });
  }

  async update(id: string, data: Partial<Property>): Promise<Property> {
    return prisma.property.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Property> {
    return prisma.property.update({
      where: { id },
      data: { is_active: false },
    });
  }
}

export const propertyRepository = new PropertyRepository();
