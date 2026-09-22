import { z } from 'zod';

export const createRoomSchema = z.object({
  room_no: z.string().min(1, 'Room number is required').trim(),
  capacity: z.coerce.number().int().positive('Capacity must be a positive integer'),
  monthly_rent: z.coerce.number().nonnegative('Monthly rent must be non-negative'),
});

export const updateRoomSchema = z.object({
  room_no: z.string().min(1, 'Room number is required').trim().optional(),
  capacity: z.coerce.number().int().positive('Capacity must be a positive integer').optional(),
  monthly_rent: z.coerce.number().nonnegative('Monthly rent must be non-negative').optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
