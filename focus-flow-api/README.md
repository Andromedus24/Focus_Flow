# Focus Flow API

A Node.js backend API for the Focus Flow productivity Chrome extension.

## Features

- **Task Management**: Create and manage focus sessions with specific goals
- **AI-Powered Filtering**: Uses GPT-4o and embedding models to identify distracting websites
- **Smart Blocking**: Three-layer filtering system to keep users focused on their tasks
- **Real-time Processing**: Instant website relevance checking during browsing sessions

## API Endpoints

### POST `/initial`
Creates a new focus session and generates a whitelist of relevant websites.

**Request Body:**
```json
{
  "taskGoal": "Write a research paper on AI ethics",
  "duration": 60
}
```

**Response:** Comma-separated list of relevant websites

### POST `/check`
Checks if a specific website is relevant to the current task.

**Request Body:**
```json
{
  "titleTab": "YouTube - How to Stay Focused",
  "goalNeeded": "Write a research paper on AI ethics",
  "URLTab": "https://youtube.com/watch?v=..."
}
```

**Response:** "Yes" or "No" indicating relevance

## Technology Stack

- **Runtime**: Node.js with ES modules
- **Framework**: Express.js
- **AI Models**: 
  - OpenAI GPT-4o for task understanding
  - Hugging Face all-MiniLM-L6-v2 for embeddings
- **Deployment**: Vercel (Serverless)

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables:
   ```bash
   OPENAI_API_KEY=your_api_key_here
   ```

3. Start the server:
   ```bash
   npm start
   ```

## Deployment

The API is automatically deployed to Vercel on every push to the main branch.

**Production URL**: https://focus-flow-api-pearl.vercel.app

## Architecture

The API implements a three-layer filtering system:

1. **Essential Websites**: Hardcoded whitelist of productivity tools
2. **Task-Specific Websites**: AI-generated list based on user's current task
3. **Real-time Analysis**: Cosine similarity and GPT-4o analysis for borderline cases

## Contributing

Developed by **Ronak Prabhu** - A passionate developer focused on creating tools that enhance productivity.
