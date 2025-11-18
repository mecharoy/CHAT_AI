import express from 'express';
import upload from '../config/multer.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Upload file
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read file content for text files
    let fileContent = null;
    if (req.file.mimetype.startsWith('text/') || req.file.mimetype === 'application/pdf') {
      try {
        const content = await fs.readFile(req.file.path, 'utf-8');
        fileContent = content.substring(0, 5000); // Limit to first 5000 characters
      } catch (err) {
        console.log('Could not read file content:', err);
      }
    }

    res.json({
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        content: fileContent
      },
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
});

// Get file
router.get('/:filename', authenticateToken, async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../uploads', req.params.filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

// Delete file
router.delete('/:filename', authenticateToken, async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../uploads', req.params.filename);

    await fs.unlink(filePath);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
