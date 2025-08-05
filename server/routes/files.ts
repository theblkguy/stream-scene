import { Router, Request, Response } from 'express';
<<<<<<< HEAD
import { db } from '../db/index.js';
import { Op } from 'sequelize';
=======
import { db } from '../db/index';
>>>>>>> a2852ee5 (Add/ uploaded file model, uploaded file route, frontend file service to communicate with the backend. File upload now retrieves previously uploaded files. Associates files with logged-in user)

const router = Router();
const { File } = db;

// Middleware to ensure user is authenticated
const requireAuth = (req: Request, res: Response, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Get all files for the authenticated user
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
<<<<<<< HEAD
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const tags = req.query.tags as string | undefined;
    let where: any = { userId };

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
      where.tags = { [Op.or]: tagArray.map(tag => ({ [Op.like]: `%${tag}%` })) };
    }

    const files = await File.findAll({ where, order: [['uploadedAt', 'DESC']] });
    
    //  Add proper null/undefined checks before calling split
    const filesWithTags = files.map(f => {
      const fileData = f.toJSON();
      let tags: string[] = [];
      if (fileData.tags) {
        if (typeof fileData.tags === 'string') {
          tags = fileData.tags.split(',').map((tag: string) => tag.trim());
        } else if (Array.isArray(fileData.tags)) {
          tags = (fileData.tags as any[]).map((tag: any) => tag.toString().trim());
        }
      }
      return { ...fileData, tags };
    });
    
    res.json({ files: filesWithTags });
=======
    const userId = (req.user as any).id;
    const files = await File.findAllByUserId(userId);
    res.json({ files });
>>>>>>> a2852ee5 (Add/ uploaded file model, uploaded file route, frontend file service to communicate with the backend. File upload now retrieves previously uploaded files. Associates files with logged-in user)
  } catch (error) {
    console.error('Error fetching user files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Create a new file record
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
<<<<<<< HEAD
    const { name, originalName, type, size, s3Key, url, tags } = req.body;
=======
    const { name, originalName, type, size, s3Key, url } = req.body;
>>>>>>> a2852ee5 (Add/ uploaded file model, uploaded file route, frontend file service to communicate with the backend. File upload now retrieves previously uploaded files. Associates files with logged-in user)

    if (!name || !type || !size || !url) {
      return res.status(400).json({ error: 'Missing required file information' });
    }

<<<<<<< HEAD
    // Process tags - ensure they're lowercase and unique
    let processedTags: string[] = [];
    if (tags && Array.isArray(tags)) {
      processedTags = tags
        .map(tag => tag.toString().toLowerCase().trim())
        .filter(tag => tag.length > 0)
        .filter((tag, index, array) => array.indexOf(tag) === index);
    }

=======
>>>>>>> a2852ee5 (Add/ uploaded file model, uploaded file route, frontend file service to communicate with the backend. File upload now retrieves previously uploaded files. Associates files with logged-in user)
    const file = await File.create({
      userId,
      name,
      originalName: originalName || name,
      type,
      size,
      s3Key,
<<<<<<< HEAD
      url,
      tags: processedTags.length > 0 ? processedTags.join(',') : undefined,
      uploadedAt: new Date(),
      updatedAt: new Date()
    });

    // Convert tags back to array for response
    const response = {
      ...file.toJSON(),
      tags: (file.tags && typeof file.tags === 'string') 
        ? file.tags.split(',').map(tag => tag.trim()) 
        : []
    };

    res.status(201).json({ file: response });
=======
      url
    });

    res.status(201).json({ file });
>>>>>>> a2852ee5 (Add/ uploaded file model, uploaded file route, frontend file service to communicate with the backend. File upload now retrieves previously uploaded files. Associates files with logged-in user)
  } catch (error) {
    console.error('Error creating file record:', error);
    res.status(500).json({ error: 'Failed to create file record' });
  }
});

<<<<<<< HEAD
// Get all unique tags for the authenticated user
router.get('/tags/list', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const files = await File.findAll({ where: { userId } });
    
    //  Add proper null/undefined checks before calling split
    const allTags = files
      .flatMap(file => {
        const fileData = file.toJSON();
        return (fileData.tags && typeof fileData.tags === 'string') 
          ? fileData.tags.split(',').map(tag => tag.trim().toLowerCase()) 
          : [];
      })
      .filter((tag, index, array) => array.indexOf(tag) === index)
      .sort();

    res.json({ tags: allTags });
  } catch (error) {
    console.error('Error fetching user tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

=======
>>>>>>> a2852ee5 (Add/ uploaded file model, uploaded file route, frontend file service to communicate with the backend. File upload now retrieves previously uploaded files. Associates files with logged-in user)
// Get a specific file by ID (only if it belongs to the user)
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const fileId = parseInt(req.params.id);

    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

<<<<<<< HEAD
    const file = await File.findOne({ where: { id: fileId, userId } });
=======
    const file = await File.findByIdAndUserId(fileId, userId);
    
>>>>>>> a2852ee5 (Add/ uploaded file model, uploaded file route, frontend file service to communicate with the backend. File upload now retrieves previously uploaded files. Associates files with logged-in user)
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

<<<<<<< HEAD
    // Convert tags back to array for response
    let responseTags: string[] = [];
    if (file.tags) {
      if (typeof file.tags === 'string') {
        responseTags = file.tags.split(',').map((tag: string) => tag.trim());
      } else if (Array.isArray(file.tags)) {
        responseTags = (file.tags as any[]).map((tag: any) => tag.toString().trim());
      }
    }

    const response = { ...file.toJSON(), tags: responseTags };

    res.json({ file: response });
=======
    res.json({ file });
>>>>>>> a2852ee5 (Add/ uploaded file model, uploaded file route, frontend file service to communicate with the backend. File upload now retrieves previously uploaded files. Associates files with logged-in user)
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Delete a file
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const fileId = parseInt(req.params.id);

    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

<<<<<<< HEAD
    const file = await File.findOne({ where: { id: fileId, userId } });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    await file.destroy();
=======
    const file = await File.findByIdAndUserId(fileId, userId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete the file record
    await file.destroy();

>>>>>>> a2852ee5 (Add/ uploaded file model, uploaded file route, frontend file service to communicate with the backend. File upload now retrieves previously uploaded files. Associates files with logged-in user)
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

<<<<<<< HEAD
// Update a specific file
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const fileId = parseInt(req.params.id);
    const userId = (req.user as any)?.id;
    
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { tags, ...updateData } = req.body;
    
    // Convert tags array to comma-separated string for database storage
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        const processedTags = tags.filter(tag => tag && tag.trim()).map(tag => tag.trim().toLowerCase());
        updateData.tags = processedTags.join(',');
      } else {
        updateData.tags = '';
      }
    }

    const [updatedRows] = await File.update(updateData, {
      where: { id: fileId, userId }
    });

    if (updatedRows === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const updatedFile = await File.findOne({ where: { id: fileId, userId } });
    
    if (!updatedFile) {
      return res.status(404).json({ error: 'File not found after update' });
    }

    // Handle both string and array cases
    let responseTags: string[] = [];
    
    if (updatedFile.tags) {
      if (typeof updatedFile.tags === 'string') {
        // If it's a string, split it
        responseTags = updatedFile.tags.split(',').map((tag: string) => tag.trim());
      } else if (Array.isArray(updatedFile.tags)) {
        // If it's already an array, use it directly
        responseTags = (updatedFile.tags as any[]).map((tag: any) => tag.toString().trim());
      }
    }

    const response = {
      ...updatedFile.toJSON(),
      tags: responseTags
    };

    res.json(response);
=======
// Update file metadata
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const fileId = parseInt(req.params.id);
    const { name } = req.body;

    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const file = await File.findByIdAndUserId(fileId, userId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Update allowed fields
    if (name) {
      file.name = name;
    }

    await file.save();

    res.json({ file });
>>>>>>> a2852ee5 (Add/ uploaded file model, uploaded file route, frontend file service to communicate with the backend. File upload now retrieves previously uploaded files. Associates files with logged-in user)
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

<<<<<<< HEAD
// Handle tag key press for adding tags to files
router.post('/tags', requireAuth, async (req: Request, res: Response) => {
  try {
    const { fileId, tag } = req.body;
    const userId = (req.user as any).id;

    if (!fileId || !tag) {
      return res.status(400).json({ error: 'File ID and tag are required' });
    }

    // Find the file to update
    const file = await File.findOne({ where: { id: fileId, userId } });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Add tag to current tags
    const currentTags = file.tags ? file.tags.split(',').map(t => t.trim()) : [];
    const newTags = Array.from(new Set([...currentTags, tag.toLowerCase()]));

    // Update the file with new tags
    file.tags = newTags.join(',');
    await file.save();

    res.json({ file: { ...file.toJSON(), tags: newTags } });
  } catch (error) {
    console.error('Error adding tag to file:', error);
    res.status(500).json({ error: 'Failed to add tag to file' });
  }
});

export default router;
=======
export default router;
>>>>>>> a2852ee5 (Add/ uploaded file model, uploaded file route, frontend file service to communicate with the backend. File upload now retrieves previously uploaded files. Associates files with logged-in user)
