// Robust sound system for PWA - prevents audio elements from getting stuck
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
    // Create 10 audio elements for better reliability
    for (let i = 0; i < 10; i++) {
      const audio = new Audio()
      audio.src = this.soundFile
      audio.volume = 0.8
      audio.preload = 'auto'
      
      // Add error handling
      audio.addEventListener('error', () => {
        // Recreate this audio element if it errors
        setTimeout(() => this.recreateAudioElement(i), 100)
      })
      
      // Reset audio when it ends
      audio.addEventListener('ended', () => {
        audio.currentTime = 0
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
      
      audio.addEventListener('error', () => {
        setTimeout(() => this.recreateAudioElement(index), 100)
      })
      
      audio.addEventListener('ended', () => {
        audio.currentTime = 0
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
      
      // Try to unlock only the first audio element silently
      const firstAudio = this.audioElements[0]
      if (firstAudio) {
        firstAudio.play().then(() => {
          firstAudio.pause()
          firstAudio.currentTime = 0
        }).catch(() => {})
      }
      
      // Set unlocking to false after a short delay
      setTimeout(() => {
        this.isUnlocking = false
      }, 100)
      
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
    
    this.clickCount++
    
    // Resume audio context if suspended
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
    
    // Reset all audio elements every 20 clicks to prevent stuck state
    if (this.clickCount % 20 === 0) {
      this.resetAllAudio()
    }
    
    // Try up to 3 different audio elements
    let attempts = 0
    let played = false
    
    while (!played && attempts < 3) {
      const audio = this.audioElements[this.currentIndex]
      this.currentIndex = (this.currentIndex + 1) % this.audioElements.length
      
      if (audio && audio.readyState >= 1) { // HAVE_METADATA or better
        try {
          // Stop and reset current audio
          audio.pause()
          audio.currentTime = 0
          
          // Play immediately
          const playPromise = audio.play()
          if (playPromise) {
            playPromise.then(() => {
              played = true
            }).catch(() => {
              // Try next audio element
              attempts++
            })
          } else {
            played = true
          }
        } catch (e) {
          attempts++
        }
      } else {
        attempts++
      }
    }
    
    // If all attempts failed, recreate audio elements
    if (!played) {
      setTimeout(() => this.recreateAllAudio(), 50)
    }
    
    // Always vibrate on mobile as feedback
    if (this.isMobile && navigator.vibrate) {
      navigator.vibrate(8)
    }
  }

  resetAllAudio() {
    this.audioElements.forEach(audio => {
      try {
        audio.pause()
        audio.currentTime = 0
        audio.load()
      } catch (e) {
        // Ignore errors during reset
      }
    })
  }

  recreateAllAudio() {
    // Recreate all audio elements if they get stuck
    for (let i = 0; i < this.audioElements.length; i++) {
      this.recreateAudioElement(i)
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
      }, 100)
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