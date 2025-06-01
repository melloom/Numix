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
    this.installPromptDismissed = false;
    
    this.init();
  }
  
  /**
   * Initialize PWA manager
   */
  init() {
    this.detectPlatform();
    this.checkInstallStatus();
    this.loadPromptPreferences();
    this.setupEventListeners();
    this.setupViewportHandler();
    this.setupOrientationHandler();
  }
  
  /**
   * Load prompt preferences from localStorage
   */
  loadPromptPreferences() {
    try {
      const preferences = localStorage.getItem('pwa-install-preferences');
      if (preferences) {
        const parsed = JSON.parse(preferences);
        // Don't show prompt if user dismissed it recently (within 7 days)
        const dismissTime = parsed.dismissedAt;
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        this.installPromptDismissed = dismissTime > weekAgo;
      }
    } catch (error) {
      console.error('Error loading prompt preferences:', error);
    }
  }
  
  /**
   * Save prompt preferences
   */
  savePromptPreferences(action) {
    try {
      const preferences = {
        action,
        dismissedAt: Date.now(),
        userAgent: navigator.userAgent.substring(0, 50)
      };
      localStorage.setItem('pwa-install-preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving prompt preferences:', error);
    }
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
      
      // Only show prompt if not dismissed recently and not already installed
      if (!this.installPromptDismissed && !this.isInstalled) {
        // Delay showing prompt to avoid immediate interruption
        setTimeout(() => {
          this.showInstallPrompt();
        }, 3000);
      }
    });
    
    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('App was installed');
      this.isInstalled = true;
      this.hideInstallPrompt();
      this.showInstallSuccessMessage();
      this.savePromptPreferences('installed');
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
    if (this.isInstalled || !this.canInstall() || this.installPromptDismissed) return;
    
    // Don't show if already showing
    if (document.getElementById('pwa-install-banner')) return;
    
    // Create install prompt UI
    const installBanner = this.createInstallBanner();
    document.body.appendChild(installBanner);
    
    // Auto-hide after 8 seconds if not interacted with
    const autoHideTimeout = setTimeout(() => {
      if (document.getElementById('pwa-install-banner')) {
        this.dismissInstallPrompt('auto-timeout');
      }
    }, 8000);
    
    // Store timeout reference for cleanup
    installBanner.dataset.autoHideTimeout = autoHideTimeout;
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
        <div class="install-banner-left">
          <div class="install-banner-icon">📱</div>
          <div class="install-banner-text">
            <strong>Add to Home Screen</strong>
            <p>Install Numix for quick access</p>
          </div>
        </div>
        <div class="install-banner-actions">
          <button class="install-banner-btn" id="install-btn">Install</button>
          <button class="install-banner-close" id="install-close" title="Close">×</button>
        </div>
      </div>
    `;
    
    // Add styles
    banner.style.cssText = `
      position: fixed;
      top: max(env(safe-area-inset-top), 1rem);
      left: 1rem;
      right: 1rem;
      background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);
      color: white;
      border-radius: 0.75rem;
      padding: 0.75rem 1rem;
      box-shadow: 0 4px 20px rgba(29, 185, 84, 0.3), 0 2px 8px rgba(0,0,0,0.1);
      z-index: 1000;
      animation: slideDownBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      max-width: 400px;
      margin: 0 auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    
    // Add event listeners
    const installBtn = banner.querySelector('#install-btn');
    const closeBtn = banner.querySelector('#install-close');
    
    installBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.triggerInstall();
    });
    
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dismissInstallPrompt('user-close');
    });
    
    // Clear auto-hide timeout on user interaction
    banner.addEventListener('mouseenter', () => {
      const timeoutId = parseInt(banner.dataset.autoHideTimeout);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    });
    
    return banner;
  }
  
  /**
   * Dismiss installation prompt
   */
  dismissInstallPrompt(reason = 'user-dismiss') {
    this.installPromptDismissed = true;
    this.savePromptPreferences(reason);
    this.hideInstallPrompt();
  }
  
  /**
   * Hide installation prompt
   */
  hideInstallPrompt() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      // Clear any auto-hide timeout
      const timeoutId = parseInt(banner.dataset.autoHideTimeout);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      banner.style.animation = 'slideUpFade 0.3s ease-out forwards';
      setTimeout(() => {
        if (banner.parentNode) {
          banner.remove();
        }
      }, 300);
    }
  }
  
  /**
   * Trigger PWA installation
   */
  async triggerInstall() {
    if (!this.deferredPrompt) {
      // Show iOS instructions if on iOS
      if (this.isIOS) {
        this.showIOSInstallInstructions();
      }
      return false;
    }
    
    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log(`User ${outcome} the install prompt`);
      
      if (outcome === 'accepted') {
        this.hideInstallPrompt();
        this.savePromptPreferences('accepted');
      } else {
        this.savePromptPreferences('declined');
        this.installPromptDismissed = true;
      }
      
      this.deferredPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error triggering install:', error);
      this.savePromptPreferences('error');
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
          <button class="ios-install-close-x" onclick="this.closest('#ios-install-modal').remove()">×</button>
          <h3>📱 Install Numix Calculator</h3>
          <p>To install this app on your iPhone:</p>
          <ol>
            <li>Tap the Share button <span class="share-icon">⬆️</span> in Safari</li>
            <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
            <li>Tap <strong>"Add"</strong> to confirm</li>
          </ol>
          <button class="ios-install-close" onclick="this.closest('#ios-install-modal').remove()">Got it!</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Save that user was shown iOS instructions
    this.savePromptPreferences('ios-instructions-shown');
  }
  
  /**
   * Show installation success message
   */
  showInstallSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'install-success-message';
    message.innerHTML = `
      <div class="success-content">
        <span class="success-icon">✅</span>
        <span class="success-text">App installed successfully!</span>
      </div>
    `;
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.75rem;
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
      z-index: 1001;
      animation: successBounce 3s ease-out forwards;
      font-weight: 500;
      backdrop-filter: blur(10px);
    `;
    
    document.body.appendChild(message);
    setTimeout(() => {
      if (message.parentNode) {
        message.remove();
      }
    }, 3000);
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
      font-weight: 500;
    `;
    
    document.body.appendChild(statusEl);
    setTimeout(() => {
      statusEl.style.animation = 'slideUp 0.3s ease-out';
      setTimeout(() => {
        if (statusEl.parentNode) {
          statusEl.remove();
        }
      }, 300);
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
   * Reset install prompt preferences (for testing)
   */
  resetInstallPromptPreferences() {
    localStorage.removeItem('pwa-install-preferences');
    this.installPromptDismissed = false;
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
      installPromptDismissed: this.installPromptDismissed,
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
  @keyframes slideDownBounce {
    0% { 
      transform: translateY(-100px); 
      opacity: 0; 
    }
    70% { 
      transform: translateY(10px); 
      opacity: 1; 
    }
    100% { 
      transform: translateY(0); 
      opacity: 1; 
    }
  }
  
  @keyframes slideUpFade {
    from { 
      transform: translateY(0); 
      opacity: 1; 
    }
    to { 
      transform: translateY(-100px); 
      opacity: 0; 
    }
  }
  
  @keyframes slideDown {
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes slideUp {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(-100%); opacity: 0; }
  }
  
  @keyframes successBounce {
    0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    10%, 90% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
    15%, 85% { transform: translate(-50%, -50%) scale(1); }
  }
  
  .install-banner-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  
  .install-banner-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }
  
  .install-banner-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }
  
  .install-banner-text {
    flex: 1;
    min-width: 0;
  }
  
  .install-banner-text strong {
    display: block;
    font-size: 0.95rem;
    margin-bottom: 0.125rem;
  }
  
  .install-banner-text p {
    margin: 0;
    opacity: 0.9;
    font-size: 0.8rem;
    line-height: 1.2;
  }
  
  .install-banner-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  
  .install-banner-btn {
    background: rgba(255, 255, 255, 0.95);
    color: #1DB954;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  
  .install-banner-btn:hover {
    background: white;
    transform: scale(1.05);
  }
  
  .install-banner-close {
    background: none;
    border: none;
    color: white;
    font-size: 1.25rem;
    font-weight: bold;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    line-height: 1;
  }
  
  .install-banner-close:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.1);
  }
  
  .ios-install-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease-out;
    backdrop-filter: blur(4px);
  }
  
  .ios-install-content {
    background: white;
    padding: 2rem;
    border-radius: 1rem;
    max-width: 320px;
    margin: 1rem;
    position: relative;
    animation: slideDownBounce 0.4s ease-out;
  }
  
  .ios-install-close-x {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .ios-install-close-x:hover {
    background: #f0f0f0;
  }
  
  .ios-install-content h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #333;
  }
  
  .ios-install-content ol {
    text-align: left;
    padding-left: 1.5rem;
    line-height: 1.6;
  }
  
  .share-icon {
    display: inline-block;
    background: #007AFF;
    color: white;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    margin: 0 0.25rem;
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
    font-weight: 500;
  }
  
  .success-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .success-icon {
    font-size: 1.25rem;
  }
  
  /* Mobile responsiveness */
  @media (max-width: 480px) {
    .install-banner-content {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }
    
    .install-banner-actions {
      justify-content: space-between;
    }
    
    .install-banner-btn {
      flex: 1;
      text-align: center;
    }
  }
`;

document.head.appendChild(style);

export default pwaManager; 