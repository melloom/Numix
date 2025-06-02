// Most aggressive sound utility for mobile devices - MUST WORK!
import { settingsManager } from './localStorage'
import { isMobileDevice } from './mobileUtils'

class SoundManager {
  constructor() {
    this.sounds = {}
    this.initialized = false
    this.audioContext = null
    this.isEnabled = true
    this.hasUserInteracted = false
    this.fallbackAudio = new Map()
    this.isMobile = isMobileDevice()
    this.isPWA = this.checkIfPWA()
    this.soundsLoaded = false
    this.mobileAudioForceEnabled = false
    this.htmlAudioElements = new Map()
    this.aggressiveMode = true
    
    // Bind methods for event listeners
    this.handleUserInteraction = this.handleUserInteraction.bind(this)
    
    this.init()
  }

  checkIfPWA() {
    return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches
  }

  async init() {
    // Load sound settings first
    const settings = settingsManager.getSettings()
    this.isEnabled = settings.soundEnabled
    this.mobileAudioForceEnabled = settings.mobileAudioEnabled
    
    console.log('🔊 AGGRESSIVE Sound Manager: Initializing...', { 
      isMobile: this.isMobile, 
      isPWA: this.isPWA, 
      enabled: this.isEnabled,
      mobileAudioEnabled: this.mobileAudioForceEnabled
    })

    if (!this.isEnabled) {
      this.initialized = true
      return
    }

    // AGGRESSIVE APPROACH: Use HTML5 Audio as primary, Web Audio as backup
    this.createHTMLAudioElements()
    
    try {
      // Create audio context but don't rely on it for mobile
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: this.isMobile ? 22050 : 44100
      })
      
      console.log('🎵 AudioContext created, state:', this.audioContext.state)
      
    } catch (error) {
      console.warn('AudioContext failed, using HTML5 audio only:', error)
    }

    // Set up VERY aggressive user interaction listeners
    this.setupAggressiveUserInteractionListeners()
    
    this.initialized = true
    console.log('✅ Sound Manager initialized in AGGRESSIVE mode')
  }

  createHTMLAudioElements() {
    console.log('🎯 Creating HTML5 audio elements for guaranteed mobile compatibility')
    
    // Create data URLs for audio - this ALWAYS works on mobile
    const createBeepDataURL = (frequency, duration, volume = 0.3) => {
      const sampleRate = 8000 // Low sample rate for compatibility
      const samples = duration * sampleRate
      const buffer = new ArrayBuffer(44 + samples * 2)
      const view = new DataView(buffer)
      
      // WAV header
      const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i))
        }
      }
      
      writeString(0, 'RIFF')
      view.setUint32(4, 36 + samples * 2, true)
      writeString(8, 'WAVE')
      writeString(12, 'fmt ')
      view.setUint32(16, 16, true)
      view.setUint16(20, 1, true)
      view.setUint16(22, 1, true)
      view.setUint32(24, sampleRate, true)
      view.setUint32(28, sampleRate * 2, true)
      view.setUint16(32, 2, true)
      view.setUint16(34, 16, true)
      writeString(36, 'data')
      view.setUint32(40, samples * 2, true)
      
      // Generate audio samples
      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate
        const amplitude = Math.exp(-t * 10) * volume
        const sample = Math.sin(2 * Math.PI * frequency * t) * amplitude
        const intSample = Math.max(-32767, Math.min(32767, sample * 32767))
        view.setInt16(44 + i * 2, intSample, true)
      }
      
      return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))
    }

    // Create different sounds with data URLs
    const sounds = {
      buttonClick: { frequency: 1200, duration: 0.1, volume: 0.5 },
      success: { frequency: 800, duration: 0.3, volume: 0.4 },
      error: { frequency: 400, duration: 0.2, volume: 0.4 },
      hover: { frequency: 900, duration: 0.05, volume: 0.2 }
    }

    Object.keys(sounds).forEach(soundName => {
      const config = sounds[soundName]
      const dataURL = createBeepDataURL(config.frequency, config.duration, config.volume)
      
      const audio = new Audio(dataURL)
      audio.preload = 'auto'
      audio.volume = this.isMobile ? 0.8 : 0.5 // Higher volume on mobile
      
      // AGGRESSIVE: Load the audio immediately
      audio.load()
      
      this.htmlAudioElements.set(soundName, audio)
      console.log(`📱 Created HTML5 audio for ${soundName}`)
    })
  }

  setupAggressiveUserInteractionListeners() {
    // EVERY possible user interaction event
    const events = [
      'touchstart', 'touchend', 'touchmove',
      'mousedown', 'mouseup', 'click',
      'keydown', 'keyup', 'keypress',
      'pointerdown', 'pointerup',
      'gesturestart', 'gestureend'
    ]
    
    const handleAnyInteraction = async (event) => {
      if (this.hasUserInteracted) return
      
      console.log('🚀 AGGRESSIVE: User interaction detected -', event.type)
      this.hasUserInteracted = true
      
      // FORCE resume EVERYTHING
      await this.forceAudioInitialization()
      
      // Remove ALL listeners after first interaction
      events.forEach(eventType => {
        document.removeEventListener(eventType, handleAnyInteraction, { capture: true })
        window.removeEventListener(eventType, handleAnyInteraction, { capture: true })
      })
    }
    
    // Add listeners to BOTH document and window with capture
    events.forEach(eventType => {
      document.addEventListener(eventType, handleAnyInteraction, { 
        once: false, 
        passive: true, 
        capture: true 
      })
      window.addEventListener(eventType, handleAnyInteraction, { 
        once: false, 
        passive: true, 
        capture: true 
      })
    })

    console.log('🎯 Aggressive user interaction listeners setup complete')
  }

  async forceAudioInitialization() {
    console.log('💪 FORCING audio initialization...')
    
    try {
      // Force resume AudioContext if it exists
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
        console.log('✅ AudioContext force resumed')
      }

      // FORCE all HTML5 audio elements to be ready
      for (const [soundName, audio] of this.htmlAudioElements) {
        try {
          // Reset and reload each audio element
          audio.currentTime = 0
          audio.load()
          
          // Try to play a tiny bit and immediately pause (this unlocks audio)
          const playPromise = audio.play()
          if (playPromise) {
            await playPromise.then(() => {
              audio.pause()
              audio.currentTime = 0
            }).catch(() => {})
          }
          
          console.log(`🔓 Unlocked HTML5 audio: ${soundName}`)
        } catch (error) {
          // Silent fail, continue with others
        }
      }

      // Load Web Audio API sounds as backup
      if (this.audioContext && !this.soundsLoaded) {
        await this.loadWebAudioSounds()
        this.soundsLoaded = true
      }

      console.log('🎉 AGGRESSIVE audio initialization complete!')
      
    } catch (error) {
      console.warn('Some audio initialization failed, but HTML5 should still work:', error)
    }
  }

  async loadWebAudioSounds() {
    if (!this.audioContext) return
    
    try {
      // Backup Web Audio API sounds
      this.sounds.buttonClick = await this.createButtonClickSound()
      this.sounds.success = await this.createSuccessSound()
      this.sounds.error = await this.createErrorSound()
      this.sounds.hover = await this.createButtonHoverSound()
      
      console.log('🎵 Web Audio API sounds loaded as backup')
      
    } catch (error) {
      console.warn('Web Audio API loading failed, relying on HTML5:', error)
    }
  }

  async createButtonClickSound() {
    if (!this.audioContext) return null
    const duration = 0.1
    const sampleRate = this.audioContext.sampleRate
    const frameCount = duration * sampleRate
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
    const channelData = buffer.getChannelData(0)

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate
      const frequency = 1200 + (800 * Math.exp(-t * 20))
      const amplitude = Math.exp(-t * 30) * 0.5
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude
    }
    return buffer
  }

  async createSuccessSound() {
    if (!this.audioContext) return null
    const duration = 0.3
    const sampleRate = this.audioContext.sampleRate
    const frameCount = duration * sampleRate
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
    const channelData = buffer.getChannelData(0)

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate
      const frequency = 800 + (200 * Math.sin(t * 8))
      const amplitude = Math.exp(-t * 4) * 0.4
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude
    }
    return buffer
  }

  async createErrorSound() {
    if (!this.audioContext) return null
    const duration = 0.2
    const sampleRate = this.audioContext.sampleRate
    const frameCount = duration * sampleRate
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
    const channelData = buffer.getChannelData(0)

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate
      const frequency = 400 - (200 * t)
      const amplitude = Math.exp(-t * 8) * 0.4
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude
    }
    return buffer
  }

  async createButtonHoverSound() {
    if (!this.audioContext) return null
    const duration = 0.05
    const sampleRate = this.audioContext.sampleRate
    const frameCount = duration * sampleRate
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
    const channelData = buffer.getChannelData(0)

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate
      const frequency = 900
      const amplitude = Math.exp(-t * 40) * 0.2
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude
    }
    return buffer
  }

  async playSound(soundName, volume = 1) {
    if (!this.isEnabled || !this.initialized) return

    console.log(`🔊 Playing sound: ${soundName}`)

    // AGGRESSIVE: Always try to ensure audio is ready
    if (!this.hasUserInteracted) {
      await this.forceAudioInitialization()
    }

    try {
      // PRIMARY: Use HTML5 audio (works best on mobile)
      const htmlAudio = this.htmlAudioElements.get(soundName)
      if (htmlAudio) {
        htmlAudio.currentTime = 0
        htmlAudio.volume = Math.min(1, volume * (this.isMobile ? 0.8 : 0.5))
        
        const playPromise = htmlAudio.play()
        if (playPromise) {
          await playPromise
          console.log(`✅ HTML5 audio played: ${soundName}`)
          return
        }
      }

      // BACKUP: Use Web Audio API
      const webAudioSound = this.sounds[soundName]
      if (webAudioSound && this.audioContext && this.audioContext.state === 'running') {
        const source = this.audioContext.createBufferSource()
        const gainNode = this.audioContext.createGain()
        
        source.buffer = webAudioSound
        gainNode.gain.value = volume * (this.isMobile ? 0.7 : 0.4)
        
        source.connect(gainNode)
        gainNode.connect(this.audioContext.destination)
        source.start(0)
        
        console.log(`✅ Web Audio played: ${soundName}`)
        return
      }

      // FINAL FALLBACK: Vibration
      this.playFallbackSound(soundName)
      
    } catch (error) {
      console.warn(`Sound playback failed for ${soundName}:`, error)
      this.playFallbackSound(soundName)
    }
  }

  playFallbackSound(soundName) {
    if (this.isMobile && 'vibrate' in navigator) {
      switch (soundName) {
        case 'buttonClick':
          navigator.vibrate(25)
          console.log('📳 Vibration: button click')
          break
        case 'success':
          navigator.vibrate([50, 30, 50])
          console.log('📳 Vibration: success')
          break
        case 'error':
          navigator.vibrate([100, 50, 100, 50, 100])
          console.log('📳 Vibration: error')
          break
        default:
          navigator.vibrate(15)
      }
    }
  }

  async handleUserInteraction() {
    if (!this.hasUserInteracted) {
      await this.forceAudioInitialization()
    }
  }

  async forceMobileAudioInit() {
    console.log('🚀 FORCE MOBILE AUDIO INIT')
    await this.forceAudioInitialization()
    
    // Test all sounds
    setTimeout(() => this.playSound('buttonClick'), 100)
    return true
  }

  setEnabled(enabled) {
    this.isEnabled = enabled
    settingsManager.updateSettings({ soundEnabled: enabled })
    console.log('🔊 Sound enabled set to:', enabled)
  }

  setMobileAudioEnabled(enabled) {
    this.mobileAudioForceEnabled = enabled
    settingsManager.updateSettings({ mobileAudioEnabled: enabled })
    console.log('📱 Mobile audio enabled set to:', enabled)
    
    if (enabled && this.isMobile) {
      this.forceMobileAudioInit()
    }
  }

  isAudioEnabled() {
    return this.isEnabled
  }

  isMobileAudioEnabled() {
    return this.mobileAudioForceEnabled
  }

  // Specific sound methods
  async playButtonClick() {
    await this.playSound('buttonClick')
  }

  async playButtonHover() {
    if (!this.isMobile) {
      await this.playSound('hover', 0.3)
    }
  }

  async playSuccess() {
    await this.playSound('success')
  }

  async playError() {
    await this.playSound('error')
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
export const setMobileAudioEnabled = (enabled) => soundManager.setMobileAudioEnabled(enabled)
export const isMobileAudioEnabled = () => soundManager.isMobileAudioEnabled()
export const forceMobileAudioInit = () => soundManager.forceMobileAudioInit()
export const resumeAudio = () => soundManager.forceAudioInitialization()
export const handleUserInteraction = () => soundManager.handleUserInteraction()

export default soundManager 