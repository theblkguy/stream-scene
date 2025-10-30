import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// In-memory storage for demo (in production, use a database)
const shortLinks = new Map<string, {
  canvasId: string;
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
}>();

// Generate a short, user-friendly code
function generateShortCode(): string {
  // Use a combination of timestamp and random for uniqueness but shorter
  const timestamp = Date.now().toString(36); // Base36 timestamp
  const random = crypto.randomBytes(2).toString('hex'); // 4 hex chars
  return (timestamp + random).substring(-6); // Take last 6 characters
}

// Create a short link for a canvas
router.post('/create', (req, res) => {
  try {
    const { canvasId } = req.body;
    
    if (!canvasId) {
      return res.status(400).json({ error: 'Canvas ID is required' });
    }

    // Check if a short link already exists for this canvas
    for (const [code, data] of shortLinks.entries()) {
      if (data.canvasId === canvasId && data.expiresAt > new Date()) {
        return res.json({
          shortCode: code,
          shortUrl: `${req.protocol}://${req.get('host')}/c/${code}`,
          fullUrl: `${req.protocol}://${req.get('host')}/canvas/shared/${canvasId}`,
          expiresAt: data.expiresAt.toISOString(),
          accessCount: data.accessCount
        });
      }
    }

    // Generate new short code
    let shortCode = generateShortCode();
    let attempts = 0;
    
    // Ensure uniqueness (retry up to 10 times)
    while (shortLinks.has(shortCode) && attempts < 10) {
      shortCode = generateShortCode();
      attempts++;
    }

    if (attempts >= 10) {
      return res.status(500).json({ error: 'Could not generate unique short code' });
    }

    // Create expiration (7 days from now)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Store the mapping
    shortLinks.set(shortCode, {
      canvasId,
      createdAt: new Date(),
      expiresAt,
      accessCount: 0
    });

    // Return the short link
    res.json({
      shortCode,
      shortUrl: `${req.protocol}://${req.get('host')}/c/${shortCode}`,
      fullUrl: `${req.protocol}://${req.get('host')}/canvas/shared/${canvasId}`,
      expiresAt: expiresAt.toISOString(),
      accessCount: 0
    });

  } catch (error) {
    console.error('Error creating short link:', error);
    res.status(500).json({ error: 'Failed to create short link' });
  }
});

// Resolve a short code to canvas ID
router.get('/resolve/:shortCode', (req, res) => {
  try {
    const { shortCode } = req.params;
    const linkData = shortLinks.get(shortCode);

    if (!linkData) {
      return res.status(404).json({ error: 'Short link not found' });
    }

    // Check if expired
    if (linkData.expiresAt < new Date()) {
      shortLinks.delete(shortCode);
      return res.status(410).json({ error: 'Short link has expired' });
    }

    // Increment access count
    linkData.accessCount++;

    res.json({
      canvasId: linkData.canvasId,
      shortCode,
      fullUrl: `${req.protocol}://${req.get('host')}/canvas/shared/${linkData.canvasId}`,
      createdAt: linkData.createdAt.toISOString(),
      expiresAt: linkData.expiresAt.toISOString(),
      accessCount: linkData.accessCount
    });

  } catch (error) {
    console.error('Error resolving short link:', error);
    res.status(500).json({ error: 'Failed to resolve short link' });
  }
});

// Get stats for a short code
router.get('/stats/:shortCode', (req, res) => {
  try {
    const { shortCode } = req.params;
    const linkData = shortLinks.get(shortCode);

    if (!linkData) {
      return res.status(404).json({ error: 'Short link not found' });
    }

    res.json({
      shortCode,
      canvasId: linkData.canvasId,
      createdAt: linkData.createdAt.toISOString(),
      expiresAt: linkData.expiresAt.toISOString(),
      accessCount: linkData.accessCount,
      isExpired: linkData.expiresAt < new Date()
    });

  } catch (error) {
    console.error('Error getting short link stats:', error);
    res.status(500).json({ error: 'Failed to get link stats' });
  }
});

// Clean up expired links (could be run periodically)
router.post('/cleanup', (req, res) => {
  try {
    const now = new Date();
    let cleaned = 0;

    for (const [code, data] of shortLinks.entries()) {
      if (data.expiresAt < now) {
        shortLinks.delete(code);
        cleaned++;
      }
    }

    res.json({
      message: `Cleaned up ${cleaned} expired links`,
      remainingLinks: shortLinks.size
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

export default router;