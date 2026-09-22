import { z } from 'zod';

export const createResidentSchema = z.object({
  name: z.string().min(1, 'Resident name is required').trim(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'Male', 'Female', 'Other']).default('Male'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(8, 'Valid phone number is required').trim(),
  start_date: z.string().min(1, 'Check-in start date is required'),
  end_date: z.string().min(1, 'Check-out end date is required'),
  remarks: z.string().optional().default(''),
});

export const updateResidentSchema = z.object({
  name: z.string().min(1, 'Resident name is required').trim().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'Male', 'Female', 'Other']).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(8, 'Valid phone number is required').trim().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  remarks: z.string().optional(),
});

export const updatePaymentDatesSchema = z.object({
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  amount: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export type CreateResidentInput = z.infer<typeof createResidentSchema>;
export type UpdateResidentInput = z.infer<typeof updateResidentSchema>;
export type UpdatePaymentDatesInput = z.infer<typeof updatePaymentDatesSchema>;
