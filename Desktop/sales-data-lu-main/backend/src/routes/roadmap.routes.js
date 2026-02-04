/**
 * Roadmap Routes
 * Endpoints for counselor roadmap generator.
 */

const express = require('express');
const multer = require('multer');
const {
  generateRoadmap,
  getRoadmapById,
} = require('../controllers/roadmap.controller');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * POST /api/roadmap/generate
 * FormData: resume (file), name, currentRole, totalExperience, domain, targetOutcome, linkedinUrl, linkedinText
 */
router.post('/generate', upload.single('resume'), generateRoadmap);

/**
 * GET /api/roadmap/:id
 * Fetch saved roadmap by id
 */
router.get('/:id', getRoadmapById);

module.exports = router;
