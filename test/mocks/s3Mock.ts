// test/mocks/s3Mock.ts
// Mock AWS S3 client for testing

import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sinon from 'sinon';

// In-memory storage for mocked S3
const mockS3Storage: Map<string, { body: Buffer; contentType?: string }> = new Map();

/**
 * Create a mocked S3 client
 */
export const createMockS3Client = (): sinon.SinonStubbedInstance<S3Client> => {
  const mockClient = sinon.createStubInstance(S3Client);

  // Mock PutObjectCommand
  (mockClient.send as sinon.SinonStub).withArgs(sinon.match.instanceOf(PutObjectCommand)).callsFake(async (command: PutObjectCommand) => {
    const input = (command as any).input;
    const key = input.Key;
    const body = input.Body;
    
    // Convert body to buffer if it's a stream
    let buffer: Buffer;
    if (Buffer.isBuffer(body)) {
      buffer = body;
    } else if (typeof body === 'string') {
      buffer = Buffer.from(body);
    } else {
      // For streams, we'd need to read them - simplified for tests
      buffer = Buffer.from('');
    }

    mockS3Storage.set(key, {
      body: buffer,
      contentType: input.ContentType,
    });

    return {
      ETag: `"${Date.now()}"`,
      VersionId: 'mock-version-id',
    };
  });

  // Mock GetObjectCommand
  (mockClient.send as sinon.SinonStub).withArgs(sinon.match.instanceOf(GetObjectCommand)).callsFake(async (command: GetObjectCommand) => {
    const input = (command as any).input;
    const key = input.Key;
    const stored = mockS3Storage.get(key);

    if (!stored) {
      const error = new Error('NoSuchKey');
      (error as any).name = 'NoSuchKey';
      throw error;
    }

    return {
      Body: stored.body,
      ContentType: stored.contentType,
      ContentLength: stored.body.length,
    };
  });

  // Mock DeleteObjectCommand
  (mockClient.send as sinon.SinonStub).withArgs(sinon.match.instanceOf(DeleteObjectCommand)).callsFake(async (command: DeleteObjectCommand) => {
    const input = (command as any).input;
    const key = input.Key;
    mockS3Storage.delete(key);
    return {
      DeleteMarker: true,
      VersionId: 'mock-version-id',
    };
  });

  // Mock HeadObjectCommand
  (mockClient.send as sinon.SinonStub).withArgs(sinon.match.instanceOf(HeadObjectCommand)).callsFake(async (command: HeadObjectCommand) => {
    const input = (command as any).input;
    const key = input.Key;
    const stored = mockS3Storage.get(key);

    if (!stored) {
      const error = new Error('NotFound');
      (error as any).name = 'NotFound';
      throw error;
    }

    return {
      ContentLength: stored.body.length,
      ContentType: stored.contentType,
      ETag: `"${Date.now()}"`,
    };
  });

  return mockClient;
};

/**
 * Get a mock signed URL for S3 objects
 */
export const getMockSignedUrl = async (key: string): Promise<string> => {
  // Return a mock URL that can be used in tests
  return `/api/s3/proxy/${key}`;
};

/**
 * Clear all mocked S3 storage
 */
export const clearMockS3Storage = (): void => {
  mockS3Storage.clear();
};

/**
 * Get a file from mock S3 storage (for testing)
 */
export const getMockS3File = (key: string): Buffer | undefined => {
  return mockS3Storage.get(key)?.body;
};

/**
 * Check if a file exists in mock S3 storage
 */
export const mockS3FileExists = (key: string): boolean => {
  return mockS3Storage.has(key);
};
