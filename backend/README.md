# LinkedIn Profile Analyzer Backend

A production-ready Node.js + Express backend that integrates with Apify LinkedIn Profile Scraper API.

## Features

- LinkedIn profile scraping via Apify API
- Profile strength analysis (0-100 score)
- Personalized improvement suggestions
- MongoDB storage for analysis history
- Rate limiting and security
- Comprehensive error handling

## Tech Stack

- Node.js + Express.js
- MongoDB (Mongoose)
- Axios
- dotenv

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/linkedin-analyzer
APIFY_TOKEN=your_apify_token_here
APIFY_ACTOR_ID=2SyP0bXvmgGr8IVCZ
NODE_ENV=development
```

### 3. Start MongoDB

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 4. Run Server

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Analyze Profile

**POST** `/api/linkedin/analyze`

```json
{
  "linkedinUrl": "https://www.linkedin.com/in/username"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "profileScore": 78,
    "strengths": ["Well-crafted headline", "Good skills"],
    "improvements": ["Add certifications"]
  }
}
```

### Health Check

**GET** `/health`

## Testing with Postman

1. Health check: `GET http://localhost:5000/health`
2. Analyze: `POST http://localhost:5000/api/linkedin/analyze`

## Project Structure

```
src/
├── app.js              # Express app
├── server.js           # Entry point
├── config/db.js        # MongoDB connection
├── controllers/        # Business logic
├── models/             # MongoDB schemas
├── routes/             # API routes
├── services/           # Apify integration
└── utils/              # Profile analyzer
```

## Security

- API token in `.env` (never committed)
- LinkedIn URL validation
- Rate limiting (100 req/15 min)
- Error handling for all failures
