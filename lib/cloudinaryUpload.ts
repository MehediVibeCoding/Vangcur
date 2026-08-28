'use client';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dkjzleczw';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'vangcur_reviews';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_INPUT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * ব্রাউজার ক্যানভাসে ছবি ড্র করে WebP ফরম্যাটে কম্প্রেস করে, যাতে ফাইলের সাইজ ৯০% কমে যায়
 * এবং লুকানো যেকোনো ম্যালিশিয়াস কোড বা এক্সিফ/জিপিএস ট্র্যাকিং ডেটা ধ্বংস হয়ে যায়।
 */
export async function compressImageToWebp(file: File, maxDim = 1000, quality = 0.82): Promise<Blob> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('শুধুমাত্র JPG, PNG অথবা WEBP ফরম্যাটের ছবি আপলোড করা যাবে');
  }

  if (file.size > MAX_INPUT_SIZE_BYTES) {
    throw new Error('ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট (5MB) হতে পারবে');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('ক্যানভাস প্রসেসিং ব্যর্থ হয়েছে'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('ছবি কম্প্রেস করা যায়নি'));
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('ছবিটি পড়া সম্ভব হয়নি, অনুগ্রহ করে অন্য ছবি ব্যবহার করুন'));
    };

    img.src = objectUrl;
  });
}

/**
 * সরাসরি ব্রাউজার থেকে ক্লাউডিনারিতে ছবি আপলোড করে সুরক্ষিত লিঙ্ক রিটার্ন করে।
 */
export async function uploadReviewImageToCloudinary(file: File): Promise<string> {
  const compressedBlob = await compressImageToWebp(file);

  const formData = new FormData();
  formData.append('file', compressedBlob, 'review.webp');
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'vangcur/reviews');

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const res = await fetch(endpoint, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error?.message || 'ছবি আপলোড ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
  }

  const data = await res.json();
  return data.secure_url;
        }
