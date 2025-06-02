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
    this.isPlaying = new Set()
    
    this.init()
  }

  async init() {
    const settings = settingsManager.getSettings()
    this.isEnabled = settings.soundEnabled
    
    console.log('⚡ ULTRA-FAST Sound Manager: Initializing...', { 
      isMobile: this.isMobile, 
      enabled: this.isEnabled
    })

    if (!this.isEnabled) {
      this.initialized = true
      return
    }

    // Create ultra-simple, fast audio elements
    this.createFastAudio()
    this.setupFastInteractionListeners()
    
    this.initialized = true
    console.log('🚀 ULTRA-FAST sound system ready!')
  }

  createFastAudio() {
    console.log('🔥 Creating ultra-fast audio elements...')
    
    // Ultra-simple data URL generation - minimal processing
    const createFastBeep = (freq, duration) => {
      const rate = 8000 // Very low for speed
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
      
      // Ultra-simple sine wave
      for (let i = 0; i < samples; i++) {
        const t = i / rate
        const amp = Math.exp(-t * 15) * 0.3
        const sample = Math.sin(2 * Math.PI * freq * t) * amp
        view.setInt16(44 + i * 2, sample * 32767, true)
      }
      
      return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))
    }

    // Ultra-short sounds for instant response
    const sounds = {
      click: { freq: 1500, duration: 0.05 }, // Super short click
      success: { freq: 800, duration: 0.15 },
      error: { freq: 300, duration: 0.1 }
    }

    // Create simple audio elements
    Object.keys(sounds).forEach(name => {
      const config = sounds[name]
      const dataURL = createFastBeep(config.freq, config.duration)
      
      const audio = new Audio(dataURL)
      audio.volume = this.isMobile ? 0.6 : 0.4
      audio.preload = 'auto'
      audio.load()
      
      // Set up for instant reuse
      audio.addEventListener('ended', () => {
        audio.currentTime = 0
        this.isPlaying.delete(name)
      })
      
      this.audioElements.set(name, audio)
      console.log(`✅ Fast audio ready: ${name}`)
    })
  }

  setupFastInteractionListeners() {
    const events = ['touchstart', 'click', 'mousedown']
    
    const unlock = () => {
      if (this.hasUserInteracted) return
      
      console.log('⚡ Unlocking audio instantly...')
      this.hasUserInteracted = true
      
      // Unlock all audio elements quickly
      this.audioElements.forEach((audio, name) => {
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
      
      // Remove listeners
      events.forEach(event => {
        document.removeEventListener(event, unlock, true)
      })
      
      console.log('🔓 Audio unlocked!')
    }
    
    events.forEach(event => {
      document.addEventListener(event, unlock, { 
        once: false, 
        passive: true, 
        capture: true 
      })
    })
  }

  // Ultra-fast play - no checks, no delays
  playFast(soundName) {
    if (!this.isEnabled || !this.initialized) return
    
    const audio = this.audioElements.get(soundName)
    if (!audio || this.isPlaying.has(soundName)) return
    
    this.isPlaying.add(soundName)
    
    try {
      audio.currentTime = 0
      audio.play().catch(() => {
        // Fallback to vibration
        if (this.isMobile && navigator.vibrate) {
          navigator.vibrate(soundName === 'click' ? 10 : 20)
        }
        this.isPlaying.delete(soundName)
      })
    } catch (e) {
      this.isPlaying.delete(soundName)
    }
  }

  setEnabled(enabled) {
    this.isEnabled = enabled
    settingsManager.updateSettings({ soundEnabled: enabled })
    
    if (enabled && this.isMobile) {
      // Quick test sound
      setTimeout(() => this.playFast('click'), 100)
    }
  }

  isAudioEnabled() {
    return this.isEnabled
  }

  // Ultra-simple sound methods
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

// Export ultra-simple functions
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