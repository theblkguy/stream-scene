// Client-side S3 service - SECURE VERSION
// NO AWS credentials on client side - all operations go through server

export interface S3UploadResult {
  url: string;
  key: string;
}

/**
 * Check if S3 is configured (server-side check)
 */
<<<<<<< HEAD
export const isS3Configured = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/s3/status', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.warn('[S3Service] Server S3 status check failed:', response.status);
      return false;
    }
    
    const data = await response.json();
    console.log('[S3Service] Server S3 configuration check:', data);
    return data.configured || false;
  } catch (error) {
    console.error('[S3Service] Failed to check S3 configuration:', error);
    return false;
=======
const getEnvVars = () => {
  try {
    const envVars = {
      AWS_REGION: process?.env?.REACT_APP_AWS_REGION || 'us-east-2',
      AWS_ACCESS_KEY_ID: process?.env?.REACT_APP_AWS_ACCESS_KEY_ID || '',
      AWS_SECRET_ACCESS_KEY: process?.env?.REACT_APP_AWS_SECRET_ACCESS_KEY || '',
      BUCKET_NAME: process?.env?.REACT_APP_S3_BUCKET_NAME || 'stream-scene-bucket'
    };
    console.log('[S3Service] Loaded env vars:', envVars);
    return envVars;
  } catch (error) {
    console.warn('Process environment not available, using fallbacks', error);
    return {
      AWS_REGION: 'us-east-2',
      AWS_ACCESS_KEY_ID: '',
      AWS_SECRET_ACCESS_KEY: '',
      BUCKET_NAME: 'stream-scene-bucket'
    };
>>>>>>> e486de3f (Patch/ Errors in upload feature resolved)
  }
};

/**
<<<<<<< HEAD
 * Upload file to S3 via secure server endpoint
 * This is the ONLY way files should be uploaded - through the server
 */
export const uploadFileToS3 = async (file: File): Promise<S3UploadResult> => {
  console.log('[S3Service] Starting secure server-side upload for:', file.name);
=======
 * Check if AWS S3 is properly configured
 */
export const isS3Configured = (): boolean => {
  const env = getEnvVars();
  const configured = !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.BUCKET_NAME !== 'your-bucket-name');
  if (!configured) {
    console.warn('[S3Service] S3 is NOT configured:', env);
  } else {
    console.log('[S3Service] S3 is configured:', env);
  }
  return configured;
};

/**
 * Upload a file directly to S3
 */
export const uploadFileToS3 = async (file: File): Promise<S3UploadResult> => {
  const env = getEnvVars();

  if (!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.BUCKET_NAME !== 'your-bucket-name')) {
    console.error('[S3Service] uploadFileToS3: S3 not configured:', env);
    throw new Error('AWS S3 is not configured. Please check your environment variables.');
  }

  // Generate a presigned URL for the upload
  const fileExtension = file.name.split('.').pop();
  const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
  
  const s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });

  const command = new PutObjectCommand({
    Bucket: env.BUCKET_NAME,
    Key: fileName,
    ChecksumAlgorithm: undefined,
  });
>>>>>>> e486de3f (Patch/ Errors in upload feature resolved)

  const presignedUrl = await getSignedUrl(s3Client, command, { 
    expiresIn: 3600,
  });
  console.log('[S3Service] Presigned URL:', presignedUrl);

  // Upload the file using fetch PUT
  try {
<<<<<<< HEAD
    // Create form data for multipart upload
    const formData = new FormData();
    formData.append('file', file);

    // Upload through server proxy
    const response = await fetch('/api/s3/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[S3Service] Server upload failed:', response.status, errorText);
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('[S3Service] Upload successful:', result);
    
=======
    const uploadRes = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
    });
    if (!uploadRes.ok) {
      throw new Error(`Failed to upload file to S3. Status: ${uploadRes.status}`);
    }
    const url = `https://${env.BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
    console.log('[S3Service] Upload successful:', url);
>>>>>>> e486de3f (Patch/ Errors in upload feature resolved)
    return {
      url: result.url,
      key: result.key
    };
  } catch (error) {
<<<<<<< HEAD
    console.error('[S3Service] Upload error:', error);
=======
    console.error('[S3Service] Error uploading to S3 via presigned URL:', error);
>>>>>>> e486de3f (Patch/ Errors in upload feature resolved)
    throw new Error('Failed to upload file to S3');
  }
};

/**
 * Get a secure URL for accessing uploaded files
 * Files are served through server proxy to maintain security
 */
<<<<<<< HEAD
export const getFileUrl = (key: string): string => {
  // Use server proxy to serve files securely
  return `/api/s3/proxy/${key}`;
=======
export const getPresignedUploadUrl = async (fileName: string, fileType: string): Promise<string> => {
  const env = getEnvVars();

  if (!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.BUCKET_NAME !== 'your-bucket-name')) {
    throw new Error('AWS S3 is not configured. Please check your environment variables.');
  }

  const s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const fileExtension = fileName.split('.').pop();
  const key = `uploads/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
  
  const command = new PutObjectCommand({
    Bucket: env.BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
    return signedUrl;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate upload URL');
  }
>>>>>>> e486de3f (Patch/ Errors in upload feature resolved)
};

/**
 * Delete a file from S3 via server endpoint
 */
export const deleteFileFromS3 = async (key: string): Promise<void> => {
  console.log('[S3Service] Deleting file:', key);

  try {
    const response = await fetch(`/api/s3/delete/${encodeURIComponent(key)}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[S3Service] Delete failed:', response.status, errorText);
      throw new Error(`Delete failed: ${response.status} ${errorText}`);
    }

    console.log('[S3Service] File deleted successfully');
  } catch (error) {
    console.error('[S3Service] Delete error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

/**
 * Generate a presigned upload URL via server
 * This allows large file uploads while maintaining security
 */
export const getPresignedUploadUrl = async (fileName: string, fileType: string, fileSize?: number): Promise<string> => {
  console.log('[S3Service] Requesting presigned URL for:', fileName);

  try {
    const response = await fetch('/api/s3/presigned-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName,
        fileType,
        fileSize
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[S3Service] Presigned URL request failed:', response.status, errorText);
      throw new Error(`Failed to get upload URL: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('[S3Service] Presigned URL received');
    
    return result.presignedUrl;
  } catch (error) {
    console.error('[S3Service] Presigned URL error:', error);
    throw new Error('Failed to get upload URL');
  }
};

/**
 * Upload file using presigned URL (for large files)
 */
export const uploadWithPresignedUrl = async (file: File): Promise<S3UploadResult> => {
  console.log('[S3Service] Starting presigned URL upload for:', file.name);

  try {
    // First get the presigned URL from server
    const presignedUrl = await getPresignedUploadUrl(file.name, file.type, file.size);
    
    // Upload directly to S3 using presigned URL
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      console.error('[S3Service] Presigned upload failed:', uploadResponse.status);
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    // Extract key from presigned URL
    const url = new URL(presignedUrl);
    const key = url.pathname.substring(1); // Remove leading '/'
    const fileUrl = getFileUrl(key);

    console.log('[S3Service] Presigned upload successful');
    
    return {
      url: fileUrl,
      key: key
    };
  } catch (error) {
    console.error('[S3Service] Presigned upload error:', error);
    throw new Error('Failed to upload file with presigned URL');
  }
};

/**
 * Upload receipt file with expense metadata
 */
export const uploadReceipt = async (file: File, expenseId?: string): Promise<S3UploadResult> => {
  console.log('[S3Service] Uploading receipt:', file.name);

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'receipt'); // FIXED: was 'file', should be 'type'
    if (expenseId) {
      formData.append('expenseId', expenseId); // FIXED: was 'expenseID', should be 'expenseId'
    }

    const response = await fetch('/api/s3/upload/receipt', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Receipt upload failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('[S3Service] Receipt uploaded successfully:', result);
    
    return {
      url: result.url,
      key: result.key
    };
  } catch (error) {
    console.error('[S3Service] Receipt upload error:', error);
    throw new Error('Failed to upload receipt');
  }
};

// Default export using the secure server upload
export default {
  uploadFileToS3,
  deleteFileFromS3,
  getFileUrl,
  isS3Configured,
  getPresignedUploadUrl,
  uploadWithPresignedUrl,
  uploadReceipt 
};