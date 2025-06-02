// localStorage utility for calculator app
const STORAGE_KEYS = {
  HISTORY: 'calculatorHistory',
  THEME: 'calculatorTheme',
  PWA_INSTALL_DISMISSED: 'pwa-install-dismissed',
  PWA_INSTALL_LAST_SHOWN: 'pwa-install-last-shown',
  CALCULATOR_SETTINGS: 'calculatorSettings'
}

// Generic localStorage helpers
const storage = {
  // Get item from localStorage with error handling
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error)
      return defaultValue
    }
  },

  // Set item in localStorage with error handling
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error)
      return false
    }
  },

  // Remove item from localStorage
  remove: (key) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error)
      return false
    }
  },

  // Clear all localStorage
  clear: () => {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('Error clearing localStorage:', error)
      return false
    }
  },

  // Check if localStorage is available
  isAvailable: () => {
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }
}

// History management
export const historyManager = {
  // Get all history entries
  getHistory: () => {
    return storage.get(STORAGE_KEYS.HISTORY, [])
  },

  // Add new calculation to history
  addToHistory: (calculation, result, calculatorType = 'standard') => {
    const history = historyManager.getHistory()
    const newEntry = {
      id: Date.now() + Math.random(), // Ensure unique ID
      calculation,
      result,
      calculatorType,
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleString()
    }
    
    // Add to beginning and limit to 100 entries
    const updatedHistory = [newEntry, ...history].slice(0, 100)
    storage.set(STORAGE_KEYS.HISTORY, updatedHistory)
    
    return newEntry
  },

  // Delete specific history entry
  deleteHistoryItem: (id) => {
    const history = historyManager.getHistory()
    const filteredHistory = history.filter(item => item.id !== id)
    storage.set(STORAGE_KEYS.HISTORY, filteredHistory)
    return filteredHistory
  },

  // Clear all history
  clearAllHistory: () => {
    storage.remove(STORAGE_KEYS.HISTORY)
    return []
  },

  // Delete multiple history entries
  deleteMultipleItems: (ids) => {
    const history = historyManager.getHistory()
    const filteredHistory = history.filter(item => !ids.includes(item.id))
    storage.set(STORAGE_KEYS.HISTORY, filteredHistory)
    return filteredHistory
  },

  // Get history by calculator type
  getHistoryByType: (calculatorType) => {
    const history = historyManager.getHistory()
    return history.filter(item => item.calculatorType === calculatorType)
  },

  // Search history
  searchHistory: (query) => {
    const history = historyManager.getHistory()
    const lowerQuery = query.toLowerCase()
    return history.filter(item => 
      item.calculation.toLowerCase().includes(lowerQuery) ||
      item.result.toLowerCase().includes(lowerQuery)
    )
  },

  // Export history as JSON
  exportHistory: () => {
    const history = historyManager.getHistory()
    const dataStr = JSON.stringify(history, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    return dataBlob
  },

  // Import history from JSON
  importHistory: (jsonData) => {
    try {
      const importedHistory = JSON.parse(jsonData)
      if (Array.isArray(importedHistory)) {
        storage.set(STORAGE_KEYS.HISTORY, importedHistory)
        return true
      }
      return false
    } catch (error) {
      console.error('Error importing history:', error)
      return false
    }
  }
}

// Theme management
export const themeManager = {
  getTheme: () => {
    return storage.get(STORAGE_KEYS.THEME, 'light')
  },

  setTheme: (theme) => {
    storage.set(STORAGE_KEYS.THEME, theme)
  }
}

// PWA management
export const pwaManager = {
  isDismissed: () => {
    return storage.get(STORAGE_KEYS.PWA_INSTALL_DISMISSED, false)
  },

  setDismissed: (dismissed = true) => {
    storage.set(STORAGE_KEYS.PWA_INSTALL_DISMISSED, dismissed)
  },

  getLastShown: () => {
    return storage.get(STORAGE_KEYS.PWA_INSTALL_LAST_SHOWN, null)
  },

  setLastShown: (timestamp = Date.now()) => {
    storage.set(STORAGE_KEYS.PWA_INSTALL_LAST_SHOWN, timestamp)
  },

  shouldShowPrompt: () => {
    const dismissed = pwaManager.isDismissed()
    const lastShown = pwaManager.getLastShown()
    const now = Date.now()
    
    // Don't show if dismissed or shown in last 24 hours
    return !dismissed && (!lastShown || now - lastShown > 24 * 60 * 60 * 1000)
  }
}

// Settings management
export const settingsManager = {
  getSettings: () => {
    return storage.get(STORAGE_KEYS.CALCULATOR_SETTINGS, {
      precision: 10,
      angleUnit: 'degrees', // 'degrees' or 'radians'
      numberFormat: 'auto', // 'auto', 'scientific', 'engineering'
      soundEnabled: false,
      hapticEnabled: true,
      hasSeenTutorial: false,
      lastCalculatorTutorial: '',
      hideAddressBarMobile: true // Hide address bar on mobile devices by default
    })
  },

  updateSettings: (newSettings) => {
    const currentSettings = settingsManager.getSettings()
    const updatedSettings = { ...currentSettings, ...newSettings }
    storage.set(STORAGE_KEYS.CALCULATOR_SETTINGS, updatedSettings)
    return updatedSettings
  },

  resetSettings: () => {
    storage.remove(STORAGE_KEYS.CALCULATOR_SETTINGS)
    return settingsManager.getSettings()
  }
}

// Export storage keys for direct access if needed
export { STORAGE_KEYS }

// Default export
export default {
  storage,
  historyManager,
  themeManager,
  pwaManager,
  settingsManager,
  STORAGE_KEYS
} 