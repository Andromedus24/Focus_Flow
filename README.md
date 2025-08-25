# 🚀 Focus Flow - AI-Powered Productivity Chrome Extension

An intelligent Chrome extension that helps you stay focused and productive using advanced AI technology to block distractions and manage your tasks effectively.

![Focus Flow](https://img.shields.io/badge/Focus%20Flow-v1.0.0-blue)
![License](https://img.shields.io/badge/License-ISC-green)
![Node.js](https://img.shields.io/badge/Node.js-18+-orange)
![Chrome](https://img.shields.io/badge/Chrome-88+-yellow)

## ✨ Features

### 🎯 **AI-Powered Focus Management**
- **Intelligent Website Blocking**: Uses Hugging Face embeddings and OpenAI GPT-4 to determine website relevance
- **Smart Task Analysis**: Automatically generates task-specific website recommendations
- **Context-Aware Filtering**: Considers your current goal when evaluating website relevance

### ⏰ **Advanced Timer & Pomodoro**
- **Flexible Focus Sessions**: Customizable duration from 10 minutes to 3 hours
- **Automatic Break Management**: Intelligent break reminders and session progression
- **Progress Tracking**: Visual progress bars and session analytics

### 📊 **Productivity Analytics**
- **Comprehensive Tracking**: Monitor focus time, completed tasks, and productivity scores
- **Visual Insights**: Beautiful charts and progress indicators
- **Historical Data**: Track your productivity trends over time

### 🛡️ **Distraction Blocking**
- **Multi-Layer Protection**: Essential websites, task-specific sites, and AI analysis
- **Real-Time Monitoring**: Instant website relevance checking during browsing
- **Smart Whitelisting**: Learn from your preferences and adjust blocking rules

### 🎨 **Modern User Interface**
- **Glass-Morphism Design**: Beautiful, modern UI with smooth animations
- **Responsive Layout**: Works perfectly on all screen sizes
- **Dark Mode Support**: Comfortable viewing in any lighting condition

## 🏗️ Architecture

```
Focus Flow/
├── focus-flow-api/          # Backend API server
│   ├── controllers/         # API endpoint handlers
│   ├── router.js           # API routing
│   └── index.js            # Server entry point
├── focus-flow-web/          # Chrome extension
│   ├── files/              # Extension files
│   │   ├── dashboard.html  # Main dashboard
│   │   ├── timer.js        # Timer functionality
│   │   └── content-script.js # Page-level features
│   ├── background.js       # Extension background script
│   └── manifest.json       # Extension configuration
└── package.json            # Root project configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- Chrome browser 88 or higher
- OpenAI API key

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/focus-flow.git
cd focus-flow
```

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Set Up Environment Variables
Create a `.env` file in the `focus-flow-api` directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
NODE_ENV=development
```

### 4. Start Development Servers
```bash
npm run dev
```

This will start both the API server and the Chrome extension development environment.

### 5. Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `focus-flow-web` folder
4. The Focus Flow extension will appear in your extensions list

## 🛠️ Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both API and web development servers |
| `npm run dev:api` | Start only the API server |
| `npm run dev:web` | Build the Chrome extension |
| `npm run build` | Build both API and web components |
| `npm run test` | Run all tests |
| `npm run lint` | Run linting on all code |
| `npm run format` | Format all code with Prettier |

### Project Structure

#### Backend API (`focus-flow-api/`)
- **Express.js server** with ES modules
- **AI integration** with Hugging Face and OpenAI
- **Security middleware** with Helmet.js and CORS
- **Comprehensive error handling** and validation
- **Logging and monitoring** with Morgan

#### Chrome Extension (`focus-flow-web/`)
- **Modern UI** with Tailwind CSS and Flowbite
- **Content scripts** for page-level productivity tracking
- **Background service worker** for extension management
- **Local storage** for data persistence
- **Chrome APIs** integration for browser functionality

## 🔧 Configuration

### API Configuration
The API can be configured through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `ALLOWED_ORIGINS` | CORS origins | localhost, chrome-extension |

### Extension Configuration
The Chrome extension can be configured through the manifest.json file and includes:
- **Permissions**: tabs, storage, notifications, alarms
- **Content scripts**: Page-level productivity tracking
- **Background scripts**: Extension lifecycle management
- **Keyboard shortcuts**: Quick access to features

## 📚 API Documentation

### Endpoints

#### Health Check
```http
GET /health
```

#### Check Website Relevance
```http
POST /api/check
Content-Type: application/json

{
  "titleTab": "GitHub - username/repository",
  "goalNeeded": "Complete project documentation",
  "URLTab": "https://github.com/username/repository"
}
```

#### Generate Task Websites
```http
POST /api/initial
Content-Type: application/json

{
  "taskGoal": "Learn React.js fundamentals",
  "context": "Beginner developer"
}
```

For complete API documentation, see [API README](focus-flow-api/README.md).

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run API tests only
npm run test:api

# Run extension tests only
npm run test:web
```

### Test Configuration
The project includes comprehensive test configurations:
- **API testing** with test scenarios and utilities
- **Extension testing** with Chrome extension testing framework
- **Performance testing** with response time thresholds
- **Integration testing** between API and extension

## 🚀 Deployment

### API Deployment
The API can be deployed to various platforms:

#### Vercel (Recommended)
```bash
cd focus-flow-api
vercel --prod
```

#### Docker
```bash
docker build -t focus-flow-api .
docker run -p 3000:3000 focus-flow-api
```

### Extension Deployment
1. Build the extension: `npm run build:web`
2. Package the extension: `npm run package:web`
3. Upload to Chrome Web Store or distribute manually

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and commit: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style
- Use ES6+ features
- Follow ESLint configuration
- Format code with Prettier
- Write comprehensive tests
- Document new features

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing GPT-4 API access
- **Hugging Face** for open-source AI models
- **Chrome Extensions Team** for the excellent extension platform
- **Tailwind CSS** for the beautiful UI framework

## 🆘 Support

### Getting Help
- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/yourusername/focus-flow/issues)
- 💬 [Discussions](https://github.com/yourusername/focus-flow/discussions)
- 📧 [Email Support](mailto:support@focusflow.com)

### Common Issues
- **Extension not loading**: Check Chrome version and developer mode
- **API errors**: Verify OpenAI API key and server status
- **Website blocking issues**: Check CORS configuration and permissions

## 🔄 Changelog

### v1.0.0 (Current)
- 🎉 Initial release
- 🚀 AI-powered website relevance checking
- ⏰ Advanced timer and Pomodoro technique
- 📊 Comprehensive productivity analytics
- 🎨 Modern glass-morphism UI design
- 🛡️ Multi-layer distraction blocking
- 📱 Responsive design for all devices
- 🔧 Comprehensive configuration options

### Upcoming Features
- 🔐 User authentication and sync
- 📈 Advanced analytics and insights
- 🤖 Machine learning model improvements
- 🌐 Cross-browser support
- 📱 Mobile app companion

## 📊 Project Status

![GitHub last commit](https://img.shields.io/github/last-commit/yourusername/focus-flow)
![GitHub issues](https://img.shields.io/github/issues/yourusername/focus-flow)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/focus-flow)
![GitHub contributors](https://img.shields.io/github/contributors/yourusername/focus-flow)

---

**Made with ❤️ by [Ronak Prabhu](https://github.com/yourusername)**

*Transform your productivity with AI-powered focus management*
