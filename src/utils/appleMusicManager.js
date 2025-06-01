/**
 * Apple Music Integration Manager for Numix Calculator
 * Handles music playback using MusicKit JS
 */

class AppleMusicManager {
  constructor() {
    this.isConnected = false;
    this.musicKit = null;
    this.currentTrack = null;
    this.isPlaying = false;
    this.volume = 0.5;
    this.queue = null;
    
    // Apple Music configuration
    this.developerToken = 'YOUR_APPLE_MUSIC_DEVELOPER_TOKEN'; // You'll need to generate this
    this.appName = 'Numix Calculator';
    this.appBuild = '1.0.0';
    
    this.init();
  }
  
  /**
   * Initialize Apple Music manager
   */
  async init() {
    try {
      // Load MusicKit if not already loaded
      if (!window.MusicKit) {
        await this.loadMusicKit();
      }
      
      // Configure and initialize MusicKit
      await this.initializeMusicKit();
    } catch (error) {
      console.error('Apple Music initialization failed:', error);
    }
  }
  
  /**
   * Load MusicKit JS library
   */
  loadMusicKit() {
    return new Promise((resolve, reject) => {
      if (document.getElementById('musickit-js')) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.id = 'musickit-js';
      script.src = 'https://js-cdn.music.apple.com/musickit/v1/musickit.js';
      script.async = true;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load MusicKit JS'));
      
      document.head.appendChild(script);
    });
  }
  
  /**
   * Initialize MusicKit instance
   */
  async initializeMusicKit() {
    if (!window.MusicKit) {
      throw new Error('MusicKit not available');
    }
    
    try {
      await window.MusicKit.configure({
        developerToken: this.developerToken,
        app: {
          name: this.appName,
          build: this.appBuild
        },
        declarativeMarkup: true,
        features: {
          'disable-apple-music-analytics': false
        }
      });
      
      this.musicKit = window.MusicKit.getInstance();
      this.setupEventListeners();
      
      // Check if user is already authorized
      if (this.musicKit.isAuthorized) {
        this.isConnected = true;
        this.updateConnectionStatus();
      }
      
    } catch (error) {
      console.error('MusicKit configuration failed:', error);
      throw error;
    }
  }
  
  /**
   * Setup MusicKit event listeners
   */
  setupEventListeners() {
    if (!this.musicKit) return;
    
    // Authorization events
    this.musicKit.addEventListener('authorizationStatusDidChange', (event) => {
      const isAuthorized = event.authorizationStatus === window.MusicKit.AuthorizationStatus.authorized;
      this.isConnected = isAuthorized;
      
      if (isAuthorized) {
        console.log('Apple Music authorized');
      } else {
        console.log('Apple Music not authorized');
      }
      
      this.updateConnectionStatus();
    });
    
    // Playback events
    this.musicKit.addEventListener('playbackStateDidChange', () => {
      this.isPlaying = this.musicKit.player.playbackState === window.MusicKit.PlaybackStates.playing;
      this.updatePlayerUI();
    });
    
    this.musicKit.addEventListener('nowPlayingItemDidChange', (event) => {
      this.currentTrack = event.item;
      this.updatePlayerUI();
    });
    
    this.musicKit.addEventListener('playbackVolumeDidChange', (event) => {
      this.volume = event.volume;
      this.updatePlayerUI();
    });
    
    // Error handling
    this.musicKit.addEventListener('configured', () => {
      console.log('MusicKit configured successfully');
    });
    
    this.musicKit.addEventListener('loaded', () => {
      console.log('MusicKit loaded successfully');
    });
  }
  
  /**
   * Request authorization from user
   */
  async authenticate() {
    if (!this.musicKit) {
      this.showErrorMessage('Apple Music not available');
      return false;
    }
    
    try {
      const status = await this.musicKit.authorize();
      
      if (status === window.MusicKit.AuthorizationStatus.authorized) {
        this.isConnected = true;
        this.updateConnectionStatus();
        return true;
      } else {
        this.showErrorMessage('Apple Music authorization failed');
        return false;
      }
    } catch (error) {
      console.error('Apple Music authorization error:', error);
      this.showErrorMessage('Failed to connect to Apple Music');
      return false;
    }
  }
  
  /**
   * Play/pause current track
   */
  async togglePlayback() {
    if (!this.musicKit || !this.isConnected) return;
    
    try {
      if (this.isPlaying) {
        await this.musicKit.player.pause();
      } else {
        await this.musicKit.player.play();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      this.showErrorMessage('Playback control failed');
    }
  }
  
  /**
   * Skip to next track
   */
  async nextTrack() {
    if (!this.musicKit || !this.isConnected) return;
    
    try {
      await this.musicKit.player.skipToNextItem();
    } catch (error) {
      console.error('Error skipping to next track:', error);
      this.showErrorMessage('Skip failed');
    }
  }
  
  /**
   * Skip to previous track
   */
  async previousTrack() {
    if (!this.musicKit || !this.isConnected) return;
    
    try {
      await this.musicKit.player.skipToPreviousItem();
    } catch (error) {
      console.error('Error skipping to previous track:', error);
      this.showErrorMessage('Skip failed');
    }
  }
  
  /**
   * Set volume (0-1)
   */
  async setVolume(volume) {
    if (!this.musicKit || !this.isConnected || volume < 0 || volume > 1) return;
    
    try {
      this.musicKit.player.volume = volume;
      this.volume = volume;
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }
  
  /**
   * Search for music
   */
  async searchMusic(query, limit = 10) {
    if (!this.musicKit || !this.isConnected) return [];
    
    try {
      const results = await this.musicKit.api.search(query, {
        limit: limit,
        types: ['songs', 'albums', 'playlists']
      });
      
      return results;
    } catch (error) {
      console.error('Error searching music:', error);
      return [];
    }
  }
  
  /**
   * Play a specific song by ID
   */
  async playSong(songId) {
    if (!this.musicKit || !this.isConnected) return;
    
    try {
      await this.musicKit.setQueue({
        song: songId
      });
      await this.musicKit.player.play();
    } catch (error) {
      console.error('Error playing song:', error);
      this.showErrorMessage('Failed to play song');
    }
  }
  
  /**
   * Get user's playlists
   */
  async getUserPlaylists() {
    if (!this.musicKit || !this.isConnected) return [];
    
    try {
      const playlists = await this.musicKit.api.library.playlists();
      return playlists;
    } catch (error) {
      console.error('Error fetching playlists:', error);
      return [];
    }
  }
  
  /**
   * Disconnect from Apple Music
   */
  disconnect() {
    if (this.musicKit) {
      try {
        this.musicKit.unauthorize();
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }
    
    this.isConnected = false;
    this.currentTrack = null;
    this.isPlaying = false;
    this.queue = null;
    
    this.updateConnectionStatus();
  }
  
  /**
   * Update connection status in UI
   */
  updateConnectionStatus() {
    const event = new CustomEvent('appleMusicConnectionChanged', {
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
    const event = new CustomEvent('appleMusicPlayerUpdate', {
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
    const event = new CustomEvent('appleMusicError', {
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
      isAvailable: !!window.MusicKit
    };
  }
  
  /**
   * Check if Apple Music is available
   */
  static isSupported() {
    // Apple Music is primarily available on iOS/macOS and modern browsers
    const userAgent = navigator.userAgent;
    const isAppleDevice = /iPad|iPhone|iPod|Mac/.test(userAgent);
    const isModernBrowser = 'fetch' in window && 'Promise' in window;
    
    return isModernBrowser && (isAppleDevice || window.location.protocol === 'https:');
  }
  
  /**
   * Get recommendations
   */
  async getRecommendations() {
    if (!this.musicKit || !this.isConnected) return [];
    
    try {
      const recommendations = await this.musicKit.api.recommendations();
      return recommendations;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  }
}

// Create singleton instance
const appleMusicManager = new AppleMusicManager();

export default appleMusicManager; 