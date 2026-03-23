import { z } from 'zod/v4'

export const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const signupSchema = z
  .object({
    email: z.email('Please enter a valid email address'),
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type SignupFormValues = z.infer<typeof signupSchema>

// WrenchDue schemas
const currentYear = new Date().getFullYear()

export const addVehicleSchema = z.object({
  year: z.number().int().min(1980, 'Year must be 1980 or later').max(currentYear + 1, `Year cannot exceed ${currentYear + 1}`),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  nickname: z.string().max(50).optional(),
  current_mileage: z.number().int().min(0, 'Mileage must be 0 or greater'),
  weekly_miles_estimate: z.number().int().min(1, 'Weekly estimate is required'),
})

export type AddVehicleFormValues = z.infer<typeof addVehicleSchema>

export const mileageUpdateSchema = z.object({
  current_mileage: z.number().int().min(0, 'Mileage must be 0 or greater'),
  weekly_miles_estimate: z.number().int().min(1).optional(),
})

export type MileageUpdateFormValues = z.infer<typeof mileageUpdateSchema>
