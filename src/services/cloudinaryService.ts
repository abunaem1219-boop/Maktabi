/**
 * Cloudinary Media Service for KitabKhana
 * IMPORTANT: NEVER store or expose Cloudinary API Secret in client-side code.
 * This service uses secure unsigned upload presets only.
 */

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

export interface CloudinaryConfigStatus {
  configured: boolean;
  cloudName: string;
  uploadPreset: string;
  missing: string[];
}

/**
 * Check if Cloudinary environment variables are properly set
 */
export function getCloudinaryConfig(): CloudinaryConfigStatus {
  const cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
  const uploadPreset = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim();

  const missing: string[] = [];
  if (!cloudName) missing.push('VITE_CLOUDINARY_CLOUD_NAME');
  if (!uploadPreset) missing.push('VITE_CLOUDINARY_UPLOAD_PRESET');

  return {
    configured: missing.length === 0,
    cloudName,
    uploadPreset,
    missing,
  };
}

/**
 * Upload a book cover file to Cloudinary with real progress tracking
 */
export async function uploadBookCover(
  file: File,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResponse> {
  const config = getCloudinaryConfig();

  if (!config.configured) {
    throw new Error(
      `Cloudinary কনফিগারেশন অনুপস্থিত! (${config.missing.join(', ')})। অনুগ্রহ করে আপনার .env ফাইলটি সেটআপ করুন।`
    );
  }

  // 1. File Type Validation
  const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validMimeTypes.includes(file.type.toLowerCase())) {
    throw new Error('শুধুমাত্র JPG, JPEG, PNG এবং WEBP ফরম্যাটের ছবি আপলোড করা যাবে।');
  }

  // 2. File Size Validation (Max 10MB)
  const MAX_SIZE_BYTES = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('ছবির সাইজ অতিরিক্ত বড়! সর্বোচ্চ সাইজ ১০ মেগাবাইট (10MB)।');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset);
  formData.append('folder', 'kitabkhana/book-covers');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;

    xhr.open('POST', endpoint, true);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            secure_url: response.secure_url,
            public_id: response.public_id,
            width: response.width,
            height: response.height,
            format: response.format,
          });
        } catch {
          reject(new Error('Cloudinary থেকে অবৈধ রেসপন্স পাওয়া গেছে।'));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          reject(new Error(errRes.error?.message || 'ছবি আপলোড ব্যর্থ হয়েছে।'));
        } catch {
          reject(new Error(`আপলোড ব্যর্থ হয়েছে (Status: ${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('নেটওয়ার্ক ত্রুটি! Cloudinary সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।'));
    };

    xhr.send(formData);
  });
}

/**
 * Return an optimized Cloudinary delivery URL with responsive width, auto format and auto quality
 */
export function getOptimizedImageUrl(
  url?: string,
  options?: { width?: number; height?: number; crop?: string; quality?: string }
): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com')) return url;

  const width = options?.width ? `w_${options.width},` : '';
  const height = options?.height ? `h_${options.height},` : '';
  const crop = options?.crop ? `c_${options.crop},` : 'c_limit,';
  const quality = options?.quality || 'q_auto,f_auto';

  const transform = `${width}${height}${crop}${quality}`;
  return url.replace('/upload/', `/upload/${transform}/`);
}
