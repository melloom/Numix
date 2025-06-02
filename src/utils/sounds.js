// Ultra-fast sound system for PWA - zero interference with rapid clicks
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
    this.fastClickMode = false
    
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

    // Create audio elements immediately
    this.createAudio()
    this.setupInteractionListeners()
    
    this.initialized = true
  }

  createAudio() {
    // Create 15 audio elements for ultra-fast clicking
    for (let i = 0; i < 15; i++) {
      const audio = new Audio()
      audio.src = this.soundFile
      audio.volume = 0.8
      audio.preload = 'auto'
      
      // Minimal event handling for speed
      audio.addEventListener('ended', () => {
        audio.currentTime = 0
      }, { passive: true })
      
      // Load immediately
      audio.load()
      
      this.audioElements.push(audio)
    }

    // Create Web Audio context
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    } catch (e) {
      // Silent fail for speed
    }
  }

  setupInteractionListeners() {
    const events = ['touchstart', 'click']
    
    const unlock = () => {
      if (this.hasUserInteracted) return
      this.hasUserInteracted = true
      
      // Minimal unlock - just resume context
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {})
      }
      
      // Remove listeners immediately
      events.forEach(eventType => {
        document.removeEventListener(eventType, unlock, true)
      })
    }
    
    // Add listeners with minimal options
    events.forEach(eventType => {
      document.addEventListener(eventType, unlock, { 
        once: false, 
        passive: true, 
        capture: true 
      })
    })
  }

  playSound() {
    // INSTANT return if disabled - no processing
    if (!this.isEnabled || !this.initialized) return
    
    this.clickCount++
    
    // Enable fast click mode after 3 rapid clicks
    if (this.clickCount > 3) {
      this.fastClickMode = true
    }
    
    // Get next audio element instantly
    const audio = this.audioElements[this.currentIndex]
    this.currentIndex = (this.currentIndex + 1) % this.audioElements.length
    
    if (audio) {
      // INSTANT play - no checking, no promises, no waiting
      try {
        audio.currentTime = 0
        audio.play()
      } catch (e) {
        // Silent fail for speed
      }
    }
    
    // INSTANT vibration
    if (this.isMobile && navigator.vibrate) {
      navigator.vibrate(6)
    }
  }

  // Simplified methods for maximum speed
  setEnabled(enabled) {
    this.isEnabled = enabled
    settingsManager.updateSettings({ soundEnabled: enabled })
  }

  isAudioEnabled() {
    return this.isEnabled
  }

  // All play methods use the same ultra-fast implementation
  playClick() {
    this.playSound()
  }

  playSuccess() {
    this.playSound()
  }

  playError() {
    this.playSound()
  }

  // Minimal interaction handlers
  handleUserInteraction() {
    if (!this.hasUserInteracted) {
      this.hasUserInteracted = true
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {})
      }
    }
  }
}

// Create singleton
const soundManager = new SoundManager()

// Ultra-minimal exports for maximum speed
export const playButtonClick = () => soundManager.playClick()
export const playButtonHover = () => {} // Completely disabled for speed
export const playSuccess = () => soundManager.playSuccess()
export const playError = () => soundManager.playError()
export const setSoundEnabled = (enabled) => soundManager.setEnabled(enabled)
export const isSoundEnabled = () => soundManager.isAudioEnabled()
export const handleUserInteraction = () => soundManager.handleUserInteraction()
export const resumeAudio = () => {} // No-op for speed
export const forceMobileAudioInit = () => {} // No-op for speed

export default soundManager 