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
    this.soundsLoaded = false
    this.mobileAudioForceEnabled = false
    
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
    
    console.log('Sound Manager: Initializing...', { 
      isMobile: this.isMobile, 
      isPWA: this.isPWA, 
      enabled: this.isEnabled,
      mobileAudioEnabled: this.mobileAudioForceEnabled
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
      
      // Pre-create fallback audio elements for immediate use
      this.createFallbackAudio()
      this.initialized = true
      
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
      
      console.log('Sound Manager: First user interaction detected - initializing audio')
      this.hasUserInteracted = true
      
      try {
        if (this.audioContext) {
          // Resume audio context on mobile
          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume()
            console.log('Sound Manager: AudioContext resumed after user interaction')
          }
          
          // Load sounds after user interaction
          if (!this.soundsLoaded) {
            await this.loadSounds()
            this.soundsLoaded = true
            console.log('Sound Manager: Sounds loaded after user interaction')
          }
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

  // Force mobile audio initialization - called from settings
  async forceMobileAudioInit() {
    if (!this.isMobile) return true

    console.log('Sound Manager: Force initializing mobile audio...')
    
    try {
      // Create or resume audio context
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
          latencyHint: 'interactive',
          sampleRate: 22050
        })
      }

      // Force resume the audio context
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
        console.log('Sound Manager: AudioContext force resumed')
      }

      // Load sounds immediately
      if (!this.soundsLoaded) {
        await this.loadSounds()
        this.soundsLoaded = true
        console.log('Sound Manager: Sounds force loaded')
      }

      // Mark as user interacted
      this.hasUserInteracted = true

      // Play a test sound to confirm it works
      await new Promise(resolve => setTimeout(resolve, 100))
      await this.playButtonClick()
      
      console.log('Sound Manager: Mobile audio force initialization successful!')
      return true

    } catch (error) {
      console.error('Sound Manager: Failed to force initialize mobile audio:', error)
      return false
    }
  }

  initFallback() {
    console.log('Sound Manager: Using fallback audio system')
    this.audioContext = null
    this.createFallbackAudio()
    this.initialized = true
  }

  createFallbackAudio() {
    // Create simple fallback system for mobile
    console.log('Sound Manager: Creating fallback audio system for mobile')
    this.fallbackAudio.set('buttonClick', true)
    this.fallbackAudio.set('success', true)
    this.fallbackAudio.set('error', true)
  }

  async loadSounds() {
    if (!this.audioContext) {
      console.log('Sound Manager: No AudioContext, using fallback sounds')
      return
    }
    
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
      const amplitude = Math.exp(-t * 35) * (this.isMobile ? 0.5 : 0.3) // Louder on mobile
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
      const amplitude = Math.exp(-t * 4) * (this.isMobile ? 0.3 : 0.2)
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
      const amplitude = Math.exp(-t * 6) * (this.isMobile ? 0.4 : 0.25)
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude
    }

    return buffer
  }

  async playSound(soundName, volume = 1) {
    if (!this.isEnabled || !this.initialized) return

    try {
      // First ensure we have user interaction for mobile
      if (!this.hasUserInteracted) {
        console.log('Sound Manager: No user interaction yet, using fallback')
        this.playFallbackSound(soundName)
        return
      }

      // Ensure audio context is resumed (mobile requirement)
      await this.ensureAudioContextResumed()
      
      // Load sounds if not loaded yet
      if (!this.soundsLoaded && this.audioContext) {
        await this.loadSounds()
        this.soundsLoaded = true
      }
      
      const sound = this.sounds[soundName]
      
      if (sound && this.audioContext && this.audioContext.state === 'running') {
        // Web Audio API playback
        const source = this.audioContext.createBufferSource()
        const gainNode = this.audioContext.createGain()
        
        source.buffer = sound
        gainNode.gain.value = volume * (this.isMobile ? 0.7 : 0.4) // Higher volume for mobile
        
        source.connect(gainNode)
        gainNode.connect(this.audioContext.destination)
        
        source.start(0)
        console.log(`Sound Manager: Played ${soundName} via Web Audio API`)
        
      } else {
        // Fallback: Use haptic feedback on mobile if available
        console.log(`Sound Manager: Using fallback for ${soundName}`)
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
          navigator.vibrate(20) // Slightly longer vibration for feedback
          console.log('Sound Manager: Button click vibration')
          break
        case 'success':
          navigator.vibrate([50, 30, 50]) // Success pattern
          console.log('Sound Manager: Success vibration pattern')
          break
        case 'error':
          navigator.vibrate([100, 50, 100, 50, 100]) // Error pattern
          console.log('Sound Manager: Error vibration pattern')
          break
        default:
          navigator.vibrate(10)
      }
    } else {
      console.log(`Sound Manager: No fallback available for ${soundName}`)
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

  async handleUserInteraction() {
    if (!this.hasUserInteracted) {
      console.log('Sound Manager: Handling user interaction')
      this.hasUserInteracted = true
      await this.ensureAudioContextResumed()
      
      // Load sounds immediately after user interaction
      if (!this.soundsLoaded && this.audioContext) {
        await this.loadSounds()
        this.soundsLoaded = true
      }
    }
  }

  setEnabled(enabled) {
    this.isEnabled = enabled
    settingsManager.updateSettings({ soundEnabled: enabled })
    console.log('Sound Manager: Sound enabled set to:', enabled)
  }

  setMobileAudioEnabled(enabled) {
    this.mobileAudioForceEnabled = enabled
    settingsManager.updateSettings({ mobileAudioEnabled: enabled })
    console.log('Sound Manager: Mobile audio enabled set to:', enabled)
    
    // If enabling on mobile, force initialize audio
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
export const resumeAudio = () => soundManager.ensureAudioContextResumed()
export const handleUserInteraction = () => soundManager.handleUserInteraction()

export default soundManager 