// server/routes/threadsApi.ts

// API routes for Threads content publishing and management

import express, { Request, Response } from 'express';
import { ThreadsPostingService, ThreadsPostData, ThreadsMediaUpload } from '../services/threadsPosting.js';
import { ThreadsDraft } from '../models/ThreadsDraft.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

interface SessionWithThreads {
  threadsAuth?: {
    accessToken: string;
    userId: string;
    username: string;
    expiresAt: string;
  };
}

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'threads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB limit for images
    files: 10 // Max 10 files for carousel
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, GIF) and videos (MP4, MOV, AVI) are allowed'));
    }
  }
});

// Middleware to check Threads authentication
const requireThreadsAuth = (req: Request, res: Response, next: express.NextFunction) => {
  const session = req.session as SessionWithThreads;
  const threadsAuth = session?.threadsAuth;
  
  if (!threadsAuth || !threadsAuth.accessToken) {
    return res.status(401).json({ 
      error: 'Threads authentication required',
      message: 'Please connect your Threads account first'
    });
  }
  
  // Check if token is expired
  if (threadsAuth.expiresAt && new Date() > new Date(threadsAuth.expiresAt)) {
    return res.status(401).json({
      error: 'Threads token expired',
      message: 'Please reconnect your Threads account'
    });
  }
  
  // Add threadsAuth to request object
  (req as any).threadsAuth = threadsAuth;
  next();
};

// Get Threads connection status
router.get('/status', (req: Request, res: Response) => {
  const threadsAuth = (req.session as any)?.threadsAuth;
  
  res.json({
    connected: !!threadsAuth?.accessToken,
    username: threadsAuth?.username || null,
    userId: threadsAuth?.userId || null,
    expiresAt: threadsAuth?.expiresAt || null
  });
});

// Create and publish a text post
router.post('/posts/text', requireThreadsAuth, async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text content is required' });
    }
    
    if (text.length > 500) {
      return res.status(400).json({ error: 'Text content must be 500 characters or less' });
    }
    
    const threadsAuth = (req as any).threadsAuth;
    const postingService = new ThreadsPostingService(
      threadsAuth.accessToken,
      threadsAuth.userId
    );
    
    const postData: ThreadsPostData = {
      media_type: 'TEXT',
      text: text.trim()
    };
    
    const result = await postingService.createAndPublishPost(postData);
    
    res.json({
      success: true,
      post: result,
      message: 'Post published successfully'
    });
    
  } catch (error) {
    console.error('Text post creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create post',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Upload media and create media post
router.post('/posts/media', requireThreadsAuth, upload.single('media'), async (req: Request, res: Response) => {
  try {
    const { text, alt_text } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'Media file is required' });
    }
    
    // Generate public URL for the uploaded file
    const baseUrl = process.env.BASE_URL || 'https://streamscene.net';
    const mediaUrl = `${baseUrl}/uploads/threads/${file.filename}`;
    
    // Determine media type based on file
    const isVideo = /\.(mp4|mov|avi)$/i.test(file.filename);
    const mediaType = isVideo ? 'VIDEO' : 'IMAGE';
    
    const threadsAuth = (req as any).threadsAuth;
    const postingService = new ThreadsPostingService(
      threadsAuth.accessToken,
      threadsAuth.userId
    );
    
    const postData: ThreadsPostData = {
      media_type: mediaType,
      media_url: mediaUrl,
      text: text || undefined,
      alt_text: alt_text || undefined
    };
    
    const result = await postingService.createAndPublishPost(postData);
    
    res.json({
      success: true,
      post: result,
      media: {
        url: mediaUrl,
        type: mediaType,
        filename: file.filename
      },
      message: 'Media post published successfully'
    });
    
  } catch (error) {
    console.error('Media post creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create media post',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create carousel post (multiple media items)
router.post('/posts/carousel', requireThreadsAuth, upload.array('media', 10), async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length < 2) {
      return res.status(400).json({ error: 'At least 2 media files are required for carousel posts' });
    }
    
    if (files.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 media files allowed for carousel posts' });
    }
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text content is required for carousel posts' });
    }
    
    // Generate public URLs and create media upload objects
    const baseUrl = process.env.BASE_URL || 'https://streamscene.net';
    const mediaItems: ThreadsMediaUpload[] = files.map(file => {
      const mediaUrl = `${baseUrl}/uploads/threads/${file.filename}`;
      const isVideo = /\.(mp4|mov|avi)$/i.test(file.filename);
      
      return {
        media_type: isVideo ? 'VIDEO' : 'IMAGE',
        media_url: mediaUrl
      };
    });
    
    const threadsAuth = (req as any).threadsAuth;
    const postingService = new ThreadsPostingService(
      threadsAuth.accessToken,
      threadsAuth.userId
    );
    
    const result = await postingService.createCarouselPost(text.trim(), mediaItems);
    
    res.json({
      success: true,
      post: result,
      media: mediaItems.map((item, index) => ({
        url: item.media_url,
        type: item.media_type,
        filename: files[index].filename
      })),
      message: 'Carousel post published successfully'
    });
    
  } catch (error) {
    console.error('Carousel post creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create carousel post',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user's posts
router.get('/posts', requireThreadsAuth, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 25;
    
    if (limit > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100' });
    }
    
    const threadsAuth = (req as any).threadsAuth;
    const postingService = new ThreadsPostingService(
      threadsAuth.accessToken,
      threadsAuth.userId
    );
    
    const posts = await postingService.getUserPosts(limit);
    
    res.json({
      success: true,
      posts: posts,
      count: posts.data?.length || 0
    });
    
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ 
      error: 'Failed to get posts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific post details
router.get('/posts/:postId', requireThreadsAuth, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    
    const threadsAuth = (req as any).threadsAuth;
    const postingService = new ThreadsPostingService(
      threadsAuth.accessToken,
      threadsAuth.userId
    );
    
    const post = await postingService.getPost(postId);
    
    res.json({
      success: true,
      post: post
    });
    
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ 
      error: 'Failed to get post',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Save draft
router.post('/drafts', requireThreadsAuth, async (req: Request, res: Response) => {
  try {
    const { content, media_urls, media_type, scheduled_time, timezone } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const draft = await ThreadsDraft.create({
      userId: userId,
      content: content.trim(),
      media_urls: media_urls || null,
      media_type: media_type || 'TEXT',
      scheduled_time: scheduled_time ? new Date(scheduled_time) : undefined,
      timezone: timezone || 'UTC',
      status: 'DRAFT'
    });
    
    res.json({
      success: true,
      draft: draft,
      message: 'Draft saved successfully'
    });
    
  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({ 
      error: 'Failed to save draft',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user's drafts
router.get('/drafts', requireThreadsAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const drafts = await ThreadsDraft.findAll({
      where: { userId: userId },
      order: [['updated_at', 'DESC']]
    });
    
    res.json({
      success: true,
      drafts: drafts
    });
    
  } catch (error) {
    console.error('Get drafts error:', error);
    res.status(500).json({ 
      error: 'Failed to get drafts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update draft
router.put('/drafts/:draftId', requireThreadsAuth, async (req: Request, res: Response) => {
  try {
    const { draftId } = req.params;
    const { content, media_urls, media_type, scheduled_time, timezone, status } = req.body;
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const draft = await ThreadsDraft.findOne({
      where: { id: draftId, userId: userId }
    });
    
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    await draft.update({
      content: content || draft.content,
      media_urls: media_urls !== undefined ? media_urls : draft.media_urls,
      media_type: media_type || draft.media_type,
      scheduled_time: scheduled_time ? new Date(scheduled_time) : draft.scheduled_time,
      timezone: timezone || draft.timezone,
      status: status || draft.status
    });
    
    res.json({
      success: true,
      draft: draft,
      message: 'Draft updated successfully'
    });
    
  } catch (error) {
    console.error('Update draft error:', error);
    res.status(500).json({ 
      error: 'Failed to update draft',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete draft
router.delete('/drafts/:draftId', requireThreadsAuth, async (req: Request, res: Response) => {
  try {
    const { draftId } = req.params;
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const draft = await ThreadsDraft.findOne({
      where: { id: draftId, userId: userId }
    });
    
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    await draft.destroy();
    
    res.json({
      success: true,
      message: 'Draft deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete draft error:', error);
    res.status(500).json({ 
      error: 'Failed to delete draft',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;