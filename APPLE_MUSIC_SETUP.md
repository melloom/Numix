# Apple Music Integration Setup

## Overview

The Numix Calculator includes full Apple Music integration using MusicKit JS, allowing users to control their Apple Music playback while using the calculator. This integration works best on iOS and macOS devices.

## Prerequisites

1. **Apple Developer Account** - Required to create MusicKit identifiers and developer tokens
2. **HTTPS** - Apple Music integration requires secure connections
3. **Modern Browser** - Support for MusicKit JS APIs
4. **Apple Music Subscription** - Users need an active subscription for full functionality

## Step-by-Step Setup

### 1. Apple Developer Program

First, you need to join the Apple Developer Program:

1. Visit [Apple Developer](https://developer.apple.com/)
2. Sign in with your Apple ID
3. Enroll in the Apple Developer Program ($99/year)
4. Wait for approval (usually 24-48 hours)

### 2. Create MusicKit Identifier

1. Go to [Apple Developer Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/)
2. Click on "Identifiers" in the sidebar
3. Click the "+" button to create a new identifier
4. Select "MusicKit Identifier" and click "Continue"
5. Enter your details:
   - **Description**: "Numix Calculator Music Integration"
   - **Identifier**: `com.yourcompany.numix-calculator.musickit`
6. Click "Register"

### 3. Generate Developer Token

Apple Music requires a developer token for authentication. This involves creating a private key and signing a JWT token.

#### Create Private Key

1. In the Apple Developer portal, go to "Keys"
2. Click the "+" button to create a new key
3. Enter a name: "Numix Calculator MusicKit Key"
4. Check "MusicKit" under services
5. Click "Continue" and then "Register"
6. Download the private key file (`.p8` file)
7. **Important**: Save the Key ID (10-character string)

#### Generate JWT Token

You'll need to create a JWT token using your private key. Here's a Node.js script to generate it:

```javascript
// generate-token.js
const jwt = require('jsonwebtoken');
const fs = require('fs');

// Your details from Apple Developer
const TEAM_ID = 'YOUR_TEAM_ID';          // 10-character Team ID
const KEY_ID = 'YOUR_KEY_ID';            // 10-character Key ID  
const PRIVATE_KEY_PATH = './AuthKey_YOUR_KEY_ID.p8';

// Read the private key
const privateKey = fs.readFileSync(PRIVATE_KEY_PATH);

// JWT payload
const payload = {
  iss: TEAM_ID,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (86400 * 180) // 180 days
};

// Generate token
const token = jwt.sign(payload, privateKey, {
  algorithm: 'ES256',
  header: {
    kid: KEY_ID
  }
});

console.log('Your Apple Music Developer Token:');
console.log(token);
```

Run the script:
```bash
npm install jsonwebtoken
node generate-token.js
```

### 4. Configure the Calculator App

Update the Apple Music manager with your developer token:

```javascript
// src/utils/appleMusicManager.js
class AppleMusicManager {
  constructor() {
    // Replace with your actual developer token
    this.developerToken = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEyMzQ1Njc4OTAifQ...';
    this.appName = 'Numix Calculator';
    this.appBuild = '1.0.0';
    
    this.init();
  }
  // ... rest of the class
}
```

### 5. Domain Configuration

For production deployment, you may need to configure your domain with Apple:

1. In your MusicKit identifier settings
2. Add your production domain
3. Ensure HTTPS is properly configured

## Features Included

### Playback Control
- ✅ Play/pause current track
- ✅ Skip to next/previous track
- ✅ Volume control
- ✅ Display current track information

### Library Access
- ✅ Access user's playlists
- ✅ Search Apple Music catalog
- ✅ Get music recommendations
- ✅ Recently played tracks

### Integration Features
- ✅ Automatic platform detection
- ✅ Unified controls with Spotify
- ✅ Smart service selection
- ✅ Error handling and reconnection

## Platform Support

### Optimal Support
- **iOS Safari**: Full native integration
- **macOS Safari**: Complete functionality
- **iOS Chrome/Firefox**: Good support with some limitations

### Limited Support
- **Android**: Basic functionality (limited by Apple Music availability)
- **Windows**: Web player only (requires iCloud for Windows)
- **Linux**: Not officially supported

## User Experience

### Authentication Flow
1. User clicks "Connect Music" button
2. Service selector appears with Apple Music option
3. User selects Apple Music
4. MusicKit authorization prompt appears
5. User signs in with Apple ID
6. App requests music access permission
7. Music player appears in calculator header

### Usage
- Music controls appear when Apple Music is connected
- Users can control playback without leaving the calculator
- Track information displays with album artwork
- Volume control available on supported devices
- Disconnect option to stop music integration

## Troubleshooting

### Common Issues

**"MusicKit not available"**
- Ensure you're using HTTPS
- Check that the MusicKit JS library loaded correctly
- Verify browser compatibility

**"Authorization failed"**
- Check that your developer token is valid and not expired
- Ensure the token was generated with the correct Team ID and Key ID
- Verify your MusicKit identifier is properly configured

**"No music playing"**
- User needs an active Apple Music subscription
- Music must be available in the user's country/region
- Some tracks may not be available for web playback

**"Playback not working"**
- Ensure user has granted necessary permissions
- Check that Apple Music app is not blocking web playback
- Verify the user's account is in good standing

### Debug Information

Enable debug logging in development:

```javascript
// Add to appleMusicManager.js
if (process.env.NODE_ENV === 'development') {
  console.log('Apple Music Debug Mode Enabled');
  window.appleMusicDebug = true;
}
```

### Testing Checklist

- [ ] Developer token is valid and not expired
- [ ] MusicKit identifier is properly configured
- [ ] HTTPS is enabled in production
- [ ] Authorization flow works correctly
- [ ] Playback controls function properly
- [ ] Error handling works as expected
- [ ] Platform detection works correctly

## Security Considerations

### Token Security
- Developer tokens should be stored securely
- Rotate tokens every 6 months
- Never expose tokens in client-side code for production
- Consider using a backend service for token generation

### User Privacy
- Only request necessary permissions
- Clearly explain what data is accessed
- Provide easy way to disconnect
- Follow Apple's privacy guidelines

### Data Handling
- No user data is stored on external servers
- All music data remains within Apple's ecosystem
- Authentication tokens are managed by MusicKit
- User preferences stored locally only

## Production Deployment

### Environment Variables
```bash
# .env.production
VITE_APPLE_MUSIC_TOKEN=your_developer_token_here
VITE_APPLE_TEAM_ID=your_team_id
VITE_APPLE_KEY_ID=your_key_id
```

### Token Refresh Strategy
For production apps, implement automatic token refresh:

```javascript
class TokenManager {
  constructor() {
    this.tokenExpiry = null;
    this.refreshThreshold = 86400 * 7; // 7 days before expiry
  }
  
  async getValidToken() {
    if (this.isTokenExpiringSoon()) {
      await this.refreshToken();
    }
    return this.developerToken;
  }
  
  isTokenExpiringSoon() {
    const now = Math.floor(Date.now() / 1000);
    return (this.tokenExpiry - now) < this.refreshThreshold;
  }
}
```

## Support & Resources

### Apple Documentation
- [MusicKit JS Documentation](https://developer.apple.com/documentation/musickitjs)
- [Apple Music API Reference](https://developer.apple.com/documentation/applemusicapi)
- [MusicKit Best Practices](https://developer.apple.com/documentation/musickitjs/musickit_best_practices)

### Community Resources
- [Apple Developer Forums](https://developer.apple.com/forums/tags/musickit)
- [MusicKit JS Samples](https://github.com/apple/musickit-js-samples)
- [Stack Overflow - MusicKit](https://stackoverflow.com/questions/tagged/musickit)

---

**Need help?** Contact our support team at support@numix-calculator.com or check our [main documentation](README.md) for additional resources. 