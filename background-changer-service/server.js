const express = require('express');
const multer = require('multer');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Create necessary directories
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'output');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, and PNG images are allowed'));
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from output directory
app.use('/output', express.static(OUTPUT_DIR));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Background changer service is running' });
});

// Main endpoint: Change background
app.post('/api/change-background', upload.single('photo'), async (req, res) => {
  let uploadedFilePath = null;

  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No photo file uploaded. Please provide a file with field name "photo"'
      });
    }

    // Validate background description
    const { background } = req.body;
    if (!background || typeof background !== 'string' || background.trim() === '') {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'Background description is required in the request body'
      });
    }

    uploadedFilePath = req.file.path;

    console.log(`[${new Date().toISOString()}] Processing photo: ${req.file.originalname}`);
    console.log(`Background requested: "${background}"`);

    // Create prompt for OpenAI
    const prompt = `Ganti background pada gambar ini dengan background: ${background}.
Jangan mengubah wajah, rambut, kulit, kacamata, atau pakaian sama sekali.
Pertahankan semua detail orang dengan jelas dan natural.
Edit hanya area background.
Buat hasil yang rapi, natural, dan bebas dari warna bocor ke tubuh.
Jika batas antara orang dan background tidak jelas, perhalus secara otomatis.`;

    // Read the uploaded file
    const imageBuffer = fs.readFileSync(uploadedFilePath);
    const imageFile = new File([imageBuffer], req.file.originalname, { type: req.file.mimetype });

    // Call OpenAI Images Edit API
    console.log('Calling OpenAI Images Edit API...');
    const response = await openai.images.edit({
      image: imageFile,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    });

    if (!response.data || !response.data[0]?.b64_json) {
      throw new Error('OpenAI did not return image data');
    }

    // Generate unique filename for output
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const outputFilename = `result-${timestamp}-${randomStr}.png`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    // Save the result image
    const imageData = Buffer.from(response.data[0].b64_json, 'base64');
    fs.writeFileSync(outputPath, imageData);

    console.log(`[${new Date().toISOString()}] Successfully saved result to: ${outputFilename}`);

    // Clean up uploaded file
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
      console.log('Cleaned up uploaded file');
    }

    // Return success response
    res.json({
      success: true,
      url: `/output/${outputFilename}`,
      filename: outputFilename,
      message: 'Background changed successfully'
    });

  } catch (error) {
    console.error('Error processing image:', error);

    // Clean up uploaded file on error
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
    }

    // Send error response
    res.status(500).json({
      success: false,
      error: 'Failed to process image',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  next();
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('Background Changer Service');
  console.log('='.repeat(60));
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoint: POST http://localhost:${PORT}/api/change-background`);
  console.log('='.repeat(60));
  console.log('Required environment variables:');
  console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓ Set' : '✗ Missing');
  console.log('='.repeat(60));
});
