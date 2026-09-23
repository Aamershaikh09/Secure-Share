import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  password: z
    .string()
    .min(1, 'Password cannot be empty'),
});

export const resendVerificationSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
});

export const verifyEmailQuerySchema = z.object({
  token: z
    .string()
    .trim()
    .min(16, 'Invalid token format')
    .max(256, 'Invalid token length'),
});

export const createFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Folder name cannot be empty')
    .max(100, 'Folder name cannot exceed 100 characters'),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color code')
    .optional(),
});

export const updateFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Folder name cannot be empty')
    .max(100, 'Folder name cannot exceed 100 characters'),
});

export const updateFileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Filename cannot be empty')
    .max(255, 'Filename cannot exceed 255 characters')
    .optional(),
  folderId: z.string().nullable().optional(),
});

export const createShareSchema = z.object({
  fileId: z.string().uuid('Invalid file ID format'),
  password: z.string().trim().max(128).optional(),
  expiresInHours: z
    .number()
    .int('Expiration must be an integer number of hours')
    .min(1, 'Minimum expiration is 1 hour')
    .max(8760, 'Maximum expiration is 1 year')
    .optional(),
});

export const verifySharePasswordSchema = z.object({
  password: z.string().min(1, 'Passphrase cannot be empty'),
});
