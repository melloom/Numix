// Mobile-optimized sound system for PWA - ensures sound works on mobile
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
    this.isUnlocking = false
    this.clickCount = 0
    this.isAudioUnlocked = false
    
    // Use the specific sound file
    this.soundFile = '/assets/ui-pop-sound-316482.mp3'
    
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
    // Create more audio elements for mobile reliability
    const audioCount = this.isMobile ? 15 : 10
    
    for (let i = 0; i < audioCount; i++) {
      const audio = new Audio()
      audio.src = this.soundFile
      audio.volume = 0.8
      audio.preload = 'auto'
      audio.muted = false
      
      // Mobile-specific audio settings
      if (this.isMobile) {
        audio.playsInline = true
        audio.controls = false
        audio.autoplay = false
      }
      
      // Add error handling
      audio.addEventListener('error', (e) => {
        console.warn(`Audio ${i} error:`, e)
        setTimeout(() => this.recreateAudioElement(i), 100)
      })
      
      // Add loaded event
      audio.addEventListener('canplaythrough', () => {
        console.log(`Audio ${i} ready`)
      })
      
      // Reset audio when it ends
      audio.addEventListener('ended', () => {
        audio.currentTime = 0
      })
      
      // Load the audio
      audio.load()
      
      this.audioElements.push(audio)
    }

    // Create Web Audio context for better control
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      console.log('Audio context created:', this.audioContext.state)
    } catch (e) {
      console.warn('Web Audio API not supported')
    }
  }

  recreateAudioElement(index) {
    if (index >= 0 && index < this.audioElements.length) {
      const audio = new Audio()
      audio.src = this.soundFile
      audio.volume = 0.8
      audio.preload = 'auto'
      audio.muted = false
      
      if (this.isMobile) {
        audio.playsInline = true
        audio.controls = false
        audio.autoplay = false
      }
      
      audio.addEventListener('error', (e) => {
        console.warn(`Recreated audio ${index} error:`, e)
        setTimeout(() => this.recreateAudioElement(index), 100)
      })
      
      audio.addEventListener('ended', () => {
        audio.currentTime = 0
      })
      
      audio.load()
      this.audioElements[index] = audio
    }
  }

  setupInteractionListeners() {
    const events = ['touchstart', 'touchend', 'click', 'mousedown', 'pointerdown']
    
    const unlock = async () => {
      if (this.hasUserInteracted || this.isUnlocking) return
      this.hasUserInteracted = true
      this.isUnlocking = true
      
      console.log('Unlocking audio on mobile...')
      
      // Resume audio context if available
      if (this.audioContext && this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume()
          console.log('Audio context resumed:', this.audioContext.state)
        } catch (e) {
          console.warn('Failed to resume audio context:', e)
        }
      }
      
      // Aggressive audio unlocking - try to play all audio elements
      const unlockPromises = this.audioElements.map(async (audio, index) => {
        try {
          audio.muted = true
          audio.volume = 0
          await audio.play()
          audio.pause()
          audio.currentTime = 0
          audio.muted = false
          audio.volume = 0.8
          console.log(`Audio ${index} unlocked`)
        } catch (e) {
          console.warn(`Failed to unlock audio ${index}:`, e)
        }
      })
      
      await Promise.allSettled(unlockPromises)
      
      this.isAudioUnlocked = true
      console.log('All audio elements processed for unlock')
      
      // Set unlocking to false after a short delay
      setTimeout(() => {
        this.isUnlocking = false
      }, 200)
      
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
    if (!this.isEnabled || !this.initialized || this.isUnlocking) return
    
    this.clickCount++
    
    // Force audio context resume on every play for mobile
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
    
    // Reset all audio elements every 15 clicks for mobile
    const resetInterval = this.isMobile ? 15 : 20
    if (this.clickCount % resetInterval === 0) {
      this.resetAllAudio()
    }
    
    // Try multiple audio elements aggressively
    let attempts = 0
    let played = false
    const maxAttempts = this.isMobile ? 5 : 3
    
    while (!played && attempts < maxAttempts) {
      const audio = this.audioElements[this.currentIndex]
      this.currentIndex = (this.currentIndex + 1) % this.audioElements.length
      
      if (audio) {
        try {
          // For mobile, be more aggressive
          if (this.isMobile) {
            audio.muted = false
            audio.volume = 0.8
          }
          
          // Stop and reset current audio
          audio.pause()
          audio.currentTime = 0
          
          // Play immediately with promise handling
          const playPromise = audio.play()
          if (playPromise) {
            playPromise.then(() => {
              played = true
              console.log(`Sound played successfully with audio ${this.currentIndex - 1}`)
            }).catch((e) => {
              console.warn(`Audio ${this.currentIndex - 1} play failed:`, e)
              attempts++
            })
          } else {
            played = true
          }
        } catch (e) {
          console.warn(`Audio ${this.currentIndex - 1} error:`, e)
          attempts++
        }
      } else {
        attempts++
      }
    }
    
    // If all attempts failed, recreate audio elements
    if (!played) {
      console.warn('All audio play attempts failed, recreating elements')
      setTimeout(() => this.recreateAllAudio(), 50)
    }
    
    // Always vibrate on mobile as feedback
    if (this.isMobile && navigator.vibrate) {
      try {
        navigator.vibrate([8])
      } catch (e) {
        console.warn('Vibration failed:', e)
      }
    }
  }

  resetAllAudio() {
    console.log('Resetting all audio elements')
    this.audioElements.forEach((audio, index) => {
      try {
        audio.pause()
        audio.currentTime = 0
        if (this.isMobile) {
          audio.muted = false
          audio.volume = 0.8
        }
        audio.load()
      } catch (e) {
        console.warn(`Failed to reset audio ${index}:`, e)
      }
    })
  }

  recreateAllAudio() {
    console.log('Recreating all audio elements')
    // Recreate all audio elements if they get stuck
    for (let i = 0; i < this.audioElements.length; i++) {
      this.recreateAudioElement(i)
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
      
      // Test sound only if not unlocking
      if (!this.isUnlocking) {
        setTimeout(() => this.playSound(), 200)
      }
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
    if (!this.hasUserInteracted && !this.isUnlocking) {
      console.log('Manual user interaction triggered')
      this.hasUserInteracted = true
      this.isUnlocking = true
      
      // Resume audio context if suspended
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }
      
      // Force unlock a test audio
      if (this.audioElements.length > 0) {
        const testAudio = this.audioElements[0]
        testAudio.muted = true
        testAudio.play().then(() => {
          testAudio.pause()
          testAudio.currentTime = 0
          testAudio.muted = false
          console.log('Manual audio unlock successful')
        }).catch(e => {
          console.warn('Manual audio unlock failed:', e)
        })
      }
      
      // Set unlocking to false after a short delay
      setTimeout(() => {
        this.isUnlocking = false
      }, 200)
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