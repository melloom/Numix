/**
 * PWA Utility Functions for Numix Calculator
 * Handles installation, mobile features, and PWA-specific functionality
 */

class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isStandalone = false;
    this.isIOS = false;
    this.isAndroid = false;
    
    this.init();
  }
  
  /**
   * Initialize PWA manager
   */
  init() {
    this.detectPlatform();
    this.checkInstallStatus();
    this.setupEventListeners();
    this.setupViewportHandler();
    this.setupOrientationHandler();
  }
  
  /**
   * Detect platform and device type
   */
  detectPlatform() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Detect iOS
    this.isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    
    // Detect Android
    this.isAndroid = /android/i.test(userAgent);
    
    // Detect standalone mode
    this.isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');
  }
  
  /**
   * Check if app is already installed
   */
  checkInstallStatus() {
    this.isInstalled = this.isStandalone;
    
    // Check for PWA installation indicators
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        console.log('Service Worker is ready');
      });
    }
  }
  
  /**
   * Setup event listeners for PWA features
   */
  setupEventListeners() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('beforeinstallprompt fired');
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt();
    });
    
    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('App was installed');
      this.isInstalled = true;
      this.hideInstallPrompt();
      this.showInstallSuccessMessage();
    });
    
    // Listen for visibility change (app focus/blur)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handleAppFocus();
      } else {
        this.handleAppBlur();
      }
    });
    
    // Listen for network status changes
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }
  
  /**
   * Setup viewport height handler for mobile browsers
   */
  setupViewportHandler() {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    // Set initial viewport height
    setViewportHeight();
    
    // Update on resize with debouncing
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(setViewportHeight, 100);
    });
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(setViewportHeight, 500); // Delay for orientation transition
    });
  }
  
  /**
   * Setup orientation change handler
   */
  setupOrientationHandler() {
    const handleOrientation = () => {
      const orientation = screen.orientation?.angle || window.orientation || 0;
      const isLandscape = Math.abs(orientation) === 90;
      
      document.body.classList.toggle('landscape', isLandscape);
      document.body.classList.toggle('portrait', !isLandscape);
      
      // Trigger custom event for components to listen to
      window.dispatchEvent(new CustomEvent('orientationchange', {
        detail: { isLandscape, angle: orientation }
      }));
    };
    
    // Set initial orientation
    handleOrientation();
    
    // Listen for orientation changes
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientation);
    } else {
      window.addEventListener('orientationchange', handleOrientation);
    }
  }
  
  /**
   * Show installation prompt
   */
  showInstallPrompt() {
    if (this.isInstalled || !this.canInstall()) return;
    
    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') return;
    
    // Create install prompt UI
    const installBanner = this.createInstallBanner();
    document.body.appendChild(installBanner);
    
    // Auto-hide after 8 seconds (reduced from 10)
    setTimeout(() => {
      this.hideInstallPrompt();
    }, 8000);
  }
  
  /**
   * Create install banner element
   */
  createInstallBanner() {
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'pwa-install-banner';
    
    banner.innerHTML = `
      <div class="install-banner-content">
        <div class="install-banner-icon">📱</div>
        <div class="install-banner-text">
          <strong>Install Numix Calculator</strong>
          <p>Add to home screen for quick access</p>
        </div>
        <button class="install-banner-btn" id="install-btn">Install</button>
        <button class="install-banner-close" id="install-close" title="Dismiss">×</button>
      </div>
    `;
    
    // Add styles
    banner.style.cssText = `
      position: fixed;
      top: max(env(safe-area-inset-top), 1rem);
      left: 1rem;
      right: 1rem;
      background: linear-gradient(135deg, #232946 0%, #3730a3 100%);
      color: white;
      border-radius: 0.75rem;
      padding: 1rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 1000;
      animation: slideDown 0.3s ease-out;
    `;
    
    // Add event listeners
    banner.querySelector('#install-btn').addEventListener('click', () => {
      this.triggerInstall();
    });
    
    banner.querySelector('#install-close').addEventListener('click', () => {
      this.dismissInstallPrompt();
    });
    
    return banner;
  }
  
  /**
   * Dismiss install prompt permanently
   */
  dismissInstallPrompt() {
    // Remember user's choice to dismiss
    localStorage.setItem('pwa-install-dismissed', 'true');
    this.hideInstallPrompt();
  }
  
  /**
   * Hide installation prompt
   */
  hideInstallPrompt() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.style.animation = 'slideUp 0.3s ease-out';
      setTimeout(() => banner.remove(), 300);
    }
  }
  
  /**
   * Trigger PWA installation
   */
  async triggerInstall() {
    if (!this.deferredPrompt) return false;
    
    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log(`User ${outcome} the install prompt`);
      
      if (outcome === 'accepted') {
        this.hideInstallPrompt();
      }
      
      this.deferredPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error triggering install:', error);
      return false;
    }
  }
  
  /**
   * Check if app can be installed
   */
  canInstall() {
    return !this.isInstalled && 
           (this.deferredPrompt || this.isIOS) && 
           !this.isStandalone;
  }
  
  /**
   * Show iOS installation instructions
   */
  showIOSInstallInstructions() {
    if (!this.isIOS || this.isStandalone) return;
    
    const modal = document.createElement('div');
    modal.id = 'ios-install-modal';
    modal.innerHTML = `
      <div class="ios-install-overlay">
        <div class="ios-install-content">
          <h3>Install Numix Calculator</h3>
          <p>To install this app on your iPhone:</p>
          <ol>
            <li>Tap the Share button <span class="share-icon">⬆️</span></li>
            <li>Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add" to confirm</li>
          </ol>
          <button class="ios-install-close">Got it!</button>
        </div>
      </div>
    `;
    
    modal.querySelector('.ios-install-close').addEventListener('click', () => {
      modal.remove();
    });
    
    document.body.appendChild(modal);
  }
  
  /**
   * Show installation success message
   */
  showInstallSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'install-success-message';
    message.innerHTML = '✅ App installed successfully!';
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #10b981;
      color: white;
      padding: 1rem 2rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 1001;
      animation: fadeInOut 3s ease-out;
    `;
    
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);
  }
  
  /**
   * Handle app focus (user returns to app)
   */
  handleAppFocus() {
    console.log('App focused');
    // Update any time-sensitive data
    this.syncOfflineData();
  }
  
  /**
   * Handle app blur (user leaves app)
   */
  handleAppBlur() {
    console.log('App blurred');
    // Save any pending data
    this.saveAppState();
  }
  
  /**
   * Handle online status
   */
  handleOnline() {
    console.log('App is online');
    document.body.classList.add('online');
    document.body.classList.remove('offline');
    
    // Show online indicator
    this.showNetworkStatus('🟢 Back online', '#10b981');
    
    // Sync offline data
    this.syncOfflineData();
  }
  
  /**
   * Handle offline status
   */
  handleOffline() {
    console.log('App is offline');
    document.body.classList.add('offline');
    document.body.classList.remove('online');
    
    // Show offline indicator
    this.showNetworkStatus('🔴 Working offline', '#f59e0b');
  }
  
  /**
   * Show network status message
   */
  showNetworkStatus(message, color) {
    const statusEl = document.createElement('div');
    statusEl.className = 'network-status';
    statusEl.textContent = message;
    statusEl.style.cssText = `
      position: fixed;
      top: max(env(safe-area-inset-top), 0.5rem);
      left: 50%;
      transform: translateX(-50%);
      background: ${color};
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 1rem;
      font-size: 0.875rem;
      z-index: 1002;
      animation: slideDown 0.3s ease-out;
    `;
    
    document.body.appendChild(statusEl);
    setTimeout(() => {
      statusEl.style.animation = 'slideUp 0.3s ease-out';
      setTimeout(() => statusEl.remove(), 300);
    }, 2000);
  }
  
  /**
   * Sync offline data when online
   */
  async syncOfflineData() {
    if (navigator.onLine && 'localStorageManager' in window) {
      try {
        const offlineCalculations = window.localStorageManager.getOfflineCalculations();
        if (offlineCalculations.length > 0) {
          console.log(`Syncing ${offlineCalculations.length} offline calculations`);
          // Here you would typically send data to your backend
          // For now, just mark as synced
          const ids = offlineCalculations.map(calc => calc.id);
          window.localStorageManager.markCalculationsSynced(ids);
        }
      } catch (error) {
        console.error('Error syncing offline data:', error);
      }
    }
  }
  
  /**
   * Save app state when app is backgrounded
   */
  saveAppState() {
    try {
      // Save current calculator state
      const appState = {
        timestamp: Date.now(),
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
      
      localStorage.setItem('numix-app-state', JSON.stringify(appState));
    } catch (error) {
      console.error('Error saving app state:', error);
    }
  }
  
  /**
   * Add haptic feedback for supported devices
   */
  hapticFeedback(type = 'light') {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
        success: [10, 50, 10],
        error: [100, 50, 100]
      };
      
      navigator.vibrate(patterns[type] || patterns.light);
    }
  }
  
  /**
   * Request persistent storage
   */
  async requestPersistentStorage() {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const persistent = await navigator.storage.persist();
        console.log(`Persistent storage: ${persistent}`);
        return persistent;
      } catch (error) {
        console.error('Error requesting persistent storage:', error);
        return false;
      }
    }
    return false;
  }
  
  /**
   * Get app info for debugging
   */
  getAppInfo() {
    return {
      isInstalled: this.isInstalled,
      isStandalone: this.isStandalone,
      isIOS: this.isIOS,
      isAndroid: this.isAndroid,
      canInstall: this.canInstall(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      orientation: screen.orientation?.angle || window.orientation,
      online: navigator.onLine
    };
  }
}

// Create singleton instance
const pwaManager = new PWAManager();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes slideUp {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(-100%); opacity: 0; }
  }
  
  @keyframes fadeInOut {
    0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
    10%, 90% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  
  .install-banner-content {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .install-banner-icon {
    font-size: 2rem;
  }
  
  .install-banner-text p {
    margin: 0;
    opacity: 0.9;
    font-size: 0.875rem;
  }
  
  .install-banner-btn {
    background: white;
    color: #232946;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: bold;
    cursor: pointer;
    margin-left: auto;
  }
  
  .install-banner-close {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem;
  }
  
  .ios-install-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .ios-install-content {
    background: white;
    padding: 2rem;
    border-radius: 1rem;
    max-width: 300px;
    margin: 1rem;
  }
  
  .ios-install-content h3 {
    margin-top: 0;
  }
  
  .ios-install-content ol {
    text-align: left;
  }
  
  .share-icon {
    display: inline-block;
    background: #007AFF;
    color: white;
    padding: 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
  }
  
  .ios-install-close {
    background: #007AFF;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    width: 100%;
    margin-top: 1rem;
  }
`;

document.head.appendChild(style);

export default pwaManager; 