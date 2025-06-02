// Ultra-reliable sound system for PWA
import { settingsManager } from './localStorage'
import { isMobileDevice } from './mobileUtils'

class SoundManager {
  constructor() {
    this.initialized = false
    this.isEnabled = true
    this.hasUserInteracted = false
    this.isMobile = isMobileDevice()
    this.audioElements = new Map()
    this.currentIndex = 0
    this.audioContext = null
    
    // Create base64 encoded click sound (ultra short)
    this.clickSoundBase64 = 'data:audio/wav;base64,UklGRh4AAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YfoAAAAA'
    
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

    // Create multiple audio elements
    this.createAudio()
    this.setupInteractionListeners()
    
    this.initialized = true
  }

  createAudio() {
    // Create 5 audio elements for rapid clicking
    for (let i = 0; i < 5; i++) {
      const audio = new Audio()
      audio.src = this.clickSoundBase64
      audio.volume = 1.0
      audio.preload = 'auto'
      audio.load()
      
      this.audioElements.set(`click${i}`, audio)
    }

    // Create Web Audio context for better control
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    } catch (e) {
      console.warn('Web Audio API not supported')
    }
  }

  setupInteractionListeners() {
    const events = ['touchstart', 'click', 'mousedown', 'keydown']
    
    const unlock = () => {
      if (this.hasUserInteracted) return
      this.hasUserInteracted = true
      
      // Resume audio context if available
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }
      
      // Try to unlock all audio elements
      this.audioElements.forEach((audio) => {
        try {
          const playPromise = audio.play()
          if (playPromise) {
            playPromise.then(() => {
              audio.pause()
              audio.currentTime = 0
            }).catch(() => {})
          }
        } catch (e) {}
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
    if (!this.isEnabled || !this.initialized) return
    
    // Resume audio context if suspended
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
    
    // Get next audio element
    const audio = this.audioElements.get(`click${this.currentIndex}`)
    this.currentIndex = (this.currentIndex + 1) % 5
    
    if (!audio) return
    
    try {
      // Stop any current playback
      audio.pause()
      audio.currentTime = 0
      
      // Play immediately
      const playPromise = audio.play()
      if (playPromise) {
        playPromise.catch(() => {
          // If this fails, try the next one immediately
          this.playSound()
        })
      }
    } catch (e) {
      // If this fails, try the next one immediately
      this.playSound()
    }
    
    // Always vibrate on mobile
    if (this.isMobile && navigator.vibrate) {
      navigator.vibrate(5)
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
      
      // Test sound multiple times
      for (let i = 0; i < 3; i++) {
        setTimeout(() => this.playSound(), i * 100)
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
    if (!this.hasUserInteracted) {
      this.hasUserInteracted = true
      
      // Resume audio context if suspended
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }
      
      // Force test sound
      this.playSound()
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