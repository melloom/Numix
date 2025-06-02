// Safe mobile sound system - no auto-play, crash-resistant
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
    this.initializationComplete = false
    
    // Use the specific sound file
    this.soundFile = '/assets/ui-pop-sound-316482.mp3'
    
    // Initialize safely
    this.safeInit()
  }

  safeInit() {
    try {
      const settings = settingsManager.getSettings()
      this.isEnabled = settings.soundEnabled
      
      if (!this.isEnabled) {
        this.initialized = true
        this.initializationComplete = true
        return
      }

      // Create audio elements safely
      this.createAudio()
      this.setupInteractionListeners()
      
      this.initialized = true
      this.initializationComplete = true
    } catch (error) {
      console.warn('Sound initialization failed safely:', error)
      this.initialized = false
      this.initializationComplete = true
      this.isEnabled = false
    }
  }

  createAudio() {
    try {
      // Create audio elements but don't auto-play anything
      const audioCount = this.isMobile ? 10 : 8 // Reduced count for stability
      
      for (let i = 0; i < audioCount; i++) {
        try {
          const audio = new Audio()
          audio.src = this.soundFile
          audio.volume = 0.8
          audio.preload = 'none' // Changed to 'none' to prevent auto-loading
          audio.muted = true // Start muted to prevent accidental playback
          
          // Mobile-specific audio settings
          if (this.isMobile) {
            audio.playsInline = true
            audio.controls = false
            audio.autoplay = false
          }
          
          // Add error handling that won't crash
          audio.addEventListener('error', (e) => {
            console.warn(`Audio ${i} error (non-critical):`, e.message)
            // Don't recreate on error during init to prevent loops
          })
          
          // Reset audio when it ends
          audio.addEventListener('ended', () => {
            try {
              audio.currentTime = 0
            } catch (e) {
              console.warn('Audio reset error (ignored):', e)
            }
          })
          
          this.audioElements.push(audio)
        } catch (error) {
          console.warn(`Failed to create audio element ${i} (continuing):`, error)
          // Continue with other audio elements even if one fails
        }
      }

      // Create Web Audio context safely
      try {
        if (window.AudioContext || window.webkitAudioContext) {
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
        }
      } catch (e) {
        console.warn('Web Audio API not available (continuing without it)')
      }
    } catch (error) {
      console.warn('Audio creation failed (continuing without audio):', error)
      this.audioElements = []
    }
  }

  recreateAudioElement(index) {
    try {
      if (index >= 0 && index < this.audioElements.length) {
        const audio = new Audio()
        audio.src = this.soundFile
        audio.volume = 0.8
        audio.preload = 'none'
        audio.muted = true
        
        if (this.isMobile) {
          audio.playsInline = true
          audio.controls = false
          audio.autoplay = false
        }
        
        audio.addEventListener('error', (e) => {
          console.warn(`Recreated audio ${index} error (ignored):`, e)
        })
        
        audio.addEventListener('ended', () => {
          try {
            audio.currentTime = 0
          } catch (e) {
            // Ignore reset errors
          }
        })
        
        this.audioElements[index] = audio
      }
    } catch (error) {
      console.warn(`Failed to recreate audio ${index} (ignored):`, error)
    }
  }

  setupInteractionListeners() {
    try {
      const events = ['touchstart', 'click', 'mousedown']
      
      const unlock = async () => {
        try {
          if (this.hasUserInteracted || this.isUnlocking) return
          this.hasUserInteracted = true
          this.isUnlocking = true
          
          // Resume audio context safely
          if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
              await this.audioContext.resume()
            } catch (e) {
              console.warn('Audio context resume failed (ignored):', e)
            }
          }
          
          // Silent unlock - no actual sound playback during unlock
          const unlockPromises = this.audioElements.map(async (audio, index) => {
            try {
              // Prepare audio for future use without playing sound
              audio.muted = true
              audio.volume = 0
              audio.preload = 'auto' // Now safe to preload after user interaction
              
              // Try silent play/pause to unlock (no sound will be heard)
              const playPromise = audio.play()
              if (playPromise) {
                await playPromise
                audio.pause()
                audio.currentTime = 0
              }
              
              // Prepare for real use
              audio.muted = false
              audio.volume = 0.8
            } catch (e) {
              // Ignore unlock failures for individual elements
              console.warn(`Audio ${index} unlock failed (ignored):`, e)
            }
          })
          
          await Promise.allSettled(unlockPromises)
          this.isAudioUnlocked = true
          
          // Set unlocking to false after delay
          setTimeout(() => {
            this.isUnlocking = false
          }, 200)
          
          // Remove listeners
          events.forEach(eventType => {
            document.removeEventListener(eventType, unlock, true)
          })
        } catch (error) {
          console.warn('Audio unlock process failed (ignored):', error)
          this.isUnlocking = false
        }
      }
      
      // Add listeners safely
      events.forEach(eventType => {
        try {
          document.addEventListener(eventType, unlock, { 
            once: false, 
            passive: true, 
            capture: true 
          })
        } catch (e) {
          console.warn(`Failed to add ${eventType} listener (ignored):`, e)
        }
      })
    } catch (error) {
      console.warn('Failed to setup interaction listeners (ignored):', error)
    }
  }

  playSound() {
    // Only play if fully initialized and user has interacted
    if (!this.isEnabled || !this.initialized || !this.initializationComplete || this.isUnlocking) {
      return
    }
    
    // Don't play if no user interaction yet
    if (!this.hasUserInteracted) {
      return
    }
    
    try {
      this.clickCount++
      
      // Force audio context resume safely
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(e => {
          console.warn('Audio context resume failed (ignored):', e)
        })
      }
      
      // Reset periodically but safely
      const resetInterval = this.isMobile ? 15 : 20
      if (this.clickCount % resetInterval === 0) {
        this.resetAllAudio()
      }
      
      // Try to play sound with multiple fallbacks
      let attempts = 0
      let played = false
      const maxAttempts = 3 // Reduced for stability
      
      while (!played && attempts < maxAttempts && this.audioElements.length > 0) {
        try {
          const audio = this.audioElements[this.currentIndex]
          this.currentIndex = (this.currentIndex + 1) % this.audioElements.length
          
          if (audio) {
            // Ensure audio is ready
            if (this.isMobile) {
              audio.muted = false
              audio.volume = 0.8
            }
            
            // Stop and reset safely
            try {
              audio.pause()
              audio.currentTime = 0
            } catch (e) {
              // Ignore reset errors
            }
            
            // Play with promise handling
            const playPromise = audio.play()
            if (playPromise) {
              playPromise.then(() => {
                played = true
              }).catch((e) => {
                console.warn(`Audio play failed, trying next (${attempts + 1}/${maxAttempts}):`, e)
                attempts++
              })
            } else {
              played = true
            }
          } else {
            attempts++
          }
        } catch (e) {
          console.warn(`Audio play attempt ${attempts + 1} failed:`, e)
          attempts++
        }
      }
      
      // Vibration feedback (safe fallback)
      if (this.isMobile && navigator.vibrate) {
        try {
          navigator.vibrate([8])
        } catch (e) {
          // Ignore vibration errors
        }
      }
    } catch (error) {
      console.warn('Sound playback failed (ignored):', error)
    }
  }

  resetAllAudio() {
    try {
      this.audioElements.forEach((audio, index) => {
        try {
          audio.pause()
          audio.currentTime = 0
          if (this.isMobile) {
            audio.muted = false
            audio.volume = 0.8
          }
        } catch (e) {
          console.warn(`Failed to reset audio ${index} (ignored):`, e)
        }
      })
    } catch (error) {
      console.warn('Failed to reset all audio (ignored):', error)
    }
  }

  recreateAllAudio() {
    try {
      // Only recreate if user has interacted
      if (!this.hasUserInteracted) return
      
      for (let i = 0; i < this.audioElements.length; i++) {
        this.recreateAudioElement(i)
      }
    } catch (error) {
      console.warn('Failed to recreate all audio (ignored):', error)
    }
  }

  setEnabled(enabled) {
    try {
      this.isEnabled = enabled
      settingsManager.updateSettings({ soundEnabled: enabled })
      
      if (enabled && this.hasUserInteracted) {
        // Resume audio context safely
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(e => {
            console.warn('Audio context resume failed (ignored):', e)
          })
        }
        
        // Test sound only if user has already interacted and not unlocking
        if (!this.isUnlocking) {
          setTimeout(() => this.playSound(), 300)
        }
      }
    } catch (error) {
      console.warn('Failed to set sound enabled (ignored):', error)
    }
  }

  isAudioEnabled() {
    return this.isEnabled && this.initializationComplete
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
      try {
        this.hasUserInteracted = true
        this.isUnlocking = true
        
        // Resume audio context safely
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(e => {
            console.warn('Manual audio context resume failed (ignored):', e)
          })
        }
        
        // Force unlock one test audio without playing sound
        if (this.audioElements.length > 0) {
          const testAudio = this.audioElements[0]
          testAudio.muted = true
          testAudio.play().then(() => {
            testAudio.pause()
            testAudio.currentTime = 0
            testAudio.muted = false
          }).catch(e => {
            console.warn('Manual audio unlock failed (ignored):', e)
          })
        }
        
        setTimeout(() => {
          this.isUnlocking = false
        }, 200)
      } catch (error) {
        console.warn('Manual user interaction failed (ignored):', error)
        this.isUnlocking = false
      }
    }
  }
}

// Create singleton safely
let soundManager
try {
  soundManager = new SoundManager()
} catch (error) {
  console.warn('SoundManager creation failed, creating fallback:', error)
  soundManager = {
    playClick: () => {},
    playSuccess: () => {},
    playError: () => {},
    setEnabled: () => {},
    isAudioEnabled: () => false,
    handleUserInteraction: () => {}
  }
}

// Export functions with fallbacks
export const playButtonClick = () => {
  try {
    soundManager.playClick()
  } catch (e) {
    console.warn('playButtonClick failed (ignored):', e)
  }
}

export const playButtonHover = () => {} // Disabled for speed

export const playSuccess = () => {
  try {
    soundManager.playSuccess()
  } catch (e) {
    console.warn('playSuccess failed (ignored):', e)
  }
}

export const playError = () => {
  try {
    soundManager.playError()
  } catch (e) {
    console.warn('playError failed (ignored):', e)
  }
}

export const setSoundEnabled = (enabled) => {
  try {
    soundManager.setEnabled(enabled)
  } catch (e) {
    console.warn('setSoundEnabled failed (ignored):', e)
  }
}

export const isSoundEnabled = () => {
  try {
    return soundManager.isAudioEnabled()
  } catch (e) {
    console.warn('isSoundEnabled failed (ignored):', e)
    return false
  }
}

export const handleUserInteraction = () => {
  try {
    soundManager.handleUserInteraction()
  } catch (e) {
    console.warn('handleUserInteraction failed (ignored):', e)
  }
}

export const resumeAudio = () => {
  try {
    soundManager.handleUserInteraction()
  } catch (e) {
    console.warn('resumeAudio failed (ignored):', e)
  }
}

export const forceMobileAudioInit = () => {
  try {
    soundManager.handleUserInteraction()
  } catch (e) {
    console.warn('forceMobileAudioInit failed (ignored):', e)
  }
}

export default soundManager 