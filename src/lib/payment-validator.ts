import { z } from 'zod'

// Transaction ID: ONLY uppercase letters and numbers, no Bengali, no special chars
export const transactionIdSchema = z.string()
  .min(1, 'Transaction ID is required')
  .max(50, 'Transaction ID too long')
  .regex(/^[A-Z0-9]+$/, 'Transaction ID must contain only uppercase letters and numbers')
  .refine(val => !/[\u0980-\u09FF]/.test(val), 'Bengali characters are not allowed')

// Phone number: +880 followed by digits, total max 11 digits after +880
export const bdPhoneSchema = z.string()
  .min(1, 'Phone number is required')
  .refine(val => /^[0-9+\-\s]+$/.test(val), 'Phone contains invalid characters')
  .refine(val => !/[\u0980-\u09FF]/.test(val), 'Bengali characters are not allowed')
  .refine(val => {
    // Strip all non-digit chars
    const digits = val.replace(/\D/g, '')
    // If starts with 880, count digits after 880
    if (digits.startsWith('880')) {
      const afterCode = digits.slice(3)
      return afterCode.length <= 11
    }
    // If starts with 0, that's fine too
    return digits.length <= 11
  }, 'Phone number with +880 must not exceed 11 digits after country code')
  .refine(val => {
    const digits = val.replace(/\D/g, '')
    return digits.startsWith('880') || digits.startsWith('01')
  }, 'Phone must start with +880 or 01')

// Name: sanitize - no Bengali in payment fields
export const paymentNameSchema = z.string()
  .min(2, 'Name is required')
  .max(100, 'Name too long')
  .refine(val => !/[\u0980-\u09FF]/.test(val), 'Bengali characters are not supported in payment fields')

// Address: allow Bengali here since it's for delivery
export const addressSchema = z.string()
  .min(5, 'Address is required')
  .max(500, 'Address too long')

// Payment method
export const paymentMethodSchema = z.enum(['bkash', 'nagad', 'cod'])

// Full checkout validation
export const checkoutPaymentSchema = z.object({
  name: paymentNameSchema,
  phone: bdPhoneSchema,
  address: addressSchema,
  paymentMethod: paymentMethodSchema,
  transactionId: z.string().optional(),
  note: z.string().max(500).optional(),
}).refine(data => {
  // Transaction ID required for bKash and Nagad
  if ((data.paymentMethod === 'bkash' || data.paymentMethod === 'nagad') && !data.transactionId) {
    return false
  }
  return true
}, {
  message: 'Transaction ID is required for mobile payment',
  path: ['transactionId'],
}).refine(data => {
  // Validate transaction ID format for mobile payments
  if (data.transactionId && (data.paymentMethod === 'bkash' || data.paymentMethod === 'nagad')) {
    return /^[A-Z0-9]+$/.test(data.transactionId)
  }
  return true
}, {
  message: 'Transaction ID must contain only uppercase letters and numbers',
  path: ['transactionId'],
})

// Sanitize input - strip any Bengali characters from payment fields
export function sanitizePaymentInput(input: string): string {
  // Remove Bengali characters (Unicode range 0980-09FF)
  return input.replace(/[\u0980-\u09FF]/g, '').trim()
}

// Force uppercase for transaction fields
export function forceTransactionUppercase(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

// Format phone number to standard format
export function formatBDPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('880')) {
    return '+880' + digits.slice(3)
  }
  if (digits.startsWith('01')) {
    return '+880' + digits.slice(1)
  }
  return phone
}

export type CheckoutPaymentInput = z.infer<typeof checkoutPaymentSchema>
