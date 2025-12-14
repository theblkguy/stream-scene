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
const visionClient = null;

// Disable Google Cloud Vision for now to prevent deployment issues
console.log('⚠️ Google Cloud Vision disabled - OCR functionality not available');

// TODO: Re-enable when Google Cloud Vision credentials are properly configured
// async function initializeVisionClient() {
//   try {
//     const vision = await import('@google-cloud/vision');
//     visionClient = new vision.ImageAnnotatorClient();
//     console.log('✅ Google Cloud Vision initialized successfully');
//     return true;
//   } catch (error: any) {
//     console.warn('⚠️ Google Cloud Vision not available:', error?.message || error);
//     return false;
//   }
// }

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

    console.log(`📄 OCR request received for file: ${req.file.originalname} (${req.file.size} bytes)`);

    // OCR service is currently disabled - provide helpful fallback response
    if (!visionClient) {
      console.log('⚠️ Server-side OCR not available, suggesting client-side fallback');
      return res.status(503).json({
        success: false,
        error: 'Server OCR unavailable',
        message: 'Server-side OCR is temporarily disabled. Client should handle OCR processing.',
        fallback: true,
        suggestion: 'Use client-side Tesseract.js processing'
      });
    }

    // This block won't execute since visionClient is null
    // But left here for future Google Vision implementation
    const extractedData = {
      amount: null,
      merchant: null, 
      date: null,
      items: [],
      fullText: 'OCR service not available',
      service: 'disabled'
    };

    res.json({
      success: true,
      data: extractedData
    });

  } catch (error) {
    console.error('❌ OCR processing error:', error);
    res.status(500).json({
      success: false,
      error: 'OCR processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      fallback: true
    });
  }
});

// Test endpoint to check if OCR service is available
router.get('/status', (req, res) => {
  res.json({
    available: !!visionClient,
    service: visionClient ? 'google-vision' : 'none',
    message: visionClient ? 'OCR service is ready' : 'OCR service not configured',
    clientSideRecommended: !visionClient
  });
});

export default router;