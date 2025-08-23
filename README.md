# 🏆 SDAchievement - Steam Achievement Tracker for Steam Deck

A comprehensive Decky Loader plugin that tracks your Steam game progress and achievements directly in the Steam Deck's Quick Access menu.

## ✨ Features

- **📊 Real-time Progress Tracking**: Monitor current game progress and statistics
- **🏆 Achievement Management**: View detailed achievement lists with unlock status
- **📈 Overall Progress**: Track your Steam profile's achievement statistics
- **⭐ Recent Achievements**: View recently unlocked achievements across all games
- **🔄 Auto-refresh**: Configurable automatic data updates (30-120 seconds)
- **🎯 Game Detection**: Automatic detection of currently running games
- **📱 Intuitive Interface**: Seamless integration with Steam Deck UI
- **⚙️ Settings Management**: Configurable Steam API integration

## 🏗️ Architecture

### Frontend (TypeScript/React)
- Built with React and TypeScript
- Uses Decky Loader UI components
- Modular tab-based interface
- Custom hooks for state management

### Backend (Python)
- Modular service architecture
- Steam API integration
- Caching system for performance
- Settings persistence

## 📦 Installation

### Prerequisites
1. **Decky Loader** installed on Steam Deck
   - Installation guide: https://github.com/SteamDeckHomebrew/decky-loader
2. **Steam API Key** (optional but recommended)
   - Get yours at: https://steamcommunity.com/dev/apikey

### Quick Install
```bash
# Clone the repository
git clone https://github.com/SteamDeckHomebrew/SDAchivement.git
cd SDAchivement

# Install dependencies
pnpm install

# Build the plugin
pnpm run build

# Copy to Steam Deck plugins directory
scp -r . deck@steamdeck:~/homebrew/plugins/SDAchievement/
```

### Manual Build
```bash
# Frontend build
pnpm run build

# The plugin files will be in the dist/ directory
```

## 🚀 Usage

1. **Install the plugin** using Decky Loader
2. **Configure Steam API** (Settings tab):
   - Enter your Steam API key
   - Your Steam User ID will be auto-detected
3. **Launch a game** on your Steam Deck
4. **Open Quick Access** (... button)
5. **Select the Trophy icon** (SDAchievement)

### Interface Tabs

#### 🎮 Current Game
- Displays currently running game information
- Achievement progress with unlock status
- Game statistics and playtime
- Manual refresh options

#### 📅 Recent
- Recently unlocked achievements (last 10)
- Option to track specific games
- Perfect games showcase

#### 📊 Overall
- Steam profile achievement statistics
- Total games owned vs completed
- Achievement completion percentage
- Perfect games list

#### ⚙️ Settings
- Steam API key configuration
- Auto-refresh settings (30-120 seconds)
- Test game selection
- Plugin reload options

## 🔧 Configuration

### Steam API Setup
1. Obtain API key from https://steamcommunity.com/dev/apikey
2. Enter in Settings tab
3. User ID is auto-detected from Steam client

### Auto-refresh
- Enable/disable automatic data updates
- Configurable interval (30-120 seconds)
- Only active on Current Game tab

## 📁 Project Structure

```
SDAchivement/
├── src/                          # Frontend TypeScript/React
│   ├── components/
│   │   ├── common/              # Shared UI components
│   │   ├── achievements/        # Achievement-specific components
│   │   ├── game/               # Game information components
│   │   └── tabs/               # Main tab components
│   ├── hooks/                   # React custom hooks
│   ├── services/               # Frontend API services
│   ├── models/                 # TypeScript types
│   └── index.tsx               # Main entry point
├── py_modules/                  # Backend Python modules
│   ├── services/               # Core services
│   │   ├── achievement.py      # Achievement logic
│   │   ├── game_detector.py    # Game detection
│   │   ├── settings.py         # Settings management
│   │   └── cache.py           # Caching system
│   ├── models/                # Data models
│   └── utils/                 # Utilities
├── main.py                     # Main plugin class
├── plugin.json                 # Plugin metadata
├── package.json               # Node.js dependencies
├── requirements.txt           # Python dependencies
├── rollup.config.js          # Build configuration
└── README.md
```

## 🛠️ Development

### Development Mode
```bash
# Watch mode for frontend changes
pnpm run watch

# View Python logs
tail -f ~/homebrew/logs/SDAchievement/plugin.log

# Or use journalctl
journalctl -u plugin_loader -f
```

### Key Technologies
- **Frontend**: React, TypeScript, Decky UI
- **Backend**: Python 3.x, asyncio
- **Build**: Rollup, pnpm
- **APIs**: Steam Web API

### Data Flow
1. Frontend requests data via API calls
2. Python backend processes requests
3. Steam API integration for live data
4. Caching system for performance
5. Auto-refresh for real-time updates

## 📝 API Reference

### Main Plugin Methods
```python
# Game Detection
get_current_game() -> Optional[Dict]
get_game_info(app_id: int) -> Dict

# Achievement Management  
get_achievements(app_id: int) -> Dict
get_recent_achievements(limit: int) -> List[Dict]
get_achievement_progress() -> Dict

# Settings
set_steam_api_key(api_key: str) -> bool
set_steam_user_id(user_id: str) -> bool
reload_settings() -> Dict
```

### Frontend Services
```typescript
// API calls
getCurrentGame(): Promise<GameInfo>
getAchievements(appId: number): Promise<AchievementData>
getRecentAchievements(): Promise<Achievement[]>

// Settings management
loadSettings(): Promise<Settings>
saveSettings(settings: Settings): Promise<boolean>
```

## 🐛 Troubleshooting

### Plugin Not Loading
- Verify Decky Loader installation
- Check plugin directory: `~/homebrew/plugins/SDAchievement/`
- Restart Steam Deck or reload plugins

### No Achievement Data
- Ensure Steam API key is configured
- Verify game supports Steam achievements
- Check if game was launched at least once
- Use manual refresh button

### Performance Issues
- Check cache directory permissions
- Reduce auto-refresh frequency
- Clear cache files if corrupted

### Common Logs
```bash
# Plugin logs
tail -f ~/homebrew/logs/SDAchievement/plugin.log

# Decky Loader logs
journalctl -u plugin_loader -f

# System logs
dmesg | grep -i error
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Follow existing code style
4. Add tests for new features
5. Submit a pull request

### Development Setup
```bash
git clone https://github.com/SteamDeckHomebrew/SDAchivement.git
cd SDAchivement
pnpm install
pnpm run watch  # Development mode
```

## 📄 License

BSD-3-Clause License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) community
- Steam Deck Homebrew developers
- Steam Web API documentation

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/SteamDeckHomebrew/SDAchivement/issues)
- **Discord**: [Decky Loader Community](https://discord.gg/deckyloader)

---

**Created with ❤️ for the Steam Deck community**

*Happy achievement hunting!* 🎮🏆