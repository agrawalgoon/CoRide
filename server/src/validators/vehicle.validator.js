import { z } from 'zod';

export const createVehicleSchema = z.object({
  make: z
    .string({ required_error: 'Vehicle make is required' })
    .trim()
    .min(1, 'Make must not be empty')
    .max(100, 'Make cannot exceed 100 characters'),
  model: z
    .string({ required_error: 'Vehicle model is required' })
    .trim()
    .min(1, 'Model must not be empty')
    .max(100, 'Model cannot exceed 100 characters'),
  year: z.coerce
    .number({ required_error: 'Year is required' })
    .int('Year must be an integer')
    .min(1980, 'Year must be 1980 or later')
    .max(
      new Date().getFullYear() + 1,
      `Year cannot be later than ${new Date().getFullYear() + 1}`
    ),
  color: z
    .string({ required_error: 'Color is required' })
    .trim()
    .min(1, 'Color must not be empty')
    .max(50, 'Color cannot exceed 50 characters'),
  plateNumber: z
    .string({ required_error: 'Plate number is required' })
    .trim()
    .min(2, 'Plate number must be at least 2 characters')
    .max(30, 'Plate number cannot exceed 30 characters')
    .transform((val) => val.toUpperCase()),
  seatCapacity: z.coerce
    .number({ required_error: 'Seat capacity is required' })
    .int('Seat capacity must be an integer')
    .min(1, 'Seat capacity must be at least 1')
    .max(10, 'Seat capacity cannot exceed 10'),
  vehicleType: z
    .enum(['SEDAN', 'HATCHBACK', 'SUV', 'EV', 'MOTORBIKE'], {
      errorMap: () => ({
        message: 'vehicleType must be SEDAN, HATCHBACK, SUV, EV, or MOTORBIKE'
      })
    })
    .optional()
    .default('SEDAN'),
  rcPhotoUrl: z
    .string()
    .trim()
    .max(500, 'rcPhotoUrl cannot exceed 500 characters')
    .optional()
    .nullable(),
  insuranceValidUntil: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'insuranceValidUntil must be a valid date string'
    })
    .transform((val) => (val ? new Date(val) : null))
});

export const updateVehicleSchema = createVehicleSchema.partial();
