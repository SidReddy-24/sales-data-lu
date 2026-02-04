/**
 * Express Application Setup
 * Configures middleware, routes, and error handling
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const linkedinRoutes = require('./routes/linkedin.routes');
const roadmapRoutes = require('./routes/roadmap.routes');

const app = express();

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Content-Type validation middleware for JSON API routes
 * Ensures requests have proper Content-Type header
 */
const requireJsonContentType = (req, res, next) => {
  // Skip JSON enforcement for resume uploads
  if (req.path === '/analyze-resume' || req.path === '/generate') {
    return next();
  }

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'] || '';
    const isJson = contentType.includes('application/json');

    if (!isJson) {
      return res.status(400).json({
        success: false,
        error: 'Content-Type header must be application/json',
        hint: 'In Thunder Client: Add header "Content-Type: application/json"',
      });
    }
  }
  next();
};

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes (with Content-Type validation for JSON payloads)
app.use('/api/linkedin', requireJsonContentType, linkedinRoutes);
app.use('/api/roadmap', requireJsonContentType, roadmapRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
