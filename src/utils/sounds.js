// Ultra-reliable sound system for PWA
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
    this.lastPlayTime = 0
    
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
    // Create 8 audio elements for better reliability
    for (let i = 0; i < 8; i++) {
      const audio = new Audio()
      audio.src = this.soundFile
      audio.volume = 0.8
      audio.preload = 'auto'
      audio.crossOrigin = 'anonymous'
      
      // Add event listeners for better debugging
      audio.addEventListener('canplaythrough', () => {
        // Audio is ready to play
      })
      
      audio.addEventListener('error', (e) => {
        console.warn('Audio error:', e)
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
      
      // Try to unlock all audio elements silently
      this.audioElements.forEach((audio, index) => {
        setTimeout(() => {
          audio.play().then(() => {
            audio.pause()
            audio.currentTime = 0
          }).catch(() => {})
        }, index * 10) // Stagger the unlocking
      })
      
      // Set unlocking to false after a short delay
      setTimeout(() => {
        this.isUnlocking = false
      }, 200)
      
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

  async playSound() {
    if (!this.isEnabled || !this.initialized || this.isUnlocking) return
    
    // Prevent too rapid playing
    const now = Date.now()
    if (now - this.lastPlayTime < 50) return
    this.lastPlayTime = now
    
    // Resume audio context if suspended
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
    
    // Try multiple audio elements to ensure playback
    let soundPlayed = false
    let attempts = 0
    
    while (!soundPlayed && attempts < this.audioElements.length) {
      const audio = this.audioElements[this.currentIndex]
      this.currentIndex = (this.currentIndex + 1) % this.audioElements.length
      
      if (audio && audio.readyState >= 2) { // HAVE_CURRENT_DATA or better
        try {
          // Stop and reset
          audio.pause()
          audio.currentTime = 0
          
          // Play
          const playPromise = audio.play()
          if (playPromise) {
            await playPromise
            soundPlayed = true
          }
        } catch (e) {
          // Try next audio element
          attempts++
        }
      } else {
        attempts++
      }
    }
    
    // Always vibrate on mobile as feedback
    if (this.isMobile && navigator.vibrate) {
      navigator.vibrate(8)
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
        setTimeout(() => this.playSound(), 200)
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
      
      // Set unlocking to false after a longer delay
      setTimeout(() => {
        this.isUnlocking = false
      }, 200)
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