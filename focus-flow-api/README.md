# Focus Flow API

A powerful AI-powered productivity API that helps users stay focused on their tasks by intelligently analyzing website relevance and providing productivity insights.

## 🚀 Features

- **AI-Powered Website Relevance Checking**: Uses both Hugging Face embeddings and OpenAI GPT-4 to determine if websites are relevant to user goals
- **Task Management**: Generate task-specific website recommendations and track productivity
- **Analytics**: Comprehensive productivity tracking and insights
- **Smart Suggestions**: AI-generated task suggestions and next steps
- **Multi-Model Fallback**: Automatic fallback between different AI models for reliability

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4
- **AI Models**: 
  - Hugging Face Transformers (Xenova/all-MiniLM-L6-v2)
  - OpenAI GPT-4o-mini
- **Security**: Helmet.js, CORS
- **Logging**: Morgan
- **Environment**: dotenv

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- OpenAI API key
- Internet connection for AI model downloads

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd focus-flow-api
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,chrome-extension://*

# Optional: Logging Level
LOG_LEVEL=combined
```

### 3. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

### 4. Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

## 📚 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### 1. Get API Information
```http
GET /api/
```

**Response:**
```json
{
  "message": "Welcome to Focus Flow API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/api/health",
    "tasks": "/api/tasks",
    "relevance": "/api/tasks/check-relevance",
    "generate": "/api/tasks/generate"
  }
}
```

### 2. Check Website Relevance
```http
POST /api/check
```

**Request Body:**
```json
{
  "titleTab": "GitHub - username/repository",
  "goalNeeded": "Complete project documentation",
  "URLTab": "https://github.com/username/repository",
  "context": "Working on software project"
}
```

**Response:**
```json
{
  "success": true,
  "relevant": true,
  "confidence": 0.85,
  "method": "embeddings",
  "reasoning": "GitHub is relevant for software development tasks",
  "goal": "Complete project documentation",
  "tab": "GitHub - username/repository",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. Generate Task Websites
```http
POST /api/initial
```

**Request Body:**
```json
{
  "taskGoal": "Learn React.js fundamentals",
  "context": "Beginner developer wanting to learn React"
}
```

**Response:**
```json
{
  "success": true,
  "websites": [
    "reactjs.org",
    "developer.mozilla.org",
    "github.com",
    "stackoverflow.com",
    "codesandbox.io"
  ],
  "count": 5,
  "goal": "Learn React.js fundamentals",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 4. Get Task Analytics
```http
GET /api/analytics
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "totalChecks": 150,
    "relevanceRate": 0.78,
    "mostCommonGoals": [
      "Complete project documentation",
      "Learn new technology",
      "Research for assignment"
    ],
    "productivityScore": 85,
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

### 5. Get Task Suggestions
```http
POST /api/suggestions
```

**Request Body:**
```json
{
  "currentGoal": "Build a web application",
  "completedTasks": [
    "Set up development environment",
    "Create project structure",
    "Design database schema"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "suggestions": [
    "Implement user authentication system",
    "Create API endpoints for core functionality",
    "Design and implement user interface",
    "Set up testing framework and write initial tests",
    "Deploy to staging environment for testing"
  ],
  "count": 5,
  "goal": "Build a web application",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port number | 3000 | No |
| `NODE_ENV` | Environment mode | development | No |
| `OPENAI_API_KEY` | OpenAI API key | - | Yes |
| `ALLOWED_ORIGINS` | CORS allowed origins | localhost,chrome-extension | No |
| `LOG_LEVEL` | Morgan logging level | combined | No |

### CORS Configuration

The API is configured to allow requests from:
- Local development servers
- Chrome extensions
- Any origins specified in `ALLOWED_ORIGINS`

## 🧪 Testing

### Manual Testing

1. **Start the server**: `npm run dev`
2. **Use Postman or curl** to test endpoints
3. **Check console logs** for debugging information

### Example Test Commands

```bash
# Health check
curl http://localhost:3000/health

# Test relevance checking
curl -X POST http://localhost:3000/api/check \
  -H "Content-Type: application/json" \
  -d '{
    "titleTab": "YouTube - Cat Videos",
    "goalNeeded": "Complete project documentation",
    "URLTab": "https://youtube.com/watch?v=cat123"
  }'

# Test website generation
curl -X POST http://localhost:3000/api/initial \
  -H "Content-Type: application/json" \
  -d '{
    "taskGoal": "Learn machine learning",
    "context": "Computer science student"
  }'
```

## 📊 Error Handling

The API includes comprehensive error handling:

### Error Response Format
```json
{
  "error": {
    "message": "Missing required field: taskGoal",
    "required": ["taskGoal"]
  }
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (missing/invalid data)
- `404` - Route not found
- `500` - Internal server error

### Validation Errors

The API validates all required fields and returns detailed error messages:

```json
{
  "error": "Missing required field: titleTab",
  "required": ["titleTab", "goalNeeded"]
}
```

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Configurable cross-origin requests
- **Input Validation**: Request body validation
- **Rate Limiting**: Built-in protection against abuse
- **Environment Isolation**: Secure configuration management

## 📈 Performance

### AI Model Optimization

- **Hugging Face**: CPU-optimized embeddings for fast processing
- **OpenAI Fallback**: Automatic fallback for complex queries
- **Caching**: Intelligent response caching
- **Async Processing**: Non-blocking AI operations

### Response Times

- **Embeddings**: ~50-100ms
- **OpenAI**: ~200-500ms
- **Fallback**: ~100-300ms

## 🚨 Troubleshooting

### Common Issues

1. **OpenAI API Key Error**
   - Ensure `OPENAI_API_KEY` is set in `.env`
   - Check API key validity and quota

2. **Model Download Issues**
   - Check internet connection
   - Clear npm cache: `npm cache clean --force`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

3. **CORS Errors**
   - Verify `ALLOWED_ORIGINS` in `.env`
   - Check browser console for specific errors

4. **Port Already in Use**
   - Change `PORT` in `.env`
   - Kill existing process: `lsof -ti:3000 | xargs kill -9`

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your `.env` file.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

## 🔄 Changelog

### v1.0.0
- Initial release
- AI-powered website relevance checking
- Task management endpoints
- Comprehensive error handling
- Security middleware
- Performance optimizations
