import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export async function uploadImage(base64Image: string): Promise<string> {
  const result = await cloudinary.uploader.upload(base64Image, {
    folder: 'dashmate/products',
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  });
  return result.secure_url;
}

export async function deleteImage(url: string): Promise<void> {
  const publicId = url.split('/').pop()?.split('.')[0];
  if (publicId) {
    await cloudinary.uploader.destroy(`dashmate/products/${publicId}`);
  }
}
