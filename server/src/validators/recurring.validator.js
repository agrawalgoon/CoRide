import { z } from 'zod';

export const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const recurringRidePatternSchema = z.object({
  pattern: z.enum(['DAILY', 'WEEKDAYS', 'CUSTOM'], {
    errorMap: () => ({ message: 'pattern must be DAILY, WEEKDAYS, or CUSTOM' })
  }),
  recurringDays: z
    .array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']))
    .optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'startDate must be a valid ISO date string'
  }),
  endDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'endDate must be a valid ISO date string if provided'
    }),
  departureTimeOfDay: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'departureTimeOfDay must be in HH:MM 24-hour format (e.g. 08:30)'),
  maxInstances: z
    .number()
    .int()
    .min(1, 'maxInstances must be at least 1')
    .max(60, 'maxInstances cannot exceed 60 occurrences')
    .optional()
    .default(30)
});
