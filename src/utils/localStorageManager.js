/**
 * Local Storage Manager for Numix Calculator PWA
 * Handles data persistence, migration, and offline support
 */

class LocalStorageManager {
  constructor() {
    this.keys = {
      HISTORY: 'numix-history',
      SETTINGS: 'numix-settings', 
      USER_PREFERENCES: 'numix-preferences',
      CACHE_VERSION: 'numix-cache-version',
      OFFLINE_CALCULATIONS: 'numix-offline-calculations'
    };
    
    this.currentVersion = '1.2.0';
    this.maxHistoryEntries = 100;
    this.maxOfflineCalculations = 50;
    this.historyRetentionDays = 30;
    
    // Initialize storage with migration if needed
    this.init();
  }
  
  /**
   * Initialize storage and handle data migration
   */
  init() {
    try {
      this.migrateDataIfNeeded();
      this.cleanupOldData();
      this.setupPeriodicCleanup();
    } catch (error) {
      console.error('LocalStorageManager initialization failed:', error);
    }
  }
  
  /**
   * Check if localStorage is available
   */
  isAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Get data from localStorage with error handling
   */
  getData(key, defaultValue = null) {
    if (!this.isAvailable()) return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  }
  
  /**
   * Set data to localStorage with error handling
   */
  setData(key, value) {
    if (!this.isAvailable()) return false;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
      // If quota exceeded, try to free up space
      if (error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded();
      }
      return false;
    }
  }
  
  /**
   * Remove data from localStorage
   */
  removeData(key) {
    if (!this.isAvailable()) return false;
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      return false;
    }
  }
  
  /**
   * Get calculation history with filtering and sorting
   */
  getHistory(filterOptions = {}) {
    const history = this.getData(this.keys.HISTORY, []);
    
    if (!Array.isArray(history)) return [];
    
    let filteredHistory = history;
    
    // Filter by calculator type
    if (filterOptions.calculatorType) {
      filteredHistory = filteredHistory.filter(item => 
        item.calculator === filterOptions.calculatorType
      );
    }
    
    // Filter by date range
    if (filterOptions.startDate || filterOptions.endDate) {
      filteredHistory = filteredHistory.filter(item => {
        const itemDate = new Date(item.timestamp).getTime();
        const start = filterOptions.startDate ? new Date(filterOptions.startDate).getTime() : 0;
        const end = filterOptions.endDate ? new Date(filterOptions.endDate).getTime() : Date.now();
        return itemDate >= start && itemDate <= end;
      });
    }
    
    // Sort by timestamp (newest first)
    filteredHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return filteredHistory;
  }
  
  /**
   * Add calculation to history with automatic cleanup
   */
  addToHistory(expression, result, calculatorType = 'Standard', metadata = {}) {
    if (!expression || result === 'Error') return false;
    
    const historyEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      expression,
      result,
      timestamp: new Date().toISOString(),
      calculator: calculatorType,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent.substring(0, 50), // For debugging
        viewportWidth: window.innerWidth,
        isOnline: navigator.onLine
      },
      time: Date.now() // For easier filtering
    };
    
    const currentHistory = this.getHistory();
    const newHistory = [historyEntry, ...currentHistory];
    
    // Limit history size
    const trimmedHistory = newHistory.slice(0, this.maxHistoryEntries);
    
    return this.setData(this.keys.HISTORY, trimmedHistory);
  }
  
  /**
   * Clear all history
   */
  clearHistory() {
    return this.setData(this.keys.HISTORY, []);
  }
  
  /**
   * Get user settings
   */
  getSettings() {
    return this.getData(this.keys.SETTINGS, {
      theme: 'light',
      soundEnabled: true,
      hapticFeedback: true,
      autoSave: true,
      scientificNotation: 'auto',
      decimalPlaces: 'auto',
      historyEnabled: true
    });
  }
  
  /**
   * Update user settings
   */
  updateSettings(newSettings) {
    const currentSettings = this.getSettings();
    const mergedSettings = { ...currentSettings, ...newSettings };
    return this.setData(this.keys.SETTINGS, mergedSettings);
  }
  
  /**
   * Get user preferences
   */
  getPreferences() {
    return this.getData(this.keys.USER_PREFERENCES, {
      defaultCalculatorMode: 'Standard',
      favoriteCalculators: [],
      recentCalculators: [],
      customTheme: null,
      shortcuts: {},
      lastUsedConverter: null
    });
  }
  
  /**
   * Update user preferences
   */
  updatePreferences(newPrefs) {
    const currentPrefs = this.getPreferences();
    const mergedPrefs = { ...currentPrefs, ...newPrefs };
    return this.setData(this.keys.USER_PREFERENCES, mergedPrefs);
  }
  
  /**
   * Store offline calculations for later sync
   */
  addOfflineCalculation(calculation) {
    const offlineCalcs = this.getData(this.keys.OFFLINE_CALCULATIONS, []);
    offlineCalcs.push({
      ...calculation,
      offlineTimestamp: Date.now(),
      synced: false
    });
    
    // Limit offline calculations
    const trimmedCalcs = offlineCalcs.slice(-this.maxOfflineCalculations);
    return this.setData(this.keys.OFFLINE_CALCULATIONS, trimmedCalcs);
  }
  
  /**
   * Get pending offline calculations
   */
  getOfflineCalculations() {
    return this.getData(this.keys.OFFLINE_CALCULATIONS, [])
      .filter(calc => !calc.synced);
  }
  
  /**
   * Mark offline calculations as synced
   */
  markCalculationsSynced(calculationIds) {
    const offlineCalcs = this.getData(this.keys.OFFLINE_CALCULATIONS, []);
    const updatedCalcs = offlineCalcs.map(calc => 
      calculationIds.includes(calc.id) ? { ...calc, synced: true } : calc
    );
    return this.setData(this.keys.OFFLINE_CALCULATIONS, updatedCalcs);
  }
  
  /**
   * Clean up old data based on retention policy
   */
  cleanupOldData() {
    try {
      // Clean up old history
      const cutoffTime = Date.now() - (this.historyRetentionDays * 24 * 60 * 60 * 1000);
      const currentHistory = this.getHistory();
      const filteredHistory = currentHistory.filter(item => item.time > cutoffTime);
      
      if (filteredHistory.length !== currentHistory.length) {
        this.setData(this.keys.HISTORY, filteredHistory);
        console.log(`Cleaned up ${currentHistory.length - filteredHistory.length} old history entries`);
      }
      
      // Clean up old offline calculations
      const offlineCalcs = this.getData(this.keys.OFFLINE_CALCULATIONS, []);
      const recentOfflineCalcs = offlineCalcs.filter(calc => 
        (Date.now() - calc.offlineTimestamp) < (7 * 24 * 60 * 60 * 1000) // 7 days
      );
      
      if (recentOfflineCalcs.length !== offlineCalcs.length) {
        this.setData(this.keys.OFFLINE_CALCULATIONS, recentOfflineCalcs);
      }
      
    } catch (error) {
      console.error('Error during data cleanup:', error);
    }
  }
  
  /**
   * Handle storage quota exceeded
   */
  handleQuotaExceeded() {
    console.warn('Storage quota exceeded, cleaning up old data...');
    
    try {
      // Reduce history to 50% of max
      const currentHistory = this.getHistory();
      const reducedHistory = currentHistory.slice(0, Math.floor(this.maxHistoryEntries / 2));
      this.setData(this.keys.HISTORY, reducedHistory);
      
      // Clear old offline calculations
      this.setData(this.keys.OFFLINE_CALCULATIONS, []);
      
      console.log('Storage cleanup completed');
    } catch (error) {
      console.error('Error during quota cleanup:', error);
    }
  }
  
  /**
   * Migrate data from older versions
   */
  migrateDataIfNeeded() {
    const currentVersion = this.getData(this.keys.CACHE_VERSION, '1.0.0');
    
    if (currentVersion !== this.currentVersion) {
      console.log(`Migrating data from version ${currentVersion} to ${this.currentVersion}`);
      
      // Migration logic for different versions
      if (currentVersion === '1.0.0') {
        this.migrateFromV1();
      }
      
      // Update version
      this.setData(this.keys.CACHE_VERSION, this.currentVersion);
    }
  }
  
  /**
   * Migrate from version 1.0.0
   */
  migrateFromV1() {
    try {
      // Check for old history format
      const oldHistory = this.getData('calculatorHistory', []);
      if (oldHistory.length > 0) {
        // Convert old format to new format
        const convertedHistory = oldHistory.map(item => ({
          ...item,
          time: item.time || new Date(item.timestamp).getTime(),
          calculator: item.calculator || 'Standard'
        }));
        
        this.setData(this.keys.HISTORY, convertedHistory);
        this.removeData('calculatorHistory');
        console.log('Migrated history from v1.0.0');
      }
    } catch (error) {
      console.error('Error migrating from v1.0.0:', error);
    }
  }
  
  /**
   * Setup periodic cleanup
   */
  setupPeriodicCleanup() {
    // Run cleanup once per day
    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000);
  }
  
  /**
   * Export all data for backup
   */
  exportData() {
    return {
      version: this.currentVersion,
      timestamp: new Date().toISOString(),
      history: this.getHistory(),
      settings: this.getSettings(),
      preferences: this.getPreferences(),
      offlineCalculations: this.getOfflineCalculations()
    };
  }
  
  /**
   * Import data from backup
   */
  importData(data) {
    try {
      if (data.history) this.setData(this.keys.HISTORY, data.history);
      if (data.settings) this.setData(this.keys.SETTINGS, data.settings);
      if (data.preferences) this.setData(this.keys.USER_PREFERENCES, data.preferences);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
  
  /**
   * Get storage usage statistics
   */
  getStorageStats() {
    if (!this.isAvailable()) return null;
    
    const stats = {};
    
    Object.values(this.keys).forEach(key => {
      try {
        const data = localStorage.getItem(key);
        stats[key] = {
          size: data ? new Blob([data]).size : 0,
          items: data ? JSON.parse(data).length || 1 : 0
        };
      } catch (e) {
        stats[key] = { size: 0, items: 0, error: e.message };
      }
    });
    
    return stats;
  }
}

// Create singleton instance
const localStorageManager = new LocalStorageManager();

export default localStorageManager; 