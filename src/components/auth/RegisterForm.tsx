'use client'

import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/auth-store'
import { useNavStore } from '@/store/nav-store'
import { z } from 'zod'

// Client-side Zod validation schema
const registerFormSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name is too long'),
    email: z.string().email('Please enter a valid email address'),
    phone: z
      .string()
      .min(1, 'Phone number is required')
      .regex(/^01[3-9]\d{8}$/, 'Enter a valid Bangladeshi phone number (e.g., 01XXXXXXXXX)'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerFormSchema>

function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: 'Weak', color: '#EF4444' }
  if (score <= 2) return { score, label: 'Fair', color: '#FF8A5C' }
  if (score <= 3) return { score, label: 'Good', color: '#22C55E' }
  return { score, label: 'Strong', color: '#22c55e' }
}

export function RegisterForm() {
  const [form, setForm] = useState<Partial<RegisterFormData>>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { login } = useAuthStore()
  const navigate = useNavStore((s) => s.navigate)

  const handleGoogleSignUp = async () => {
    try {
      const { signInWithGoogle } = await import('@/lib/supabase')
      await signInWithGoogle()
    } catch {
      setError('Google Sign Up is not available. Please use email registration.')
    }
  }

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
    setError('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    // Zod client-side validation
    const result = registerFormSchema.safeParse(form)
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]?.toString()
        if (field && !errors[field]) {
          errors[field] = issue.message
        }
      }
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name: form.name!.trim(),
          email: form.email!.trim().toLowerCase(),
          phone: form.phone!.trim(),
          password: form.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.details && Array.isArray(data.details)) {
          const errors: Record<string, string> = {}
          for (const issue of data.details) {
            const field = issue.path?.[0]?.toString()
            if (field) errors[field] = issue.message
          }
          setFieldErrors(errors)
        } else {
          setError(data.error || 'Registration failed. Please try again.')
        }
        return
      }

      // Auto-login after registration
      login(data.user, data.token || '')

      // Navigate to home
      navigate('home')
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = form.password
    ? getPasswordStrength(form.password)
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-md mx-auto px-4 py-8"
    >
      <div className="nb-card bg-card p-6">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center bg-[#22C55E] border-[3px] border-foreground shadow-[3px_3px_0px_var(--foreground)]">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-foreground uppercase tracking-wide">
            Create Account
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">
            Join us and start shopping
          </p>
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl text-sm font-bold border-[3px] border-[#EF4444] bg-[#EF4444]/10 text-[#EF4444]"
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="reg-name"
              className="block text-sm font-bold text-foreground mb-1.5"
            >
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              value={form.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Enter your full name"
              className={`nb-input w-full px-4 py-3 text-sm bg-background ${
                fieldErrors.name ? 'border-[#EF4444]' : ''
              }`}
              autoComplete="name"
            />
            {fieldErrors.name && (
              <p className="text-xs mt-1 font-bold text-[#EF4444]">
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="reg-email"
              className="block text-sm font-bold text-foreground mb-1.5"
            >
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              value={form.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="your@email.com"
              className={`nb-input w-full px-4 py-3 text-sm bg-background ${
                fieldErrors.email ? 'border-[#EF4444]' : ''
              }`}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <p className="text-xs mt-1 font-bold text-[#EF4444]">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="reg-phone"
              className="block text-sm font-bold text-foreground mb-1.5"
            >
              Phone Number
            </label>
            <input
              id="reg-phone"
              type="tel"
              value={form.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="01XXXXXXXXX"
              maxLength={11}
              className={`nb-input w-full px-4 py-3 text-sm bg-background ${
                fieldErrors.phone ? 'border-[#EF4444]' : ''
              }`}
              autoComplete="tel"
            />
            {fieldErrors.phone && (
              <p className="text-xs mt-1 font-bold text-[#EF4444]">
                {fieldErrors.phone}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="reg-password"
              className="block text-sm font-bold text-foreground mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={form.password || ''}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Create a strong password"
                className={`nb-input w-full px-4 py-3 pr-12 text-sm bg-background ${
                  fieldErrors.password ? 'border-[#EF4444]' : ''
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md border-2 border-foreground bg-[#22C55E] text-[#1A1A1A] hover:brightness-110 transition shadow-[2px_2px_0px_var(--foreground)]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs mt-1 font-bold text-[#EF4444]">
                {fieldErrors.password}
              </p>
            )}
            {/* Password strength indicator */}
            {passwordStrength && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className="h-2 flex-1 rounded-sm border-2 border-foreground transition-colors"
                      style={{
                        backgroundColor:
                          level <= passwordStrength.score
                            ? passwordStrength.color
                            : 'transparent',
                      }}
                    />
                  ))}
                </div>
                <p
                  className="text-xs font-extrabold"
                  style={{ color: passwordStrength.color }}
                >
                  {passwordStrength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="reg-confirm-password"
              className="block text-sm font-bold text-foreground mb-1.5"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="reg-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirmPassword || ''}
                onChange={(e) =>
                  updateField('confirmPassword', e.target.value)
                }
                placeholder="Re-enter your password"
                className={`nb-input w-full px-4 py-3 pr-12 text-sm bg-background ${
                  fieldErrors.confirmPassword ? 'border-[#EF4444]' : ''
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md border-2 border-foreground bg-[#22C55E] text-[#1A1A1A] hover:brightness-110 transition shadow-[2px_2px_0px_var(--foreground)]"
                aria-label={
                  showConfirmPassword ? 'Hide password' : 'Show password'
                }
              >
                {showConfirmPassword ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-xs mt-1 font-bold text-[#EF4444]">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Create account button */}
          <button
            type="submit"
            disabled={loading}
            className="nb-btn w-full bg-[#FFD700] text-[#0A0A0A] py-3.5 font-black uppercase disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 nb-divider" />
          <span className="text-xs text-foreground font-black bg-[#22C55E] px-3 py-1 rounded-md border-2 border-foreground shadow-[2px_2px_0px_var(--foreground)]">
            OR
          </span>
          <div className="flex-1 nb-divider" />
        </div>

        {/* Google Sign Up */}
        <button
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="nb-btn w-full bg-white text-foreground border-[3px] py-3 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="font-extrabold">Sign up with Google</span>
        </button>

        {/* Login link */}
        <p className="text-center text-sm text-muted-foreground mt-6 font-semibold">
          Already have an account?{' '}
          <button
            onClick={() => navigate('login')}
            className="text-[#22C55E] font-bold hover:underline"
          >
            Login
          </button>
        </p>
      </div>
    </motion.div>
  )
}
