"use client"

/**
 * Resize an image to a maximum width while maintaining aspect ratio
 * @param file - The image file to resize
 * @param maxWidth - Maximum width in pixels (default 1080)
 * @param quality - JPEG quality 0-1 (default 0.85)
 * @returns Promise with the resized image as a data URL
 */
export function resizeImage(
    file: File,
    maxWidth: number = 1080,
    quality: number = 0.85
): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            reject(new Error('File is not an image'))
            return
        }

        const reader = new FileReader()

        reader.onload = (e) => {
            const img = new Image()

            img.onload = () => {
                let width = img.width
                let height = img.height

                if (width > maxWidth) {
                    const ratio = maxWidth / width
                    width = maxWidth
                    height = Math.round(height * ratio)
                }

                const canvas = document.createElement('canvas')
                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Could not get canvas context'))
                    return
                }

                ctx.imageSmoothingEnabled = true
                ctx.imageSmoothingQuality = 'high'
                ctx.drawImage(img, 0, 0, width, height)

                const resizedDataUrl = canvas.toDataURL('image/jpeg', quality)
                resolve(resizedDataUrl)
            }

            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = e.target?.result as string
        }

        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
    })
}

/**
 * Convert a data URL to a Blob
 */
function dataURLtoBlob(dataURL: string): Blob {
    const arr = dataURL.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
}

/**
 * Upload an image to Supabase Storage
 * @param file - The image file to upload
 * @param bucket - The storage bucket name (default 'images')
 * @param folder - Optional folder path within bucket
 * @returns Promise with the public URL of the uploaded image
 */
export async function uploadImageToStorage(
    file: File,
    bucket: string = 'images',
    folder: string = 'menu'
): Promise<string> {
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()

    // Resize the image first
    const resizedDataUrl = await resizeImage(file, 1080, 0.85)

    // Convert to Blob
    const blob = dataURLtoBlob(resizedDataUrl)

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const filename = `${folder}/${timestamp}-${randomStr}.jpg`

    // Upload to Supabase Storage
    const { error } = await supabase.storage
        .from(bucket)
        .upload(filename, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false
        })

    if (error) {
        console.error('Upload error:', error)
        throw new Error(`Failed to upload image: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filename)

    return urlData.publicUrl
}
