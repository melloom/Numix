// Ultra-safe sound system with strict debouncing and crash prevention
import { settingsManager } from './localStorage'
import { isMobileDevice } from './mobileUtils'

class SafeSoundManager {
  constructor() {
    this.isEnabled = false
    this.hasUserInteracted = false
    this.isMobile = isMobileDevice()
    this.audio = null
    this.isCurrentlyPlaying = false
    this.lastPlayTime = 0
    this.soundFile = '/assets/ui-pop-sound-316482.mp3'
    this.isLocked = false
    this.lockTimeout = null
    this.minInterval = 200 // Increased minimum interval between sounds
    this.maxLockTime = 1000 // Maximum lock time
    
    this.init()
  }

  init() {
    try {
      const settings = settingsManager.getSettings()
      this.isEnabled = settings.soundEnabled
      
      if (this.isEnabled) {
        this.createSingleAudio()
        this.setupUnlockListener()
      }
    } catch (error) {
      console.warn('Sound init failed silently')
      this.isEnabled = false
      this.audio = null
    }
  }

  createSingleAudio() {
    try {
      // Clean up any existing audio
      if (this.audio) {
        this.audio.pause()
        this.audio.src = ''
        this.audio = null
      }
      
      // Create only ONE audio element
      this.audio = new Audio()
      this.audio.src = this.soundFile
      this.audio.volume = 0.6 // Reduced volume to prevent harsh sounds
      this.audio.preload = 'none'
      this.audio.muted = true
      
      // Critical: prevent multiple plays with strict event handling
      this.audio.addEventListener('ended', () => {
        this.clearLock()
      }, { passive: true })
      
      this.audio.addEventListener('error', (e) => {
        console.warn('Audio error:', e)
        this.clearLock()
      }, { passive: true })
      
      this.audio.addEventListener('pause', () => {
        this.clearLock()
      }, { passive: true })
      
      // Add abort handler for network issues
      this.audio.addEventListener('abort', () => {
        this.clearLock()
      }, { passive: true })
      
    } catch (error) {
      console.warn('Audio creation failed silently:', error)
      this.audio = null
      this.isEnabled = false
    }
  }

  clearLock() {
    this.isCurrentlyPlaying = false
    this.isLocked = false
    
    if (this.lockTimeout) {
      clearTimeout(this.lockTimeout)
      this.lockTimeout = null
    }
    
    try {
      if (this.audio && this.audio.currentTime > 0) {
        this.audio.currentTime = 0
      }
    } catch (e) {
      // Ignore currentTime errors
    }
  }

  setupUnlockListener() {
    const unlock = () => {
      if (this.hasUserInteracted) return
      this.hasUserInteracted = true
      
      try {
        if (this.audio) {
          this.audio.muted = false
          this.audio.preload = 'auto'
        }
      } catch (e) {
        console.warn('Audio unlock failed:', e)
      }
      
      // Remove listeners immediately
      document.removeEventListener('touchstart', unlock, true)
      document.removeEventListener('click', unlock, true)
      document.removeEventListener('pointerdown', unlock, true)
    }
    
    // Multiple event types for better coverage
    document.addEventListener('touchstart', unlock, { once: true, passive: true, capture: true })
    document.addEventListener('click', unlock, { once: true, passive: true, capture: true })
    document.addEventListener('pointerdown', unlock, { once: true, passive: true, capture: true })
  }

  playSound() {
    const now = Date.now()
    
    // ULTRA STRICT: Multiple checks to prevent overlapping and crashes
    if (!this.isEnabled || !this.hasUserInteracted) return
    if (this.isLocked || this.isCurrentlyPlaying) return
    
    // Stricter rate limiting
    if (now - this.lastPlayTime < this.minInterval) return
    
    // Check if audio exists and is ready
    if (!this.audio) return
    
    try {
      // Additional safety check for readyState
      if (this.audio.readyState < 2 && this.audio.readyState !== 4) return
      
      // LOCK immediately to prevent any other plays
      this.isLocked = true
      this.isCurrentlyPlaying = true
      this.lastPlayTime = now
      
      // Safety timeout to force unlock if something goes wrong
      this.lockTimeout = setTimeout(() => {
        this.clearLock()
      }, this.maxLockTime)
      
      // Force stop any current playback - with error handling
      try {
        this.audio.pause()
        this.audio.currentTime = 0
      } catch (timeError) {
        // Some browsers don't allow currentTime changes immediately
      }
      
      // Play with comprehensive error handling
      const playPromise = this.audio.play()
      
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(() => {
          // Success - sound is playing
        }).catch((playError) => {
          console.warn('Play promise failed:', playError)
          this.clearLock()
          this.fallbackFeedback()
        })
      } else {
        // Older browsers without promises
        setTimeout(() => {
          if (this.audio && this.audio.paused) {
            this.clearLock()
            this.fallbackFeedback()
          }
        }, 100)
      }
      
    } catch (error) {
      console.warn('Play sound error:', error)
      this.clearLock()
      this.fallbackFeedback()
    }
  }

  fallbackFeedback() {
    // Mobile vibration as backup feedback
    if (this.isMobile && navigator.vibrate) {
      try {
        navigator.vibrate(10) // Slightly longer vibration
      } catch (e) {
        // Ignore vibration errors
      }
    }
  }

  setEnabled(enabled) {
    try {
      this.isEnabled = enabled
      settingsManager.updateSettings({ soundEnabled: enabled })
      
      if (enabled && !this.audio) {
        this.createSingleAudio()
        this.setupUnlockListener()
      } else if (!enabled) {
        this.stopAllSounds()
      }
      
    } catch (error) {
      console.warn('Set enabled error:', error)
    }
  }

  isAudioEnabled() {
    return this.isEnabled && this.audio !== null
  }

  // All play methods use the same restrictive playSound
  playClick() { 
    this.playSound() 
  }
  
  playSuccess() { 
    this.playSound() 
  }
  
  playError() { 
    this.playSound() 
  }
  
  handleUserInteraction() {
    if (!this.hasUserInteracted) {
      this.hasUserInteracted = true
      try {
        if (this.audio) {
          this.audio.muted = false
          this.audio.preload = 'auto'
        }
      } catch (e) {
        console.warn('User interaction handler error:', e)
      }
    }
  }

  // Force stop all sounds
  stopAllSounds() {
    try {
      if (this.audio) {
        this.audio.pause()
        this.audio.currentTime = 0
      }
    } catch (e) {
      // Ignore stop errors
    }
    this.clearLock()
  }

  // Cleanup
  destroy() {
    try {
      this.stopAllSounds()
      if (this.audio) {
        this.audio.src = ''
        this.audio = null
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

// Create single instance with comprehensive fallback
let soundManager
try {
  soundManager = new SafeSoundManager()
} catch (error) {
  console.warn('Sound manager creation failed:', error)
  soundManager = {
    playClick: () => {},
    playSuccess: () => {},
    playError: () => {},
    setEnabled: () => {},
    isAudioEnabled: () => false,
    handleUserInteraction: () => {},
    stopAllSounds: () => {},
    destroy: () => {}
  }
}

// Ultra-safe exports with additional error wrapping
export const playButtonClick = () => {
  try { 
    soundManager.playClick() 
  } catch (e) { 
    console.warn('Button click sound failed:', e)
  }
}

export const playButtonHover = () => {
  // Always disabled for performance and to prevent spam
}

export const playSuccess = () => {
  try { 
    soundManager.playSuccess() 
  } catch (e) { 
    console.warn('Success sound failed:', e)
  }
}

export const playError = () => {
  try { 
    soundManager.playError() 
  } catch (e) { 
    console.warn('Error sound failed:', e)
  }
}

export const setSoundEnabled = (enabled) => {
  try { 
    soundManager.setEnabled(enabled) 
  } catch (e) { 
    console.warn('Set sound enabled failed:', e)
  }
}

export const isSoundEnabled = () => {
  try { 
    return soundManager.isAudioEnabled() 
  } catch (e) { 
    console.warn('Is sound enabled failed:', e)
    return false 
  }
}

export const handleUserInteraction = () => {
  try { 
    soundManager.handleUserInteraction() 
  } catch (e) { 
    console.warn('Handle user interaction failed:', e)
  }
}

export const resumeAudio = () => {
  try { 
    soundManager.handleUserInteraction() 
  } catch (e) { 
    console.warn('Resume audio failed:', e)
  }
}

export const forceMobileAudioInit = () => {
  try { 
    soundManager.handleUserInteraction() 
  } catch (e) { 
    console.warn('Force mobile audio init failed:', e)
  }
}

export const stopAllSounds = () => {
  try { 
    soundManager.stopAllSounds() 
  } catch (e) { 
    console.warn('Stop all sounds failed:', e)
  }
}

export default soundManager 