/**
 * Spotify Integration Manager for Numix Calculator
 * Handles music playback while using the calculator
 */

class SpotifyManager {
  constructor() {
    this.isConnected = false;
    this.accessToken = null;
    this.refreshToken = null;
    this.deviceId = null;
    this.player = null;
    this.currentTrack = null;
    this.isPlaying = false;
    this.volume = 0.5;
    
    // Spotify Web API endpoints
    this.clientId = '9d8622eecf41465f8bb4dbc0fdae566d'; // Your Spotify Client ID
    this.redirectUri = window.location.origin;
    this.scopes = [
      'streaming',
      'user-read-email',
      'user-read-private',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing'
    ].join(' ');
    
    this.init();
  }
  
  /**
   * Initialize Spotify manager
   */
  init() {
    // Check for stored tokens
    this.loadTokensFromStorage();
    
    // Load Spotify Web Playback SDK
    if (!window.Spotify) {
      this.loadSpotifySDK();
    } else {
      this.initializePlayer();
    }
    
    // Check URL for authorization code
    this.handleAuthCallback();
  }
  
  /**
   * Load Spotify Web Playback SDK
   */
  loadSpotifySDK() {
    if (document.getElementById('spotify-sdk')) return;
    
    const script = document.createElement('script');
    script.id = 'spotify-sdk';
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    
    document.head.appendChild(script);
    
    window.onSpotifyWebPlaybackSDKReady = () => {
      this.initializePlayer();
    };
  }
  
  /**
   * Initialize Spotify Web Player
   */
  initializePlayer() {
    if (!this.accessToken || !window.Spotify) return;
    
    this.player = new window.Spotify.Player({
      name: 'Numix Calculator',
      getOAuthToken: cb => { cb(this.accessToken); },
      volume: this.volume
    });
    
    // Error handling
    this.player.addListener('initialization_error', ({ message }) => {
      console.error('Spotify initialization error:', message);
    });
    
    this.player.addListener('authentication_error', ({ message }) => {
      console.error('Spotify authentication error:', message);
      this.handleAuthError();
    });
    
    this.player.addListener('account_error', ({ message }) => {
      console.error('Spotify account error:', message);
    });
    
    this.player.addListener('playback_error', ({ message }) => {
      console.error('Spotify playback error:', message);
    });
    
    // Playback status updates
    this.player.addListener('player_state_changed', (state) => {
      if (!state) return;
      
      this.currentTrack = state.track_window.current_track;
      this.isPlaying = !state.paused;
      this.updatePlayerUI();
    });
    
    // Ready
    this.player.addListener('ready', ({ device_id }) => {
      console.log('Spotify Player ready with Device ID', device_id);
      this.deviceId = device_id;
      this.isConnected = true;
      this.updateConnectionStatus();
    });
    
    // Not Ready
    this.player.addListener('not_ready', ({ device_id }) => {
      console.log('Spotify Player offline', device_id);
      this.isConnected = false;
      this.updateConnectionStatus();
    });
    
    // Connect to the player
    this.player.connect();
  }
  
  /**
   * Start Spotify authentication flow
   */
  authenticate() {
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    
    // Generate state for security
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('spotify_auth_state', state);
    
    authUrl.searchParams.append('client_id', this.clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', this.redirectUri);
    authUrl.searchParams.append('scope', this.scopes);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('show_dialog', 'true');
    
    // Open in popup for better UX
    const popup = window.open(
      authUrl.toString(),
      'spotify-auth',
      'width=400,height=500,scrollbars=yes,resizable=yes'
    );
    
    // Listen for popup messages
    const messageListener = (event) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'SPOTIFY_AUTH_SUCCESS') {
        popup.close();
        this.handleAuthSuccess(event.data.code, event.data.state);
        window.removeEventListener('message', messageListener);
      } else if (event.data.type === 'SPOTIFY_AUTH_ERROR') {
        popup.close();
        this.handleAuthError(event.data.error);
        window.removeEventListener('message', messageListener);
      }
    };
    
    window.addEventListener('message', messageListener);
  }
  
  /**
   * Handle authentication callback
   */
  handleAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    
    if (error) {
      this.handleAuthError(error);
      return;
    }
    
    if (code && state) {
      // Verify state
      const storedState = localStorage.getItem('spotify_auth_state');
      if (state === storedState) {
        this.exchangeCodeForTokens(code);
      } else {
        console.error('State mismatch in Spotify auth');
      }
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
  
  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code) {
    try {
      // Note: In production, this should be done server-side
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          // client_secret: 'YOUR_CLIENT_SECRET' // Should be server-side only
        })
      });
      
      const data = await response.json();
      
      if (data.access_token) {
        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        this.saveTokensToStorage();
        this.initializePlayer();
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      this.handleAuthError('token_exchange_failed');
    }
  }
  
  /**
   * Handle authentication success
   */
  handleAuthSuccess(code, state) {
    const storedState = localStorage.getItem('spotify_auth_state');
    if (state === storedState) {
      this.exchangeCodeForTokens(code);
    }
  }
  
  /**
   * Handle authentication error
   */
  handleAuthError(error) {
    console.error('Spotify auth error:', error);
    this.disconnect();
    this.showErrorMessage('Failed to connect to Spotify. Please try again.');
  }
  
  /**
   * Save tokens to localStorage
   */
  saveTokensToStorage() {
    try {
      const tokenData = {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        timestamp: Date.now()
      };
      localStorage.setItem('spotify_tokens', JSON.stringify(tokenData));
    } catch (error) {
      console.error('Error saving Spotify tokens:', error);
    }
  }
  
  /**
   * Load tokens from localStorage
   */
  loadTokensFromStorage() {
    try {
      const tokenData = localStorage.getItem('spotify_tokens');
      if (tokenData) {
        const parsed = JSON.parse(tokenData);
        
        // Check if tokens are still valid (1 hour expiry)
        const hourAgo = Date.now() - (60 * 60 * 1000);
        if (parsed.timestamp > hourAgo) {
          this.accessToken = parsed.accessToken;
          this.refreshToken = parsed.refreshToken;
        } else {
          // Try to refresh tokens
          this.refreshAccessToken();
        }
      }
    } catch (error) {
      console.error('Error loading Spotify tokens:', error);
    }
  }
  
  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) return;
    
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId
        })
      });
      
      const data = await response.json();
      
      if (data.access_token) {
        this.accessToken = data.access_token;
        if (data.refresh_token) {
          this.refreshToken = data.refresh_token;
        }
        this.saveTokensToStorage();
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.disconnect();
    }
  }
  
  /**
   * Play/pause current track
   */
  async togglePlayback() {
    if (!this.player) return;
    
    try {
      await this.player.togglePlay();
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  }
  
  /**
   * Skip to next track
   */
  async nextTrack() {
    if (!this.player) return;
    
    try {
      await this.player.nextTrack();
    } catch (error) {
      console.error('Error skipping track:', error);
    }
  }
  
  /**
   * Skip to previous track
   */
  async previousTrack() {
    if (!this.player) return;
    
    try {
      await this.player.previousTrack();
    } catch (error) {
      console.error('Error going to previous track:', error);
    }
  }
  
  /**
   * Set volume
   */
  async setVolume(volume) {
    if (!this.player || volume < 0 || volume > 1) return;
    
    try {
      this.volume = volume;
      await this.player.setVolume(volume);
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }
  
  /**
   * Disconnect from Spotify
   */
  disconnect() {
    if (this.player) {
      this.player.disconnect();
      this.player = null;
    }
    
    this.isConnected = false;
    this.accessToken = null;
    this.refreshToken = null;
    this.currentTrack = null;
    this.isPlaying = false;
    
    localStorage.removeItem('spotify_tokens');
    localStorage.removeItem('spotify_auth_state');
    
    this.updateConnectionStatus();
  }
  
  /**
   * Update connection status in UI
   */
  updateConnectionStatus() {
    const event = new CustomEvent('spotifyConnectionChanged', {
      detail: {
        isConnected: this.isConnected,
        currentTrack: this.currentTrack,
        isPlaying: this.isPlaying
      }
    });
    window.dispatchEvent(event);
  }
  
  /**
   * Update player UI
   */
  updatePlayerUI() {
    const event = new CustomEvent('spotifyPlayerUpdate', {
      detail: {
        currentTrack: this.currentTrack,
        isPlaying: this.isPlaying,
        volume: this.volume
      }
    });
    window.dispatchEvent(event);
  }
  
  /**
   * Show error message
   */
  showErrorMessage(message) {
    const event = new CustomEvent('spotifyError', {
      detail: { message }
    });
    window.dispatchEvent(event);
  }
  
  /**
   * Get current status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      currentTrack: this.currentTrack,
      isPlaying: this.isPlaying,
      volume: this.volume,
      deviceId: this.deviceId
    };
  }
}

// Create singleton instance
const spotifyManager = new SpotifyManager();

// Export for use in components
export default spotifyManager; 