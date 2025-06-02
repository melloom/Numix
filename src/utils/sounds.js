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
    
    // Simple beep sound generation
    const createSimpleBeep = (frequency, duration) => {
      console.log(`Creating beep: ${frequency}Hz, ${duration}s`)
      
      try {
        // Use a very simple approach - Base64 encoded short beep
        const sampleRate = 22050
        const samples = Math.floor(duration * sampleRate)
        const buffer = new ArrayBuffer(44 + samples * 2)
        const view = new DataView(buffer)
        
        // Write WAV header
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
        
        // Generate simple sine wave
        for (let i = 0; i < samples; i++) {
          const t = i / sampleRate
          const amplitude = Math.exp(-t * 10) * 0.3
          const sample = Math.sin(2 * Math.PI * frequency * t) * amplitude
          const intSample = Math.max(-32767, Math.min(32767, sample * 32767))
          view.setInt16(44 + i * 2, intSample, true)
        }
        
        const blob = new Blob([buffer], { type: 'audio/wav' })
        const url = URL.createObjectURL(blob)
        console.log(`Generated WAV URL: ${url.substring(0, 50)}...`)
        return url
        
      } catch (error) {
        console.error('Failed to create audio:', error)
        return null
      }
    }

    // Very short, clear sounds
    const sounds = {
      click: { freq: 1000, duration: 0.1 },
      success: { freq: 660, duration: 0.2 },
      error: { freq: 220, duration: 0.15 }
    }

    // Create audio elements
    Object.keys(sounds).forEach(name => {
      const config = sounds[name]
      const dataURL = createSimpleBeep(config.freq, config.duration)
      
      if (dataURL) {
        const audio = new Audio()
        audio.src = dataURL
        audio.volume = this.isMobile ? 0.7 : 0.5
        audio.preload = 'auto'
        
        // Set up event listeners for debugging
        audio.addEventListener('loadstart', () => console.log(`${name}: loadstart`))
        audio.addEventListener('loadeddata', () => console.log(`${name}: loadeddata`))
        audio.addEventListener('canplay', () => console.log(`${name}: canplay`))
        audio.addEventListener('error', (e) => console.error(`${name}: error`, e))
        
        audio.addEventListener('ended', () => {
          console.log(`${name}: ended`)
          audio.currentTime = 0
          this.isPlaying.delete(name)
        })
        
        // Force load
        audio.load()
        
        this.audioElements.set(name, audio)
        console.log(`✅ Created audio element for ${name}`)
      } else {
        console.error(`❌ Failed to create audio for ${name}`)
      }
    })
    
    console.log(`Audio elements created: ${this.audioElements.size}`)
  }

  setupFastInteractionListeners() {
    console.log('🎯 Setting up interaction listeners...')
    
    const events = ['touchstart', 'click', 'mousedown', 'keydown']
    
    const unlock = (event) => {
      if (this.hasUserInteracted) return
      
      console.log(`⚡ User interaction detected: ${event.type}`)
      this.hasUserInteracted = true
      
      // Try to unlock each audio element
      this.audioElements.forEach((audio, name) => {
        console.log(`Unlocking audio: ${name}`)
        try {
          const playPromise = audio.play()
          if (playPromise) {
            playPromise.then(() => {
              console.log(`${name}: unlocked successfully`)
              audio.pause()
              audio.currentTime = 0
            }).catch((error) => {
              console.warn(`${name}: unlock failed`, error)
            })
          }
        } catch (error) {
          console.error(`${name}: unlock error`, error)
        }
      })
      
      // Remove listeners after first interaction
      events.forEach(eventType => {
        document.removeEventListener(eventType, unlock, true)
      })
      
      console.log('🔓 Audio unlock attempt completed!')
    }
    
    // Add listeners
    events.forEach(eventType => {
      document.addEventListener(eventType, unlock, { 
        once: false, 
        passive: true, 
        capture: true 
      })
    })
    
    console.log('📡 Interaction listeners active')
  }

  // Simple, fast play method
  playFast(soundName) {
    console.log(`🔊 Attempting to play: ${soundName}`)
    
    if (!this.isEnabled) {
      console.log('❌ Sound disabled')
      return
    }
    
    if (!this.initialized) {
      console.log('❌ Not initialized')
      return
    }
    
    const audio = this.audioElements.get(soundName)
    if (!audio) {
      console.log(`❌ No audio element for: ${soundName}`)
      return
    }
    
    if (this.isPlaying.has(soundName)) {
      console.log(`⏸️ Already playing: ${soundName}`)
      return
    }
    
    console.log(`▶️ Playing: ${soundName}`)
    this.isPlaying.add(soundName)
    
    try {
      audio.currentTime = 0
      const playPromise = audio.play()
      
      if (playPromise) {
        playPromise.then(() => {
          console.log(`✅ Successfully playing: ${soundName}`)
        }).catch((error) => {
          console.warn(`❌ Play failed for ${soundName}:`, error)
          this.playFallback(soundName)
          this.isPlaying.delete(soundName)
        })
      }
    } catch (error) {
      console.error(`❌ Play error for ${soundName}:`, error)
      this.playFallback(soundName)
      this.isPlaying.delete(soundName)
    }
  }

  playFallback(soundName) {
    console.log(`📳 Fallback for: ${soundName}`)
    if (this.isMobile && navigator.vibrate) {
      const pattern = soundName === 'click' ? 10 : soundName === 'success' ? [30, 20, 30] : [50, 30, 50]
      navigator.vibrate(pattern)
      console.log(`📳 Vibrated: ${pattern}`)
    }
  }

  setEnabled(enabled) {
    console.log(`🔊 Setting sound enabled: ${enabled}`)
    this.isEnabled = enabled
    settingsManager.updateSettings({ soundEnabled: enabled })
    
    if (enabled && this.isMobile) {
      // Test sound
      setTimeout(() => {
        console.log('🧪 Testing sound...')
        this.playFast('click')
      }, 500)
    }
  }

  isAudioEnabled() {
    return this.isEnabled
  }

  // Simple sound methods
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
      console.log('🤝 Handling user interaction...')
      this.hasUserInteracted = true
    }
  }
}

// Create singleton
const soundManager = new SoundManager()

// Export functions with debugging
export const playButtonClick = () => {
  console.log('🖱️ Button click requested')
  soundManager.playClick()
}

export const playButtonHover = () => {} // Disabled for speed

export const playSuccess = () => {
  console.log('✅ Success sound requested')
  soundManager.playSuccess()
}

export const playError = () => {
  console.log('❌ Error sound requested')
  soundManager.playError()
}

export const setSoundEnabled = (enabled) => soundManager.setEnabled(enabled)
export const isSoundEnabled = () => soundManager.isAudioEnabled()
export const handleUserInteraction = () => soundManager.handleUserInteraction()
export const resumeAudio = () => soundManager.handleUserInteraction()
export const forceMobileAudioInit = () => soundManager.handleUserInteraction()

export default soundManager 