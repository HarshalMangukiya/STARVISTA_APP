import { z } from 'zod';

export const createPropertySchema = z.object({
  name: z.string().min(1, 'Property name is required').trim(),
  address: z.string().min(1, 'Property address is required').trim(),
  image_url: z.string().optional().default(''),
  total_rooms: z.coerce.number().int().nonnegative().optional().default(0),
});

export const updatePropertySchema = z.object({
  name: z.string().min(1, 'Property name is required').trim().optional(),
  address: z.string().min(1, 'Property address is required').trim().optional(),
  image_url: z.string().optional(),
  total_rooms: z.coerce.number().int().nonnegative().optional(),
});

export const propertyQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
