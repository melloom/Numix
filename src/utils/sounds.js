// Ultra-aggressive sound system for mobile
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
    this.lastPlayTime = 0
    
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
    // Create an extremely short click sound
    const createClickSound = () => {
      const rate = 8000
      const duration = 0.03 // Ultra short
      const samples = Math.floor(duration * rate)
      const buffer = new ArrayBuffer(44 + samples * 2)
      const view = new DataView(buffer)
      
      // WAV header
      view.setUint32(0, 0x46464952, false) // 'RIFF'
      view.setUint32(4, 36 + samples * 2, true)
      view.setUint32(8, 0x45564157, false) // 'WAVE'
      view.setUint32(12, 0x20746d66, false) // 'fmt '
      view.setUint32(16, 16, true)
      view.setUint16(20, 1, true)
      view.setUint16(22, 1, true)
      view.setUint32(24, rate, true)
      view.setUint32(28, rate * 2, true)
      view.setUint16(32, 2, true)
      view.setUint16(34, 16, true)
      view.setUint32(36, 0x61746164, false) // 'data'
      view.setUint32(40, samples * 2, true)
      
      // Sharp click sound
      for (let i = 0; i < samples; i++) {
        const t = i / rate
        const amp = Math.exp(-t * 50) * 0.8 // Even faster decay, louder
        const sample = Math.sin(2 * Math.PI * 1200 * t) * amp
        view.setInt16(44 + i * 2, sample * 32767, true)
      }
      
      return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))
    }

    // Create multiple audio elements for the same sound
    const dataURL = createClickSound()
    
    // Create 5 audio elements for rapid clicking
    for (let i = 0; i < 5; i++) {
      const audio = new Audio()
      audio.src = dataURL
      audio.volume = 1.0 // Maximum volume
      audio.preload = 'auto'
      audio.load()
      
      this.audioElements.set(`click${i}`, audio)
    }
  }

  setupInteractionListeners() {
    const events = ['touchstart', 'click', 'mousedown', 'keydown']
    
    const unlock = () => {
      if (this.hasUserInteracted) return
      this.hasUserInteracted = true
      
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
    
    const now = Date.now()
    if (now - this.lastPlayTime < 20) return // Prevent too rapid playback
    this.lastPlayTime = now
    
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
      navigator.vibrate(5) // Shorter vibration
    }
  }

  setEnabled(enabled) {
    this.isEnabled = enabled
    settingsManager.updateSettings({ soundEnabled: enabled })
    
    if (enabled) {
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