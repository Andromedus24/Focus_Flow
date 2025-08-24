# Focus Flow Chrome Extension

A powerful AI-driven Chrome extension designed to help users maintain focus and productivity by intelligently blocking distracting websites.

## Features

### 🎯 **Smart Focus Management**
- Set specific focus goals and time durations
- AI-powered task understanding and website filtering
- Customizable focus sessions (10 minutes to 3 hours)

### 🚫 **Intelligent Distraction Blocking**
- Three-layer filtering system for accurate blocking decisions
- Real-time website relevance analysis
- Saves blocked URLs for later exploration
- Whitelist essential productivity tools

### ⏱️ **Productivity Tools**
- Integrated Pomodoro-style timer
- Customizable to-do list management
- Calendar integration for upcoming events
- Progress tracking and session management

### 🎨 **User Experience**
- Beautiful, intuitive interface with modern design
- Responsive design for all screen sizes
- Smooth animations and transitions
- Dark/light theme support

## Installation

### For Users
1. Download the extension files
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `focus-flow-web` folder
5. The extension will be installed and ready to use

### For Developers
1. Clone the repository
2. Navigate to the `focus-flow-web` directory
3. Install dependencies (if any)
4. Load as an unpacked extension in Chrome

## Usage

### Starting a Focus Session
1. Open a new tab (the extension will automatically load)
2. Enter your current focus task
3. Select your desired session duration
4. Click "Time to Focus Flow!" to begin

### Managing Tasks
- Add tasks to your to-do list
- Mark tasks as complete
- Delete completed tasks
- View upcoming calendar events

### During Focus Sessions
- The timer will count down your session
- Distracting websites will be automatically blocked
- You can pause or stop the session at any time
- Blocked URLs are saved for later exploration

## Technical Details

### Architecture
- **Manifest V3**: Modern Chrome extension architecture
- **Background Service Worker**: Handles website blocking logic
- **Content Scripts**: Manages page interactions
- **Chrome Storage API**: Persists user data and settings

### Key Components
- `background.js`: Main extension logic and website blocking
- `dashboard.html`: Main interface for setting up focus sessions
- `timer.js`: Session timer and progress management
- `todo.js`: Task list management
- `blocked.html`: Page shown when accessing blocked websites

### Browser Permissions
- `tabs`: Access to browser tabs for blocking
- `webNavigation`: Monitor website navigation
- `activeTab`: Interact with current tab
- `storage`: Save user preferences and data

## Development

### File Structure
```
focus-flow-web/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── files/                 # Extension interface files
│   ├── dashboard.html     # Main dashboard
│   ├── blocked.html       # Blocked page interface
│   ├── installed.html     # Installation confirmation
│   ├── assets/            # CSS, JS, and images
│   └── *.js              # Feature-specific scripts
└── README.md             # This file
```

### Building and Testing
1. Make changes to the source files
2. Reload the extension in Chrome
3. Test functionality in a new tab
4. Debug using Chrome DevTools

## Contributing

Developed by **Ronak Prabhu** - A passionate developer focused on creating tools that enhance productivity and help users achieve their goals.

## License

This project is licensed under the ISC License.

## Support

For issues, feature requests, or contributions, please refer to the main project repository.
