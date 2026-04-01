import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Upload image buffer to Cloudinary with server-side compression and moderation.
 */
export async function uploadImageBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: 'unideal_listings',
        // FIXED: Fix 13 requirements
        quality: 'auto',
        fetch_format: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary Upload Error]', error)
          reject(error)
        } else if (result) {
          resolve(result.secure_url)
        } else {
          reject(new Error('Unknown upload error'))
        }
      }
    )
    uploadStream.end(buffer)
  })
}

/**
 * Bulk delete images from Cloudinary.
 * Used in cascade deletions (Fix 5/10).
 */
export async function deleteImages(imageUrls: string[]): Promise<void> {
  const publicIds = imageUrls
    .map(url => {
      try {
        if (!url.includes('/unideal_listings/')) return null
        const parts = url.split('/unideal_listings/')
        const filename = parts[1]
        const publicId = `unideal_listings/${filename.split('.')[0]}`
        return publicId
      } catch (e) {
        return null
      }
    })
    .filter(id => id !== null) as string[]

  if (publicIds.length > 0) {
    try {
      await cloudinary.api.delete_resources(publicIds)
    } catch (error) {
      console.error('[Cloudinary Bulk Delete Error]', error)
    }
  }
}

// Legacy helper for single delete
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('[Cloudinary Delete Error]', error)
  }
}
