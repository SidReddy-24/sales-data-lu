/**
 * LinkedIn Routes
 * Defines API endpoints for LinkedIn profile analysis
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  analyzeLinkedInProfile,
  analyzeResume,
  getAnalysisHistory,
} = require('../controllers/linkedin.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * POST /api/linkedin/analyze
 * Analyze a LinkedIn profile
 * Body: { linkedinUrl: string }
 */
router.post('/analyze', analyzeLinkedInProfile);

/**
 * POST /api/linkedin/analyze-resume
 * Analyze a resume upload (PDF or DOCX)
 * FormData: resume (file)
 */
router.post('/analyze-resume', upload.single('resume'), analyzeResume);

/**
 * GET /api/linkedin/history/:url
 * Get analysis history for a LinkedIn URL
 */
router.get('/history/:url', getAnalysisHistory);

module.exports = router;
