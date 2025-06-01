# Spotify Integration Setup

## Quick Setup for Testing

For testing purposes, you can use a demo client ID, but for production you'll need to register your own Spotify app.

## Production Setup

1. **Create a Spotify App**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Log in with your Spotify account
   - Click "Create an App"
   - Fill in the app name (e.g., "Numix Calculator")
   - Add description and agree to terms

2. **Configure App Settings**
   - Copy your `Client ID` from the app dashboard
   - Add your domain to "Redirect URIs":
     - For local development: `http://localhost:3000`
     - For production: `https://yourdomain.com`

3. **Update the Calculator**
   - Open `src/utils/spotifyManager.js`
   - Replace `YOUR_SPOTIFY_CLIENT_ID` with your actual Client ID:
   ```javascript
   this.clientId = 'your_actual_client_id_here';
   ```

4. **Features Included**
   - ✅ Connect/disconnect Spotify account
   - ✅ Play/pause current track
   - ✅ Skip to next/previous track
   - ✅ Volume control
   - ✅ Display current track info with album art
   - ✅ Responsive design for mobile
   - ✅ Error handling and reconnection

## Usage

1. Click the "Connect" button in the calculator header
2. Authorize the app in the Spotify popup
3. Start playing music from any Spotify app (phone, desktop, etc.)
4. Use the controls in the calculator to manage playback
5. The player automatically appears when connected and hides when disconnected

## Notes

- Requires Spotify Premium for full playback control
- Music must be playing from another Spotify app initially
- The calculator acts as a remote control for your Spotify playback
- Works on desktop and mobile browsers

## Troubleshooting

- **Connection Issues**: Make sure your redirect URI is correctly configured
- **Playback Issues**: Ensure you have Spotify Premium and music is playing from another device
- **Authorization Errors**: Check that your Client ID is correct and the app is not in development mode restrictions 