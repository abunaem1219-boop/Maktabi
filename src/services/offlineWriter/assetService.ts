/**
 * Offline Writer Asset Service
 * Handles offline image storage, client-side compression, local object URL caching,
 * and background Cloudinary upload pipeline.
 */

import { LocalAsset } from '../../types/writer';
import { saveLocalAsset, getLocalAsset, deleteLocalAsset } from '../indexedDbService';
import { uploadBookCover } from '../cloudinaryService';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// In-memory cache of object URLs for instant offline rendering without memory leaks
const objectUrlCache = new Map<string, string>();

/**
 * Get or create an object URL for a local asset
 */
export function getAssetBlobUrl(asset: LocalAsset): string {
  if (objectUrlCache.has(asset.id)) {
    return objectUrlCache.get(asset.id)!;
  }
  const url = URL.createObjectURL(asset.blob);
  objectUrlCache.set(asset.id, url);
  return url;
}

/**
 * Revoke cached object URL
 */
export function revokeAssetBlobUrl(assetId: string) {
  if (objectUrlCache.has(assetId)) {
    URL.revokeObjectURL(objectUrlCache.get(assetId)!);
    objectUrlCache.delete(assetId);
  }
}

/**
 * Compress an image file/blob to prevent excessive storage usage
 */
export async function compressImage(
  file: File | Blob,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // If not an image or SVG, return as is
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return resolve(file);
      }

      ctx.drawImage(img, 0, 0, width, height);

      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(blob);
          } else {
            resolve(file); // Keep original if compression was larger
          }
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback to raw file
    };

    img.src = objectUrl;
  });
}

/**
 * Validate and store an image in IndexedDB for offline use
 */
export async function storeLocalAsset(
  file: File | Blob,
  bookId: string,
  chapterId?: string
): Promise<{ asset: LocalAsset; localUrl: string }> {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('ছবির আকার সর্বোচ্চ ১০ মেগাবাইট (10MB) হতে পারে।');
  }

  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    throw new Error('শুধুমাত্র JPG, PNG বা WebP ফরম্যাটের ছবি গ্রহণযোগ্য।');
  }

  // Compress image client-side
  const compressedBlob = await compressImage(file);

  const now = Date.now();
  const assetId = `asset_${now}_${Math.random().toString(36).substring(2, 8)}`;
  const fileName = (file as File).name || `image_${now}.jpg`;

  const asset: LocalAsset = {
    id: assetId,
    bookId,
    chapterId,
    type: 'image',
    blob: compressedBlob,
    fileName,
    mimeType: file.type || 'image/jpeg',
    createdAt: now,
    uploadStatus: 'local',
  };

  await saveLocalAsset(asset);
  const localUrl = getAssetBlobUrl(asset);

  return { asset, localUrl };
}

/**
 * Upload a local asset to Cloudinary when online and update status
 */
export async function uploadAssetToCloudinary(assetId: string): Promise<{ remoteUrl: string; remotePublicId: string }> {
  const asset = await getLocalAsset(assetId);
  if (!asset) {
    throw new Error('লোকাল অ্যাসেট পাওয়া যায়নি।');
  }

  asset.uploadStatus = 'uploading';
  await saveLocalAsset(asset);

  try {
    const file = new File([asset.blob], asset.fileName, { type: asset.mimeType });
    const res = await uploadBookCover(file);

    asset.uploadStatus = 'uploaded';
    asset.remoteUrl = res.secure_url;
    asset.remotePublicId = res.public_id;
    await saveLocalAsset(asset);

    return {
      remoteUrl: res.secure_url,
      remotePublicId: res.public_id,
    };
  } catch (err: any) {
    asset.uploadStatus = 'failed';
    await saveLocalAsset(asset);
    throw err;
  }
}
