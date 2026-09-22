import { propertyRepository } from '../repositories/propertyRepository.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { CreatePropertyInput, UpdatePropertyInput } from '../validators/propertyValidators.js';
import { logger } from '../utils/logger.js';

export class PropertyService {
  async getPropertiesByOwner(
    ownerId: string,
    options: { page?: number; limit?: number; search?: string } = {}
  ) {
    const { properties, total } = await propertyRepository.findByOwner(ownerId, options);

    return {
      properties: properties.map((p: any) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        imageUrl: p.image_url,
        ownerId: p.owner_id,
        totalRooms: p.total_rooms,
        roomCount: p._count?.rooms ?? 0,
        residentCount: p._count?.residents ?? 0,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
      total,
    };
  }

  async getPropertyById(propertyId: string, ownerId: string) {
    const property: any = await propertyRepository.findById(propertyId);
    if (!property) {
      throw new NotFoundError('Property not found');
    }

    // Ownership check (SUPER_ADMIN bypass is handled by middleware)
    if (property.owner_id !== ownerId) {
      throw new ForbiddenError('You do not have access to this property');
    }

    return {
      id: property.id,
      name: property.name,
      address: property.address,
      imageUrl: property.image_url,
      ownerId: property.owner_id,
      totalRooms: property.total_rooms,
      roomCount: property._count?.rooms ?? 0,
      residentCount: property._count?.residents ?? 0,
      createdAt: property.created_at,
      updatedAt: property.updated_at,
    };
  }

  async createProperty(ownerId: string, input: CreatePropertyInput) {
    const property = await propertyRepository.create({
      name: input.name,
      address: input.address,
      image_url: input.image_url,
      owner_id: ownerId,
      total_rooms: input.total_rooms,
    });

    logger.info(`Property created: ${property.id} by owner: ${ownerId}`);

    return {
      id: property.id,
      name: property.name,
      address: property.address,
      imageUrl: property.image_url,
      ownerId: property.owner_id,
      totalRooms: property.total_rooms,
      createdAt: property.created_at,
      updatedAt: property.updated_at,
    };
  }

  async updateProperty(propertyId: string, ownerId: string, input: UpdatePropertyInput) {
    const property = await propertyRepository.findById(propertyId);
    if (!property) {
      throw new NotFoundError('Property not found');
    }

    if (property.owner_id !== ownerId) {
      throw new ForbiddenError('You do not have access to this property');
    }

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.image_url !== undefined) updateData.image_url = input.image_url;
    if (input.total_rooms !== undefined) updateData.total_rooms = input.total_rooms;

    const updated = await propertyRepository.update(propertyId, updateData);

    logger.info(`Property updated: ${propertyId}`);

    return {
      id: updated.id,
      name: updated.name,
      address: updated.address,
      imageUrl: updated.image_url,
      ownerId: updated.owner_id,
      totalRooms: updated.total_rooms,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  }

  async deleteProperty(propertyId: string, ownerId: string) {
    const property = await propertyRepository.findById(propertyId);
    if (!property) {
      throw new NotFoundError('Property not found');
    }

    if (property.owner_id !== ownerId) {
      throw new ForbiddenError('You do not have access to this property');
    }

    await propertyRepository.softDelete(propertyId);
    logger.info(`Property soft-deleted: ${propertyId}`);
  }
}

export const propertyService = new PropertyService();
