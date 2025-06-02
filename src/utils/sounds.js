// Enhanced Sound utility for calculator app with mobile and PWA support
import { settingsManager } from './localStorage'
import { isMobileDevice } from './mobileUtils'

class SoundManager {
  constructor() {
    this.sounds = {}
    this.initialized = false
    this.audioContext = null
    this.isEnabled = true
    this.hasUserInteracted = false
    this.initializationPromise = null
    this.fallbackAudio = new Map()
    this.isMobile = isMobileDevice()
    this.isPWA = this.checkIfPWA()
    
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
    
    console.log('Sound Manager: Initializing...', { 
      isMobile: this.isMobile, 
      isPWA: this.isPWA, 
      enabled: this.isEnabled 
    })

    if (!this.isEnabled) {
      this.initialized = true
      return
    }

    try {
      // Create audio context with proper mobile handling
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: this.isMobile ? 22050 : 44100 // Lower sample rate for mobile
      })
      
      console.log('Sound Manager: AudioContext created, state:', this.audioContext.state)
      
      // Set up user interaction listeners for mobile/PWA
      this.setupUserInteractionListeners()
      
      // Initialize immediately if context is running, otherwise wait for interaction
      if (this.audioContext.state === 'running') {
        await this.loadSounds()
        this.hasUserInteracted = true
        this.initialized = true
      } else {
        // Pre-create fallback audio elements for immediate use
        this.createFallbackAudio()
        this.initialized = true
      }
      
    } catch (error) {
      console.warn('Sound Manager: AudioContext initialization failed, using fallback:', error)
      this.initFallback()
    }
  }

  setupUserInteractionListeners() {
    // Listen for various user interaction events
    const events = ['touchstart', 'touchend', 'mousedown', 'keydown', 'click']
    
    const handleFirstInteraction = async () => {
      if (this.hasUserInteracted) return
      
      console.log('Sound Manager: First user interaction detected')
      this.hasUserInteracted = true
      
      try {
        if (this.audioContext && this.audioContext.state !== 'running') {
          await this.audioContext.resume()
          console.log('Sound Manager: AudioContext resumed')
        }
        
        if (!this.sounds.buttonClick) {
          await this.loadSounds()
          console.log('Sound Manager: Sounds loaded after user interaction')
        }
        
        // Remove listeners after first interaction
        events.forEach(event => {
          document.removeEventListener(event, handleFirstInteraction, { capture: true })
        })
        
      } catch (error) {
        console.warn('Sound Manager: Failed to initialize audio after user interaction:', error)
      }
    }
    
    // Add listeners with capture to ensure we catch the interaction
    events.forEach(event => {
      document.addEventListener(event, handleFirstInteraction, { 
        once: false, 
        passive: true, 
        capture: true 
      })
    })
  }

  initFallback() {
    console.log('Sound Manager: Using fallback audio system')
    this.audioContext = null
    this.createFallbackAudio()
    this.initialized = true
  }

  createFallbackAudio() {
    // Create HTML5 audio elements as fallback
    try {
      const createAudioElement = (frequency, duration) => {
        const audio = new Audio()
        audio.preload = 'auto'
        audio.volume = 0.3
        
        // Create a simple beep using data URL (works on most mobile browsers)
        const context = new (window.AudioContext || window.webkitAudioContext)()
        const sampleRate = 8000 // Very low for compatibility
        const frameCount = duration * sampleRate
        const buffer = context.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)
        
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate
          const amplitude = Math.exp(-t * 20) * 0.3
          channelData[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude
        }
        
        return audio
      }
      
      // Note: Fallback will use CSS click sounds or vibration
      this.fallbackAudio.set('buttonClick', null)
      this.fallbackAudio.set('success', null)
      this.fallbackAudio.set('error', null)
      
    } catch (error) {
      console.warn('Sound Manager: Fallback audio creation failed:', error)
    }
  }

  async loadSounds() {
    if (!this.audioContext) return
    
    try {
      console.log('Sound Manager: Loading sounds...')
      
      // Create clean button click sound programmatically
      this.sounds.buttonClick = await this.createButtonClickSound()
      this.sounds.buttonHover = await this.createButtonHoverSound()
      this.sounds.success = await this.createSuccessSound()
      this.sounds.error = await this.createErrorSound()
      
      console.log('Sound Manager: All sounds loaded successfully')
      
    } catch (error) {
      console.warn('Sound Manager: Failed to load sounds:', error)
    }
  }

  // Enhanced button click sound for mobile
  async createButtonClickSound() {
    if (!this.audioContext) return null

    const duration = this.isMobile ? 0.08 : 0.1 // Shorter on mobile
    const sampleRate = this.audioContext.sampleRate
    const frameCount = duration * sampleRate
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
    const channelData = buffer.getChannelData(0)

    // iPhone-like click sound with better mobile optimization
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate
      const frequency = 1000 + (600 * Math.exp(-t * 25)) // Higher frequency for mobile speakers
      const amplitude = Math.exp(-t * 35) * (this.isMobile ? 0.4 : 0.3) // Slightly louder on mobile
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude
    }

    return buffer
  }

  async createButtonHoverSound() {
    if (!this.audioContext) return null

    const duration = 0.04
    const sampleRate = this.audioContext.sampleRate
    const frameCount = duration * sampleRate
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
    const channelData = buffer.getChannelData(0)

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate
      const frequency = 800
      const amplitude = Math.exp(-t * 50) * 0.15
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude
    }

    return buffer
  }

  async createSuccessSound() {
    if (!this.audioContext) return null

    const duration = this.isMobile ? 0.25 : 0.3
    const sampleRate = this.audioContext.sampleRate
    const frameCount = duration * sampleRate
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
    const channelData = buffer.getChannelData(0)

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate
      const frequency = 523 + (200 * Math.sin(t * 8)) // C note with modulation
      const amplitude = Math.exp(-t * 4) * (this.isMobile ? 0.25 : 0.2)
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude
    }

    return buffer
  }

  async createErrorSound() {
    if (!this.audioContext) return null

    const duration = this.isMobile ? 0.15 : 0.2
    const sampleRate = this.audioContext.sampleRate
    const frameCount = duration * sampleRate
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
    const channelData = buffer.getChannelData(0)

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate
      const frequency = 300 - (100 * t) // Descending tone
      const amplitude = Math.exp(-t * 6) * (this.isMobile ? 0.3 : 0.25)
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude
    }

    return buffer
  }

  async playSound(soundName, volume = 1) {
    if (!this.isEnabled || !this.initialized) return

    try {
      // Ensure audio context is resumed (mobile requirement)
      await this.ensureAudioContextResumed()
      
      const sound = this.sounds[soundName]
      
      if (sound && this.audioContext) {
        // Web Audio API playback
        const source = this.audioContext.createBufferSource()
        const gainNode = this.audioContext.createGain()
        
        source.buffer = sound
        gainNode.gain.value = volume * (this.isMobile ? 0.6 : 0.4) // Adjust volume for mobile
        
        source.connect(gainNode)
        gainNode.connect(this.audioContext.destination)
        
        source.start(0)
        
      } else {
        // Fallback: Use haptic feedback on mobile if available
        this.playFallbackSound(soundName)
      }
      
    } catch (error) {
      console.warn('Sound Manager: Playback failed:', error)
      this.playFallbackSound(soundName)
    }
  }

  playFallbackSound(soundName) {
    // Mobile haptic feedback as fallback
    if (this.isMobile && 'vibrate' in navigator) {
      switch (soundName) {
        case 'buttonClick':
          navigator.vibrate(10) // Very short vibration
          break
        case 'success':
          navigator.vibrate([50, 30, 50]) // Success pattern
          break
        case 'error':
          navigator.vibrate([100, 50, 100, 50, 100]) // Error pattern
          break
        default:
          navigator.vibrate(5)
      }
    }
  }

  async ensureAudioContextResumed() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume()
        console.log('Sound Manager: AudioContext resumed')
      } catch (error) {
        console.warn('Sound Manager: Failed to resume AudioContext:', error)
      }
    }
  }

  handleUserInteraction() {
    if (!this.hasUserInteracted) {
      this.hasUserInteracted = true
      this.ensureAudioContextResumed()
    }
  }

  setEnabled(enabled) {
    this.isEnabled = enabled
    settingsManager.updateSettings({ soundEnabled: enabled })
    console.log('Sound Manager: Sound enabled set to:', enabled)
  }

  isAudioEnabled() {
    return this.isEnabled
  }

  // Specific sound methods with mobile optimization
  async playButtonClick() {
    await this.playSound('buttonClick')
  }

  async playButtonHover() {
    // Don't play hover sounds on mobile (touch devices)
    if (!this.isMobile) {
      await this.playSound('buttonHover', 0.3)
    }
  }

  async playSuccess() {
    await this.playSound('success')
  }

  async playError() {
    await this.playSound('error')
  }

  // PWA-specific method to ensure audio works when app is installed
  async initializePWAAudio() {
    if (this.isPWA && !this.hasUserInteracted) {
      console.log('Sound Manager: PWA detected, setting up audio...')
      
      // PWAs need explicit user interaction
      const initButton = document.createElement('button')
      initButton.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10000;
        padding: 1rem 2rem;
        background: #6366f1;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        cursor: pointer;
      `
      initButton.textContent = 'Enable Sound 🔊'
      
      initButton.onclick = async () => {
        await this.handleUserInteraction()
        if (!this.sounds.buttonClick) {
          await this.loadSounds()
        }
        document.body.removeChild(initButton)
        await this.playButtonClick() // Test sound
      }
      
      document.body.appendChild(initButton)
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (document.body.contains(initButton)) {
          document.body.removeChild(initButton)
        }
      }, 5000)
    }
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
export const resumeAudio = () => soundManager.ensureAudioContextResumed()
export const handleUserInteraction = () => soundManager.handleUserInteraction()
export const initializePWAAudio = () => soundManager.initializePWAAudio()

// Auto-initialize PWA audio if needed
if (soundManager.isPWA) {
  setTimeout(() => soundManager.initializePWAAudio(), 1000)
}

export default soundManager 