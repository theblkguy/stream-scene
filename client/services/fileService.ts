// Service for managing file operations with the backend
export interface FileRecord {
  id: number;
  userId: number;
  name: string;
  originalName: string;
  type: string;
  size: number;
  s3Key?: string;
  url: string;
<<<<<<< HEAD
  tags?: string[];
=======
>>>>>>> a2852ee5 (Add/ uploaded file model, uploaded file route, frontend file service to communicate with the backend. File upload now retrieves previously uploaded files. Associates files with logged-in user)
  uploadedAt: string;
  updatedAt: string;
}

export interface CreateFileRequest {
  name: string;
  originalName?: string;
  type: string;
  size: number;
  s3Key?: string;
  url: string;
<<<<<<< HEAD
  tags?: string[];
=======
>>>>>>> a2852ee5 (Add/ uploaded file model, uploaded file route, frontend file service to communicate with the backend. File upload now retrieves previously uploaded files. Associates files with logged-in user)
}

const API_BASE = 'http://localhost:8000/api/files';

export const fileService = {
  // Get all files for the authenticated user
<<<<<<< HEAD
  async getFiles(tags?: string[]): Promise<FileRecord[]> {
    try {
      let url = API_BASE;
      if (tags && tags.length > 0) {
        url += `?tags=${tags.join(',')}`;
      }
      
      const response = await fetch(url, {
=======
  async getFiles(): Promise<FileRecord[]> {
    try {
      const response = await fetch(API_BASE, {
>>>>>>> a2852ee5 (Add/ uploaded file model, uploaded file route, frontend file service to communicate with the backend. File upload now retrieves previously uploaded files. Associates files with logged-in user)
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  },

  // Create a new file record
  async createFile(fileData: CreateFileRequest): Promise<FileRecord> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(fileData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create file record: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.file;
    } catch (error) {
      console.error('Error creating file record:', error);
      throw error;
    }
  },

  // Get a specific file by ID
  async getFile(id: number): Promise<FileRecord> {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.file;
    } catch (error) {
      console.error('Error fetching file:', error);
      throw error;
    }
  },

  // Delete a file
  async deleteFile(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  // Update file metadata
<<<<<<< HEAD
  async updateFile(id: number, updates: Partial<FileRecord>): Promise<FileRecord> {
    try {
      console.log('Updating file:', id, 'with data:', updates);
      
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Update failed:', response.status, errorData);
        throw new Error(`Failed to update file: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Update response:', result);
      return result;
    } catch (error) {
      console.error('Error in updateFile:', error);
      throw new Error(`Failed to update file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Get all unique tags for the authenticated user
  async getUserTags(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE}/tags/list`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.tags || [];
    } catch (error) {
      console.error('Error fetching tags:', error);
=======
  async updateFile(id: number, updates: Partial<Pick<FileRecord, 'name'>>): Promise<FileRecord> {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update file: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.file;
    } catch (error) {
      console.error('Error updating file:', error);
>>>>>>> a2852ee5 (Add/ uploaded file model, uploaded file route, frontend file service to communicate with the backend. File upload now retrieves previously uploaded files. Associates files with logged-in user)
      throw error;
    }
  }
};
