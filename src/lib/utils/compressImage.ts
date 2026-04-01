import imageCompression from 'browser-image-compression'

/**
 * Standardised image compression for all uploads from Seller directly
 * Max width 800px, WebP format ideally, quality 0.8
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxWidthOrHeight: 800,
    useWebWorker: true,
    initialQuality: 0.8,
    fileType: 'image/webp'
  }

  try {
    const compressedFile = await imageCompression(file, options)
    return compressedFile
  } catch (error) {
    console.error('Image compression failed', error)
    throw new Error('Failed to compress image')
  }
}
