# 🧮 Numix Calculator

**A premium Progressive Web App calculator with advanced features and music integration**

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge)](https://your-calculator-app.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-green?style=for-the-badge)](https://web.dev/progressive-web-apps/)
[![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5+-purple?style=for-the-badge&logo=vite)](https://vitejs.dev/)

## ✨ Features Overview

### 🎵 **Integrated Music Player**
- **Spotify Integration** - Full playback control with Web Playback SDK
- **Apple Music Support** - Native MusicKit JS integration for iOS/macOS
- **Smart Platform Detection** - Automatically suggests the best service for your device
- **Unified Controls** - Single interface for both music services
- **Background Playback** - Continue listening while calculating

### 🔢 **Advanced Calculator Modes**
- **Standard Calculator** - Basic arithmetic with memory functions
- **Scientific Calculator** - Trigonometric, logarithmic, and advanced mathematical functions
- **Programmer Calculator** - Binary, octal, decimal, and hexadecimal operations with bitwise functions
- **Unit Converter** - Currency, length, weight, temperature, and time conversions

### 📱 **Premium PWA Experience**
- **Offline Capability** - Full functionality without internet connection
- **Mobile Optimization** - Native app-like experience on all devices
- **iPhone Notch Support** - Safe area handling for modern iOS devices
- **Installation Prompts** - Smart, non-intrusive install suggestions
- **Push Notifications** - Background sync and updates (optional)

### 🎨 **Modern UI/UX**
- **Dark/Light Themes** - Automatic and manual theme switching
- **Touch Optimized** - 44px minimum touch targets for perfect mobile interaction
- **Haptic Feedback** - Tactile responses on supported devices
- **Smooth Animations** - 60fps transitions and micro-interactions
- **Responsive Design** - Perfect on phones, tablets, and desktops

### 📊 **Smart History & Data**
- **Persistent History** - Calculations saved for 30 days with automatic cleanup
- **Categorized Entries** - Different styling for each calculator type
- **Metadata Tracking** - Time, calculator mode, and operation type
- **Export/Import** - Backup and restore calculation history
- **Search & Filter** - Find specific calculations quickly

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern browser with PWA support
- HTTPS for production (required for PWA features)

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/numix-calculator.git
cd numix-calculator

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to your hosting service
npm run deploy
```

## 🎵 Music Integration Setup

### Spotify Configuration
1. **Create Spotify App**
   ```bash
   # Visit Spotify Developer Dashboard
   https://developer.spotify.com/dashboard
   ```
   
2. **Configure Redirect URIs**
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

3. **Update Configuration**
   ```javascript
   // src/utils/spotifyManager.js
   this.clientId = 'your_spotify_client_id';
   ```

### Apple Music Configuration
1. **Join Apple Developer Program**
2. **Create MusicKit Identifier**
3. **Generate Developer Token**
   ```javascript
   // src/utils/appleMusicManager.js
   this.developerToken = 'your_apple_music_developer_token';
   ```

> **Note**: Apple Music requires HTTPS and works best on iOS/macOS devices

## 🏗️ Architecture & Technical Details

### Technology Stack
- **Frontend**: React 18 with Hooks and Context API
- **Build Tool**: Vite 5 for fast development and optimized builds
- **PWA**: Custom service worker with advanced caching strategies
- **Styling**: CSS Modules with CSS Custom Properties
- **APIs**: MathJS for calculations, Fixer.io for currency rates
- **Music**: Spotify Web Playback SDK, Apple MusicKit JS

### Project Structure
```
src/
├── components/           # React components
│   ├── Calculator.jsx   # Main calculator container
│   ├── MusicPlayer.jsx  # Unified music player
│   └── AdditonalCalculators/ # Specialized calculators
├── utils/               # Utility functions and managers
│   ├── spotifyManager.js     # Spotify integration
│   ├── appleMusicManager.js  # Apple Music integration
│   ├── localStorageManager.js # Data persistence
│   └── pwaUtils.js          # PWA functionality
├── App.jsx             # Main app component
└── main.jsx           # Application entry point

public/
├── manifest.json       # PWA manifest
├── service-worker.js   # Custom service worker
└── icons/             # PWA icons (72x72 to 512x512)
```

### Key Features Implementation

#### Progressive Web App
- **Manifest Configuration**: Complete PWA manifest with shortcuts and categories
- **Service Worker**: Advanced caching with stale-while-revalidate strategy
- **Offline Support**: Full calculator functionality without internet
- **Installation**: Smart prompts with user preference tracking

#### Mobile Optimization
- **Viewport Handling**: Dynamic viewport units for mobile browsers
- **Safe Areas**: Support for iPhone notches and dynamic islands
- **Touch Targets**: Minimum 44px for accessibility compliance
- **Performance**: Optimized animations and lazy loading

#### Data Management
- **Local Storage**: Automatic data cleanup and migration
- **IndexedDB**: Large data storage for offline functionality
- **Memory Management**: Efficient state handling and cleanup
- **Sync**: Background synchronization when online

## 🔧 Configuration Options

### Environment Variables
```bash
# .env.local
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_APPLE_MUSIC_TOKEN=your_apple_music_token
VITE_CURRENCY_API_KEY=your_fixer_io_api_key
VITE_APP_VERSION=1.0.0
```

### PWA Configuration
```javascript
// public/manifest.json
{
  "name": "Numix Calculator",
  "short_name": "Numix",
  "theme_color": "#6366f1",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/"
}
```

### Service Worker Caching
```javascript
// Cache strategies
const strategies = {
  static: 'cache-first',      // HTML, CSS, JS
  api: 'network-first',       // API calls
  images: 'cache-first',      // Icons, images
  fonts: 'cache-first'        // Web fonts
};
```

## 📱 Device Support & Testing

### Supported Platforms
- **iOS**: 12+ (Safari, Chrome, Firefox)
- **Android**: 8+ (Chrome, Firefox, Samsung Internet)
- **Desktop**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+

### Testing Checklist
- [ ] PWA installation on iOS/Android
- [ ] Offline functionality
- [ ] Music player integration
- [ ] Safe area handling on notched devices
- [ ] Touch accessibility
- [ ] Performance (Lighthouse score 90+)

### Performance Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.0s

## 🚀 Deployment

### Static Hosting (Recommended)
```bash
# Netlify
npm run build && netlify deploy --prod --dir dist

# Vercel
npm run build && vercel --prod

# GitHub Pages
npm run build && npm run deploy:gh-pages
```

### Docker Deployment
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### CDN Configuration
```javascript
// Optimal caching headers
const cacheHeaders = {
  'Cache-Control': 'public, max-age=31536000', // 1 year for assets
  'Service-Worker': 'public, max-age=0',       // No cache for SW
  'HTML': 'public, max-age=3600'              // 1 hour for HTML
};
```

## 🔐 Security & Privacy

### Data Protection
- **No Server Storage**: All data stored locally
- **HTTPS Required**: Secure connections for PWA features
- **CSP Headers**: Content Security Policy implementation
- **Subresource Integrity**: Script integrity verification

### Music Service Privacy
- **OAuth 2.0**: Secure authentication flows
- **Token Management**: Automatic refresh and cleanup
- **Minimal Permissions**: Only playback control, no data access
- **User Consent**: Clear permission requests

## 📈 Analytics & Monitoring

### Performance Monitoring
```javascript
// Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### Error Tracking
```javascript
// Global error handling
window.addEventListener('error', (event) => {
  // Send to monitoring service
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  // Handle promise rejections
  console.error('Unhandled promise rejection:', event.reason);
});
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

### Code Standards
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks
- **Conventional Commits**: Commit message format

### Testing
```bash
# Run tests
npm run test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links & Resources

### Documentation
- [Progressive Web Apps](https://web.dev/progressive-web-apps/)
- [Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk/)
- [Apple MusicKit JS](https://developer.apple.com/documentation/musickitjs)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

### Tools & Services
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance auditing
- [Workbox](https://developers.google.com/web/tools/workbox) - Service worker libraries
- [PWA Builder](https://www.pwabuilder.com/) - PWA testing and validation

## 🆘 Support & FAQ

### Common Issues

**Q: Music player not working?**
A: Ensure you have the correct API keys configured and HTTPS is enabled.

**Q: PWA installation not showing?**
A: Check that you're using HTTPS and the manifest.json is properly configured.

**Q: Calculator buttons not responsive on mobile?**
A: Verify touch targets are at least 44px and touch-action is set correctly.

### Getting Help
- 📧 Email: support@numix-calculator.com
- 💬 Discord: [Join our community](https://discord.gg/numix)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/numix-calculator/issues)

---

Made with ❤️ by [Your Name](https://yourwebsite.com) | [Live Demo](https://your-calculator-app.com)
