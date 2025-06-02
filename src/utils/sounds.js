// Simple sound utility
import { settingsManager } from './localStorage'
import { isMobileDevice } from './mobileUtils'

class SoundManager {
  constructor() {
    this.initialized = false
    this.isEnabled = true
    this.hasUserInteracted = false
    this.isMobile = isMobileDevice()
    this.audioElements = new Map()
    
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

    // Create basic audio elements
    this.createAudio()
    this.setupInteractionListeners()
    
    this.initialized = true
  }

  createAudio() {
    // Simple beep generation
    const createBeep = (freq, duration) => {
      const rate = 8000
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
      
      // Simple sine wave
      for (let i = 0; i < samples; i++) {
        const t = i / rate
        const amp = Math.exp(-t * 10) * 0.3
        const sample = Math.sin(2 * Math.PI * freq * t) * amp
        view.setInt16(44 + i * 2, sample * 32767, true)
      }
      
      return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))
    }

    // Basic sounds
    const sounds = {
      click: { freq: 1000, duration: 0.1 },
      success: { freq: 800, duration: 0.2 },
      error: { freq: 300, duration: 0.15 }
    }

    // Create audio elements
    Object.keys(sounds).forEach(name => {
      const config = sounds[name]
      const dataURL = createBeep(config.freq, config.duration)
      
      const audio = new Audio()
      audio.src = dataURL
      audio.volume = this.isMobile ? 0.7 : 0.5
      audio.preload = 'auto'
      
      // Force load
      audio.load()
      
      this.audioElements.set(name, audio)
    })
  }

  setupInteractionListeners() {
    const events = ['touchstart', 'click', 'mousedown', 'keydown']
    
    const unlock = () => {
      if (this.hasUserInteracted) return
      this.hasUserInteracted = true
      
      // Try to unlock each audio element
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

  playSound(soundName) {
    if (!this.isEnabled || !this.initialized) return
    
    const audio = this.audioElements.get(soundName)
    if (!audio) return
    
    try {
      // Stop any current playback
      audio.pause()
      audio.currentTime = 0
      
      // Play immediately
      audio.play().catch(() => {
        // Fallback to vibration on mobile
        if (this.isMobile && navigator.vibrate) {
          navigator.vibrate(20)
        }
      })
    } catch (e) {}
  }

  setEnabled(enabled) {
    this.isEnabled = enabled
    settingsManager.updateSettings({ soundEnabled: enabled })
    
    if (enabled) {
      // Test sound
      setTimeout(() => this.playSound('click'), 100)
    }
  }

  isAudioEnabled() {
    return this.isEnabled
  }

  playClick() {
    this.playSound('click')
  }

  playSuccess() {
    this.playSound('success')
  }

  playError() {
    this.playSound('error')
  }

  handleUserInteraction() {
    if (!this.hasUserInteracted) {
      this.hasUserInteracted = true
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