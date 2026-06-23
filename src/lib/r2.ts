import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// ═══════════════════════════════════════════════════════════════════════════
// Cloudflare R2 Configuration
// R2 is S3-compatible — we use the AWS SDK to interact with it
// ═══════════════════════════════════════════════════════════════════════════

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || ''
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ''
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ''
const R2_BUCKET = process.env.R2_BUCKET || 'bangla-bazar-images'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

// Create S3 client configured for Cloudflare R2
function getR2Client(): S3Client {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error(
      'R2 not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env'
    )
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// Upload a file to R2
// Returns the public URL of the uploaded file
// ═══════════════════════════════════════════════════════════════════════════

export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const client = getR2Client()

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  )

  // Return the public URL
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`
  }

  // Fallback: construct URL from account ID + R2.dev subdomain pattern
  return `https://pub-${R2_ACCOUNT_ID}.r2.dev/${key}`
}

// ═══════════════════════════════════════════════════════════════════════════
// Delete a file from R2
// ═══════════════════════════════════════════════════════════════════════════

export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client()

  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Generate a signed URL for temporary access (for private buckets)
// Not needed if public access is enabled, but useful for private files
// ═══════════════════════════════════════════════════════════════════════════

export async function getSignedR2Url(key: string, expiresIn: number = 3600): Promise<string> {
  const client = getR2Client()

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  })

  return getSignedUrl(client, command, { expiresIn })
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper: Generate a unique file key for uploads
// Format: products/{year}/{month}/{uuid}.{ext}
// ═══════════════════════════════════════════════════════════════════════════

export function generateFileKey(filename: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
  const uniqueId = crypto.randomUUID().split('-')[0] // first segment of UUID
  const safeName = filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.[^.]+$/, '')
    .slice(0, 30)

  return `products/${year}/${month}/${safeName}_${uniqueId}.${ext}`
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper: Check if R2 is configured
// ═══════════════════════════════════════════════════════════════════════════

export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY)
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper: Extract R2 key from a full public URL
// e.g. "https://img.banglabazar.com/products/2024/06/photo_abc.jpg"
//   → "products/2024/06/photo_abc.jpg"
// ═══════════════════════════════════════════════════════════════════════════

export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    // Remove leading slash from pathname
    return urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname
  } catch {
    return null
  }
}
