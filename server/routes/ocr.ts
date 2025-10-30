import * as vision from '@google-cloud/vision';
import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/authMiddleWare.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Initialize Google Cloud Vision client
let visionClient: vision.ImageAnnotatorClient | null = null;

try {
  // Try to initialize Google Cloud Vision
  visionClient = new vision.ImageAnnotatorClient();
  console.log('✅ Google Cloud Vision initialized successfully');
} catch (error) {
  console.warn('⚠️ Google Cloud Vision not available:', error);
}

// Helper function to extract data from OCR text
const extractReceiptData = (text: string) => {
  // Extract amount patterns
  const amountPatterns = [
    /(?:total|amount|sum|subtotal)[\s:$]*([0-9]+\.?[0-9]*)/i,
    /\$\s*([0-9]+\.?[0-9]*)/g,
    /([0-9]+\.[0-9]{2})$/gm,
  ];

  const amounts: number[] = [];
  amountPatterns.forEach(pattern => {
    const matches = [...text.matchAll(new RegExp(pattern, 'gi'))];
    matches.forEach(match => {
      const numStr = match[1] || match[0].replace(/[^0-9.]/g, '');
      const num = parseFloat(numStr);
      if (!isNaN(num) && num > 0 && num < 100000) {
        amounts.push(num);
      }
    });
  });

  // Extract date patterns
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(\d{1,2}-\d{1,2}-\d{4})/,
    /(\d{4}-\d{1,2}-\d{1,2})/,
  ];

  let extractedDate = null;
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      extractedDate = match[0];
      break;
    }
  }

  // Extract vendor (usually first meaningful line)
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 2);
  
  let vendor = null;
  for (const line of lines.slice(0, 5)) {
    if (!/^\d+$/.test(line) && 
        !/\d{1,2}[/-]\d{1,2}[/-]\d{4}/.test(line) &&
        line.length > 3 && line.length < 50) {
      vendor = line;
      break;
    }
  }

  return {
    amount: amounts.length > 0 ? Math.max(...amounts) : null,
    date: extractedDate,
    vendor: vendor,
    confidence: amounts.length > 0 ? 0.85 : 0.5,
    rawText: text,
    service: undefined as string | undefined
  };
};

// OCR endpoint using Google Cloud Vision
router.post('/ocr', requireAuth, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let extractedData;

    if (visionClient) {
      // Use Google Cloud Vision if available
      try {
        const [result] = await visionClient.textDetection({
          image: {
            content: req.file.buffer.toString('base64')
          }
        });

        const detections = result.textAnnotations;
        const text = detections && detections.length > 0 ? detections[0].description || '' : '';
        
        extractedData = extractReceiptData(text);
        extractedData.service = 'google-vision';
        
      } catch (visionError) {
        console.error('Google Vision API error:', visionError);
        throw new Error('Google Vision processing failed');
      }
    } else {
      // Fallback response when Google Vision is not available
      return res.status(503).json({
        error: 'OCR service not available',
        message: 'Server-side OCR is not configured. Please use client-side processing.',
        fallback: true
      });
    }

    res.json({
      success: true,
      data: extractedData
    });

  } catch (error) {
    console.error('OCR processing error:', error);
    res.status(500).json({
      error: 'OCR processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      fallback: true
    });
  }
});

// Test endpoint to check if OCR service is available
router.get('/ocr/status', requireAuth, (req, res) => {
  res.json({
    available: !!visionClient,
    service: visionClient ? 'google-vision' : 'none',
    message: visionClient ? 'OCR service is ready' : 'OCR service not configured'
  });
});

export default router;