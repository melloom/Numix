// Sound utility for calculator app
import { settingsManager } from './localStorage'

class SoundManager {
  constructor() {
    this.sounds = {}
    this.initialized = false
    this.audioContext = null
    this.isEnabled = true
    
    this.init()
  }

  async init() {
    try {
      // Initialize Web Audio API for better performance
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // Load sound settings
      const settings = settingsManager.getSettings()
      this.isEnabled = settings.soundEnabled
      
      // Preload sounds
      await this.loadSounds()
      this.initialized = true
    } catch (error) {
      console.warn('Audio initialization failed:', error)
      // Fallback to HTML5 audio
      this.initFallback()
    }
  }

  initFallback() {
    this.audioContext = null
    this.initialized = true
  }

  async loadSounds() {
    // Create clean button click sound programmatically (iPhone-like)
    this.sounds.buttonClick = await this.createButtonClickSound()
    this.sounds.buttonHover = await this.createButtonHoverSound()
    this.sounds.success = await this.createSuccessSound()
    this.sounds.error = await this.createErrorSound()
  }

  // Create iPhone-like button click sound
  async createButtonClickSound() {
    if (!this.audioContext) return null

    const duration = 0.1
    const sampleRate = this.audioContext.sampleRate
    const frameCount = duration * sampleRate
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
    const channelData = buffer.getChannelData(0)

    // Generate a clean click sound (short sine wave with quick decay)
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate
      const frequency = 800 + (400 * Math.exp(-t * 20)) // Frequency sweep
      const amplitude = Math.exp(-t * 30) * 0.3 // Quick decay
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude
    }

    return buffer
  }

  // Create subtle hover sound
  async createButtonHoverSound() {
    if (!this.audioContext) return null

    const duration = 0.05
    const sampleRate = this.audioContext.sampleRate
    const frameCount = duration * sampleRate
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
    const channelData = buffer.getChannelData(0)

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate
      const frequency = 600
      const amplitude = Math.exp(-t * 40) * 0.1
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude
    }

    return buffer
  }

  // Create success sound
  async createSuccessSound() {
    if (!this.audioContext) return null

    const duration = 0.3
    const sampleRate = this.audioContext.sampleRate
    const frameCount = duration * sampleRate
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
    const channelData = buffer.getChannelData(0)

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate
      const frequency = 523 + (261 * Math.sin(t * 10)) // C note with modulation
      const amplitude = Math.exp(-t * 3) * 0.2
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude
    }

    return buffer
  }

  // Create error sound
  async createErrorSound() {
    if (!this.audioContext) return null

    const duration = 0.2
    const sampleRate = this.audioContext.sampleRate
    const frameCount = duration * sampleRate
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
    const channelData = buffer.getChannelData(0)

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate
      const frequency = 200 - (50 * t) // Descending tone
      const amplitude = Math.exp(-t * 5) * 0.25
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude
    }

    return buffer
  }

  playSound(soundName, volume = 1) {
    if (!this.isEnabled || !this.initialized) return

    const sound = this.sounds[soundName]
    if (!sound) return

    try {
      if (this.audioContext) {
        // Web Audio API playback
        const source = this.audioContext.createBufferSource()
        const gainNode = this.audioContext.createGain()
        
        source.buffer = sound
        gainNode.gain.value = volume * 0.5 // Keep volume reasonable
        
        source.connect(gainNode)
        gainNode.connect(this.audioContext.destination)
        
        source.start()
      }
    } catch (error) {
      console.warn('Sound playback failed:', error)
    }
  }

  // Resume audio context (required for user interaction)
  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume()
      } catch (error) {
        console.warn('Failed to resume audio context:', error)
      }
    }
  }

  setEnabled(enabled) {
    this.isEnabled = enabled
    settingsManager.updateSettings({ soundEnabled: enabled })
  }

  isAudioEnabled() {
    return this.isEnabled
  }

  // Specific sound methods
  playButtonClick() {
    this.playSound('buttonClick')
  }

  playButtonHover() {
    this.playSound('buttonHover', 0.3)
  }

  playSuccess() {
    this.playSound('success')
  }

  playError() {
    this.playSound('error')
  }
}

// Create singleton instance
const soundManager = new SoundManager()

// Export convenience functions
export const playButtonClick = () => soundManager.playButtonClick()
export const playButtonHover = () => soundManager.playButtonHover()
export const playSuccess = () => soundManager.playSuccess()
export const playError = () => soundManager.playError()
export const setSoundEnabled = (enabled) => soundManager.setEnabled(enabled)
export const isSoundEnabled = () => soundManager.isAudioEnabled()
export const resumeAudio = () => soundManager.resumeAudioContext()

export default soundManager 