// Ultra-fast sound utility - INSTANT response, no delays!
import { settingsManager } from './localStorage'
import { isMobileDevice } from './mobileUtils'

class SoundManager {
  constructor() {
    this.initialized = false
    this.isEnabled = true
    this.hasUserInteracted = false
    this.isMobile = isMobileDevice()
    this.audioElements = new Map()
    this.currentSound = null
    
    this.init()
  }

  async init() {
    const settings = settingsManager.getSettings()
    this.isEnabled = settings.soundEnabled
    
    if (!this.isEnabled) {
      this.initialized = true
      return
    }

    this.createFastAudio()
    this.setupFastInteractionListeners()
    
    this.initialized = true
  }

  createFastAudio() {
    // Ultra-short beep generation
    const createFastBeep = (freq, duration) => {
      const rate = 8000
      const samples = Math.floor(duration * rate)
      const buffer = new ArrayBuffer(44 + samples * 2)
      const view = new DataView(buffer)
      
      // Minimal WAV header
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
      
      // Ultra-short sine wave
      for (let i = 0; i < samples; i++) {
        const t = i / rate
        const amp = Math.exp(-t * 20) * 0.3 // Faster decay
        const sample = Math.sin(2 * Math.PI * freq * t) * amp
        view.setInt16(44 + i * 2, sample * 32767, true)
      }
      
      return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))
    }

    // Super short sounds
    const sounds = {
      click: { freq: 1500, duration: 0.03 }, // Even shorter click
      success: { freq: 800, duration: 0.1 },
      error: { freq: 300, duration: 0.08 }
    }

    // Create audio elements
    Object.keys(sounds).forEach(name => {
      const config = sounds[name]
      const dataURL = createFastBeep(config.freq, config.duration)
      
      const audio = new Audio(dataURL)
      audio.volume = this.isMobile ? 0.6 : 0.4
      audio.preload = 'auto'
      audio.load()
      
      this.audioElements.set(name, audio)
    })
  }

  setupFastInteractionListeners() {
    const events = ['touchstart', 'click', 'mousedown', 'keydown']
    
    const unlock = () => {
      if (this.hasUserInteracted) return
      this.hasUserInteracted = true
      
      this.audioElements.forEach((audio) => {
        try {
          const promise = audio.play()
          if (promise) {
            promise.then(() => {
              audio.pause()
              audio.currentTime = 0
            }).catch(() => {})
          }
        } catch (e) {}
      })
      
      events.forEach(event => {
        document.removeEventListener(event, unlock, true)
      })
    }
    
    events.forEach(event => {
      document.addEventListener(event, unlock, { 
        once: false, 
        passive: true, 
        capture: true 
      })
    })
  }

  // Stop current sound and play new one
  playFast(soundName) {
    if (!this.isEnabled || !this.initialized) return
    
    const audio = this.audioElements.get(soundName)
    if (!audio) return
    
    // Stop current sound if playing
    if (this.currentSound) {
      this.currentSound.pause()
      this.currentSound.currentTime = 0
    }
    
    try {
      audio.currentTime = 0
      this.currentSound = audio
      audio.play().catch(() => {
        if (this.isMobile && navigator.vibrate) {
          navigator.vibrate(10)
        }
      })
    } catch (e) {}
  }

  setEnabled(enabled) {
    this.isEnabled = enabled
    settingsManager.updateSettings({ soundEnabled: enabled })
    
    if (enabled && this.isMobile) {
      setTimeout(() => this.playFast('click'), 100)
    }
  }

  isAudioEnabled() {
    return this.isEnabled
  }

  playClick() {
    this.playFast('click')
  }

  playSuccess() {
    this.playFast('success')
  }

  playError() {
    this.playFast('error')
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