// High-performance sound system for rapid clicking and fast typing
import { settingsManager } from './localStorage'
import { isMobileDevice } from './mobileUtils'

class SoundManager {
  constructor() {
    this.initialized = false
    this.isEnabled = true
    this.hasUserInteracted = false
    this.isMobile = isMobileDevice()
    this.audioElements = []
    this.currentIndex = 0
    this.audioContext = null
    this.isUnlocking = false
    this.clickCount = 0
    this.lastPlayTime = 0
    this.playQueue = []
    this.isProcessingQueue = false
    
    // Use the specific sound file
    this.soundFile = '/assets/ui-pop-sound-316482.mp3'
    
    // Initialize immediately
    this.init()
  }

  init() {
    const settings = settingsManager.getSettings()
    this.isEnabled = settings.soundEnabled
    
    if (!this.isEnabled) {
      this.initialized = true
      return
    }

    // Create audio elements
    this.createAudio()
    this.setupInteractionListeners()
    
    this.initialized = true
  }

  createAudio() {
    // Create 15 audio elements for ultra-rapid clicking support
    for (let i = 0; i < 15; i++) {
      const audio = new Audio()
      audio.src = this.soundFile
      audio.volume = 0.8
      audio.preload = 'auto'
      
      // Optimize for rapid playback
      audio.loop = false
      audio.muted = false
      
      // Add error handling
      audio.addEventListener('error', () => {
        // Recreate this audio element if it errors
        setTimeout(() => this.recreateAudioElement(i), 50)
      })
      
      // Reset audio when it ends
      audio.addEventListener('ended', () => {
        audio.currentTime = 0
        audio.pause()
      })
      
      // Handle loading states
      audio.addEventListener('canplaythrough', () => {
        // Audio is ready for rapid playback
      })
      
      // Load the audio
      audio.load()
      
      this.audioElements.push(audio)
    }

    // Create Web Audio context for better control
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    } catch (e) {
      console.warn('Web Audio API not supported')
    }
  }

  recreateAudioElement(index) {
    if (index >= 0 && index < this.audioElements.length) {
      const audio = new Audio()
      audio.src = this.soundFile
      audio.volume = 0.8
      audio.preload = 'auto'
      audio.loop = false
      audio.muted = false
      
      audio.addEventListener('error', () => {
        setTimeout(() => this.recreateAudioElement(index), 50)
      })
      
      audio.addEventListener('ended', () => {
        audio.currentTime = 0
        audio.pause()
      })
      
      audio.load()
      this.audioElements[index] = audio
    }
  }

  setupInteractionListeners() {
    const events = ['touchstart', 'touchend', 'click', 'mousedown']
    
    const unlock = () => {
      if (this.hasUserInteracted || this.isUnlocking) return
      this.hasUserInteracted = true
      this.isUnlocking = true
      
      // Resume audio context if available
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }
      
      // Try to unlock multiple audio elements silently for rapid playback
      const unlockPromises = this.audioElements.slice(0, 3).map(audio => {
        return audio.play().then(() => {
          audio.pause()
          audio.currentTime = 0
        }).catch(() => {})
      })
      
      Promise.all(unlockPromises).finally(() => {
        // Set unlocking to false after unlocking
        setTimeout(() => {
          this.isUnlocking = false
        }, 50)
      })
      
      // Remove listeners
      events.forEach(eventType => {
        document.removeEventListener(eventType, unlock, true)
      })
    }
    
    // Add listeners
    events.forEach(eventType => {
      document.addEventListener(eventType, unlock, { 
        once: false, 
        passive: true, 
        capture: true 
      })
    })
  }

  playSound() {
    if (!this.isEnabled || !this.initialized || this.isUnlocking) return
    
    const now = performance.now()
    this.clickCount++
    this.lastPlayTime = now
    
    // Resume audio context if suspended
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
    
    // Reset all audio elements every 50 clicks to prevent stuck state
    if (this.clickCount % 50 === 0) {
      this.resetAllAudio()
    }
    
    // Find the best available audio element
    const audio = this.findAvailableAudio()
    
    if (audio) {
      try {
        // Stop and reset current audio immediately
        audio.pause()
        audio.currentTime = 0
        
        // Play immediately without waiting for promises
        const playPromise = audio.play()
        if (playPromise) {
          playPromise.catch(() => {
            // Silent fail - find next available audio
            const backupAudio = this.findAvailableAudio()
            if (backupAudio && backupAudio !== audio) {
              backupAudio.pause()
              backupAudio.currentTime = 0
              backupAudio.play().catch(() => {})
            }
          })
        }
      } catch (e) {
        // Try backup audio element
        const backupAudio = this.findAvailableAudio()
        if (backupAudio && backupAudio !== audio) {
          try {
            backupAudio.pause()
            backupAudio.currentTime = 0
            backupAudio.play().catch(() => {})
          } catch (backupError) {
            // Silent fail
          }
        }
      }
    }
    
    // Always vibrate on mobile as immediate feedback
    if (this.isMobile && navigator.vibrate) {
      navigator.vibrate(6) // Shorter vibration for rapid clicks
    }
  }

  findAvailableAudio() {
    // First try to find a paused/ended audio element
    for (let i = 0; i < this.audioElements.length; i++) {
      const audio = this.audioElements[i]
      if (audio.paused || audio.ended || audio.currentTime === 0) {
        return audio
      }
    }
    
    // If all are playing, use round-robin selection
    const audio = this.audioElements[this.currentIndex]
    this.currentIndex = (this.currentIndex + 1) % this.audioElements.length
    return audio
  }

  resetAllAudio() {
    this.audioElements.forEach(audio => {
      try {
        audio.pause()
        audio.currentTime = 0
        // Reload to ensure fresh state
        audio.load()
      } catch (e) {
        // Ignore errors during reset
      }
    })
  }

  recreateAllAudio() {
    // Recreate all audio elements if they get stuck
    for (let i = 0; i < this.audioElements.length; i++) {
      setTimeout(() => this.recreateAudioElement(i), i * 10) // Stagger recreation
    }
  }

  setEnabled(enabled) {
    this.isEnabled = enabled
    settingsManager.updateSettings({ soundEnabled: enabled })
    
    if (enabled) {
      // Resume audio context if suspended
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }
      
      // Test sound only if not unlocking
      if (!this.isUnlocking) {
        setTimeout(() => this.playSound(), 100)
      }
    }
  }

  isAudioEnabled() {
    return this.isEnabled
  }

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
    if (!this.hasUserInteracted && !this.isUnlocking) {
      this.hasUserInteracted = true
      this.isUnlocking = true
      
      // Resume audio context if suspended
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }
      
      // Set unlocking to false after a short delay
      setTimeout(() => {
        this.isUnlocking = false
      }, 50)
    }
  }
}

// Create singleton
const soundManager = new SoundManager()

// Export functions
export const playButtonClick = () => soundManager.playClick()
export const playButtonHover = () => {} // Disabled for speed
export const playSuccess = () => soundManager.playSuccess()
export const playError = () => soundManager.playError()
export const setSoundEnabled = (enabled) => soundManager.setEnabled(enabled)
export const isSoundEnabled = () => soundManager.isAudioEnabled()
export const handleUserInteraction = () => soundManager.handleUserInteraction()
export const resumeAudio = () => soundManager.handleUserInteraction()
export const forceMobileAudioInit = () => soundManager.handleUserInteraction()

export default soundManager 