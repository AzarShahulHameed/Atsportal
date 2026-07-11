import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { randomBytes } from 'crypto';

export interface UploadResult {
  url: string;
  publicId: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB — keep in sync with the Multer limit in applications.controller.ts

@Injectable()
export class CloudinaryService {
  constructor(config: ConfigService) {
    cloudinary.config({
      cloud_name: config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: config.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  // Resumes/cover letters are PDFs/docs, not images — must use resource_type "raw"
  // or Cloudinary will try to treat them as images and mangle them.
  async uploadDocument(file: Express.Multer.File, folder: string): Promise<UploadResult> {
    const allowedMimeTypes: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    };
    const extension = allowedMimeTypes[file.mimetype];
    if (!extension) {
      throw new BadRequestException('Only PDF or Word documents are allowed');
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File must be under 5MB');
    }

    // upload_stream has no filesystem path to read a filename from, so
    // use_filename/unique_filename silently produce an extensionless public_id.
    // Building the public_id ourselves — with the real extension baked in —
    // is what makes Cloudinary serve the file with the correct Content-Type,
    // so it opens/downloads as an actual PDF instead of an unrecognized blob.
    const safeBaseName = file.originalname
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 60);
    const uniqueSuffix = randomBytes(6).toString('hex');
    const publicId = `${safeBaseName}-${uniqueSuffix}.${extension}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder,
          public_id: publicId,
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            return reject(error ?? new Error('Cloudinary upload failed'));
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  async deleteDocument(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  }

  // Logos are real images — resource_type: 'image', not 'raw'. This gets
  // Cloudinary's actual image pipeline (format detection, optimization)
  // instead of being treated as an opaque blob like resumes are.
  async uploadImage(file: Express.Multer.File, folder: string): Promise<UploadResult> {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }
    const maxSizeBytes = 2 * 1024 * 1024; // 2MB — logos don't need to be large
    if (file.size > maxSizeBytes) {
      throw new BadRequestException('Image must be under 2MB');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            return reject(error ?? new Error('Cloudinary upload failed'));
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  }
}
