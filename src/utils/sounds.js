// Most aggressive sound utility for mobile devices - INSTANT PLAYBACK!
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
    this.htmlAudioElements = new Map()
    this.readyAudioPool = new Map() // Pool of ready-to-play audio elements
    this.aggressiveMode = true
    this.currentlyPlaying = new Set()
    
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
    
    console.log('🔊 INSTANT Sound Manager: Initializing...', { 
      isMobile: this.isMobile, 
      isPWA: this.isPWA, 
      enabled: this.isEnabled
    })

    if (!this.isEnabled) {
      this.initialized = true
      return
    }

    // INSTANT APPROACH: Create multiple audio pools for zero delay
    this.createInstantAudioPool()
    
    try {
      // Create audio context for backup
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: this.isMobile ? 22050 : 44100
      })
      
      console.log('🎵 AudioContext created, state:', this.audioContext.state)
      
    } catch (error) {
      console.warn('AudioContext failed, using HTML5 audio only:', error)
    }

    // Set up instant user interaction listeners
    this.setupInstantUserInteractionListeners()
    
    this.initialized = true
    console.log('⚡ Sound Manager initialized for INSTANT playback')
  }

  createInstantAudioPool() {
    console.log('⚡ Creating instant audio pool for zero-delay playback')
    
    // Create data URLs for audio - optimized for instant playback
    const createInstantBeepDataURL = (frequency, duration, volume = 0.4) => {
      const sampleRate = 22050 // Higher quality but still mobile-friendly
      const samples = duration * sampleRate
      const buffer = new ArrayBuffer(44 + samples * 2)
      const view = new DataView(buffer)
      
      // WAV header - optimized
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
      
      // Generate crisp audio samples
      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate
        const amplitude = Math.exp(-t * 8) * volume // Faster decay for crispness
        const sample = Math.sin(2 * Math.PI * frequency * t) * amplitude
        const intSample = Math.max(-32767, Math.min(32767, sample * 32767))
        view.setInt16(44 + i * 2, intSample, true)
      }
      
      return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))
    }

    // Crisp, instant sounds
    const sounds = {
      buttonClick: { frequency: 1400, duration: 0.08, volume: 0.5 },
      success: { frequency: 880, duration: 0.25, volume: 0.4 },
      error: { frequency: 350, duration: 0.15, volume: 0.4 },
      hover: { frequency: 1000, duration: 0.04, volume: 0.2 }
    }

    // Create MULTIPLE audio elements per sound for instant switching
    Object.keys(sounds).forEach(soundName => {
      const config = sounds[soundName]
      const dataURL = createInstantBeepDataURL(config.frequency, config.duration, config.volume)
      
      // Create pool of 3 audio elements per sound
      const audioPool = []
      for (let i = 0; i < 3; i++) {
        const audio = new Audio(dataURL)
        audio.preload = 'auto'
        audio.volume = this.isMobile ? 0.7 : 0.5
        
        // Critical: Set properties for instant playback
        audio.load()
        audio.muted = false
        
        audioPool.push(audio)
      }
      
      this.readyAudioPool.set(soundName, audioPool)
      console.log(`⚡ Created instant audio pool for ${soundName} (${audioPool.length} elements)`)
    })

    // Pre-warm all audio elements
    this.preWarmAudioElements()
  }

  preWarmAudioElements() {
    console.log('🔥 Pre-warming audio elements for instant response...')
    
    // Pre-warm each audio pool
    this.readyAudioPool.forEach((audioPool, soundName) => {
      audioPool.forEach((audio, index) => {
        // Set up for instant playback
        audio.currentTime = 0
        audio.load()
        
        // Set up event listeners for cycling
        audio.addEventListener('ended', () => {
          audio.currentTime = 0
          audio.load() // Reload for next use
        })
      })
    })
  }

  setupInstantUserInteractionListeners() {
    // Comprehensive interaction events for instant unlocking
    const events = [
      'touchstart', 'touchend',
      'mousedown', 'click',
      'keydown', 'pointerdown'
    ]
    
    const unlockAudioInstantly = async (event) => {
      if (this.hasUserInteracted) return
      
      console.log('⚡ INSTANT: User interaction detected -', event.type)
      this.hasUserInteracted = true
      
      // INSTANT unlock all audio pools
      this.unlockAllAudioPools()
      
      // Remove listeners immediately
      events.forEach(eventType => {
        document.removeEventListener(eventType, unlockAudioInstantly, { capture: true })
        window.removeEventListener(eventType, unlockAudioInstantly, { capture: true })
      })
    }
    
    // Add listeners for instant detection
    events.forEach(eventType => {
      document.addEventListener(eventType, unlockAudioInstantly, { 
        once: false, 
        passive: true, 
        capture: true 
      })
      window.addEventListener(eventType, unlockAudioInstantly, { 
        once: false, 
        passive: true, 
        capture: true 
      })
    })

    console.log('⚡ Instant interaction listeners activated')
  }

  unlockAllAudioPools() {
    console.log('🔓 Unlocking all audio pools for instant playback...')
    
    this.readyAudioPool.forEach((audioPool, soundName) => {
      audioPool.forEach((audio, index) => {
        try {
          // Unlock each audio element by playing and immediately pausing
          const unlockPromise = audio.play()
          if (unlockPromise) {
            unlockPromise.then(() => {
              audio.pause()
              audio.currentTime = 0
            }).catch(() => {})
          }
        } catch (error) {
          // Silent fail
        }
      })
    })

    // Also unlock AudioContext if available
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {})
    }

    console.log('⚡ All audio pools unlocked and ready for instant playback!')
  }

  // INSTANT playSound - no delays, no awaits where possible
  playSound(soundName, volume = 1) {
    if (!this.isEnabled || !this.initialized) return

    // Skip if already playing (prevent overlaps)
    if (this.currentlyPlaying.has(soundName)) return

    console.log(`⚡ INSTANT play: ${soundName}`)
    this.currentlyPlaying.add(soundName)

    // Get available audio element from pool
    const audioPool = this.readyAudioPool.get(soundName)
    if (audioPool) {
      // Find the first available (not playing) audio element
      const availableAudio = audioPool.find(audio => audio.paused || audio.ended || audio.currentTime === 0)
      
      if (availableAudio) {
        // INSTANT PLAYBACK - no awaits
        try {
          availableAudio.currentTime = 0
          availableAudio.volume = Math.min(1, volume * (this.isMobile ? 0.7 : 0.5))
          
          const playPromise = availableAudio.play()
          
          // Don't await - let it play instantly
          if (playPromise) {
            playPromise.then(() => {
              console.log(`⚡ INSTANT success: ${soundName}`)
            }).catch((error) => {
              console.warn(`Play failed for ${soundName}:`, error)
              this.playInstantFallback(soundName)
            })
          }
          
          // Clean up tracking after sound duration
          setTimeout(() => {
            this.currentlyPlaying.delete(soundName)
          }, availableAudio.duration * 1000 + 50)
          
          return
        } catch (error) {
          console.warn(`Instant playback failed for ${soundName}:`, error)
        }
      }
    }

    // Fallback to vibration if audio fails
    this.playInstantFallback(soundName)
    this.currentlyPlaying.delete(soundName)
  }

  playInstantFallback(soundName) {
    if (this.isMobile && 'vibrate' in navigator) {
      switch (soundName) {
        case 'buttonClick':
          navigator.vibrate(15) // Short, crisp vibration
          break
        case 'success':
          navigator.vibrate([30, 20, 30])
          break
        case 'error':
          navigator.vibrate([80, 40, 80, 40, 80])
          break
        default:
          navigator.vibrate(10)
      }
      console.log(`📳 INSTANT vibration: ${soundName}`)
    }
  }

  async handleUserInteraction() {
    if (!this.hasUserInteracted) {
      this.hasUserInteracted = true
      this.unlockAllAudioPools()
    }
  }

  async forceMobileAudioInit() {
    console.log('⚡ FORCE INSTANT AUDIO INIT')
    this.unlockAllAudioPools()
    
    // Test sound immediately
    setTimeout(() => this.playSound('buttonClick'), 50)
    return true
  }

  setEnabled(enabled) {
    this.isEnabled = enabled
    settingsManager.updateSettings({ soundEnabled: enabled })
    console.log('🔊 Sound enabled set to:', enabled)
    
    // Auto-initialize mobile audio when enabling sound
    if (enabled && this.isMobile) {
      setTimeout(() => this.forceMobileAudioInit(), 50)
    }
  }

  isAudioEnabled() {
    return this.isEnabled
  }

  // INSTANT sound methods - no async to avoid delays
  playButtonClick() {
    this.playSound('buttonClick')
  }

  playButtonHover() {
    if (!this.isMobile) {
      this.playSound('hover', 0.3)
    }
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

// Export INSTANT functions - no async
export const playButtonClick = () => soundManager.playButtonClick()
export const playButtonHover = () => soundManager.playButtonHover()
export const playSuccess = () => soundManager.playSuccess()
export const playError = () => soundManager.playError()
export const setSoundEnabled = (enabled) => soundManager.setEnabled(enabled)
export const isSoundEnabled = () => soundManager.isAudioEnabled()
export const forceMobileAudioInit = () => soundManager.forceMobileAudioInit()
export const resumeAudio = () => soundManager.unlockAllAudioPools()
export const handleUserInteraction = () => soundManager.handleUserInteraction()

export default soundManager 