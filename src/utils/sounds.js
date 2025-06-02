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
    // Create a click sound using data URL
    const createClickSound = () => {
      const sampleRate = 8000
      const duration = 0.05
      const numSamples = Math.floor(sampleRate * duration)
      
      // Create WAV file header
      const arrayBuffer = new ArrayBuffer(44 + numSamples * 2)
      const view = new DataView(arrayBuffer)
      
      // RIFF chunk descriptor
      view.setUint32(0, 0x46464952, false) // 'RIFF'
      view.setUint32(4, 36 + numSamples * 2, true)
      view.setUint32(8, 0x45564157, false) // 'WAVE'
      
      // fmt sub-chunk
      view.setUint32(12, 0x20746d66, false) // 'fmt '
      view.setUint32(16, 16, true) // subchunk1Size
      view.setUint16(20, 1, true) // audioFormat (PCM)
      view.setUint16(22, 1, true) // numChannels
      view.setUint32(24, sampleRate, true) // sampleRate
      view.setUint32(28, sampleRate * 2, true) // byteRate
      view.setUint16(32, 2, true) // blockAlign
      view.setUint16(34, 16, true) // bitsPerSample
      
      // data sub-chunk
      view.setUint32(36, 0x61746164, false) // 'data'
      view.setUint32(40, numSamples * 2, true)
      
      // Generate click sound
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate
        const amplitude = Math.exp(-t * 40) * 0.7
        const frequency = 1000
        const sample = Math.sin(2 * Math.PI * frequency * t) * amplitude
        view.setInt16(44 + i * 2, Math.floor(sample * 32767), true)
      }
      
      const blob = new Blob([arrayBuffer], { type: 'audio/wav' })
      return URL.createObjectURL(blob)
    }
    
    const soundUrl = createClickSound()
    
    // Create 5 audio elements for rapid clicking
    for (let i = 0; i < 5; i++) {
      const audio = new Audio()
      audio.src = soundUrl
      audio.volume = 1.0
      audio.preload = 'auto'
      
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
      if (this.hasUserInteracted) return
      this.hasUserInteracted = true
      
      // Resume audio context if available
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }
      
      // Try to unlock all audio elements
      this.audioElements.forEach((audio) => {
        audio.play().then(() => {
          audio.pause()
          audio.currentTime = 0
        }).catch(() => {})
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
    const audio = this.audioElements[this.currentIndex]
    this.currentIndex = (this.currentIndex + 1) % this.audioElements.length
    
    if (!audio) return
    
    // Stop and reset
    audio.pause()
    audio.currentTime = 0
    
    // Play
    const playPromise = audio.play()
    if (playPromise) {
      playPromise.catch(() => {
        // Silently ignore errors
      })
    }
    
    // Always vibrate on mobile
    if (this.isMobile && navigator.vibrate) {
      navigator.vibrate(10)
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
      
      // Test sound
      setTimeout(() => this.playSound(), 100)
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
      
      // Try to play a sound
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