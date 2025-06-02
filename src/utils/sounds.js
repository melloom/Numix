// ULTRA-SIMPLE sound system - ONLY ONE CLICK SOUND with AGGRESSIVE MOBILE SUPPORT
import { settingsManager } from './localStorage'
import { isMobileDevice } from './mobileUtils'

// Global variables for SINGLE sound management
let AUDIO_ELEMENT = null
let IS_PLAYING = false
let LAST_PLAY_TIME = 0
let IS_ENABLED = false
let USER_INTERACTED = false
let IS_MOBILE = false
let AUDIO_CONTEXT = null

// ONLY ONE sound file
const SOUND_FILE = '/assets/ui-pop-sound-316482.mp3'
const MIN_INTERVAL = 300 // Minimum 300ms between clicks

// Initialize the sound system
function initializeSound() {
  try {
    IS_MOBILE = isMobileDevice()
    const settings = settingsManager.getSettings()
    IS_ENABLED = settings.soundEnabled || false
    
    console.log('Sound system initializing...', { IS_ENABLED, IS_MOBILE })
    
    if (IS_ENABLED) {
      createSingleAudioElement()
      setupUserInteractionListener()
      
      // For mobile, also try to create audio context
      if (IS_MOBILE) {
        setupMobileAudioContext()
      }
    }
  } catch (error) {
    console.warn('Sound init failed:', error)
    IS_ENABLED = false
  }
}

// Create audio context for mobile
function setupMobileAudioContext() {
  try {
    if (window.AudioContext || window.webkitAudioContext) {
      AUDIO_CONTEXT = new (window.AudioContext || window.webkitAudioContext)()
      console.log('Audio context created for mobile')
    }
  } catch (error) {
    console.warn('Audio context creation failed:', error)
  }
}

// Create ONLY ONE audio element
function createSingleAudioElement() {
  try {
    // Destroy any existing audio
    if (AUDIO_ELEMENT) {
      AUDIO_ELEMENT.pause()
      AUDIO_ELEMENT.src = ''
      AUDIO_ELEMENT = null
    }
    
    // Reset state
    IS_PLAYING = false
    
    // Create single audio element
    AUDIO_ELEMENT = new Audio()
    AUDIO_ELEMENT.src = SOUND_FILE
    AUDIO_ELEMENT.volume = IS_MOBILE ? 0.5 : 0.3 // Slightly louder on mobile
    AUDIO_ELEMENT.preload = IS_MOBILE ? 'auto' : 'none' // Preload on mobile
    AUDIO_ELEMENT.muted = true // Start muted until user interaction
    
    // Mobile-specific attributes
    if (IS_MOBILE) {
      AUDIO_ELEMENT.setAttribute('playsinline', true)
      AUDIO_ELEMENT.setAttribute('webkit-playsinline', true)
    }
    
    // Simple event handlers
    AUDIO_ELEMENT.addEventListener('ended', () => {
      IS_PLAYING = false
      console.log('Audio ended')
    }, { passive: true })
    
    AUDIO_ELEMENT.addEventListener('error', (e) => {
      IS_PLAYING = false
      console.warn('Audio error:', e)
    }, { passive: true })
    
    AUDIO_ELEMENT.addEventListener('pause', () => {
      IS_PLAYING = false
    }, { passive: true })
    
    AUDIO_ELEMENT.addEventListener('canplaythrough', () => {
      console.log('Audio can play through')
    }, { passive: true })
    
    console.log('Audio element created:', { src: AUDIO_ELEMENT.src, volume: AUDIO_ELEMENT.volume })
    
  } catch (error) {
    console.warn('Audio creation failed:', error)
    AUDIO_ELEMENT = null
    IS_ENABLED = false
  }
}

// Setup user interaction listener with multiple triggers
function setupUserInteractionListener() {
  const unlock = async (event) => {
    if (USER_INTERACTED) return
    
    console.log('User interaction detected:', event.type)
    USER_INTERACTED = true
    
    try {
      // Resume audio context first (mobile requirement)
      if (AUDIO_CONTEXT && AUDIO_CONTEXT.state === 'suspended') {
        await AUDIO_CONTEXT.resume()
        console.log('Audio context resumed')
      }
      
      if (AUDIO_ELEMENT) {
        AUDIO_ELEMENT.muted = false
        AUDIO_ELEMENT.preload = 'auto'
        
        // Force load the audio on mobile
        if (IS_MOBILE) {
          try {
            await AUDIO_ELEMENT.load()
            console.log('Audio loaded for mobile')
          } catch (loadError) {
            console.warn('Audio load failed:', loadError)
          }
        }
        
        console.log('Audio unlocked successfully')
      }
    } catch (e) {
      console.warn('Audio unlock failed:', e)
    }
    
    // Remove ALL event listeners
    const events = ['touchstart', 'touchend', 'click', 'mousedown', 'keydown']
    events.forEach(eventType => {
      document.removeEventListener(eventType, unlock, true)
    })
  }
  
  // Listen for multiple types of user interaction
  const events = ['touchstart', 'touchend', 'click', 'mousedown', 'keydown']
  events.forEach(eventType => {
    document.addEventListener(eventType, unlock, { once: true, passive: true, capture: true })
  })
  
  console.log('User interaction listeners set up')
}

// ONLY ONE sound method - simple click
function playClickSound() {
  const now = Date.now()
  
  console.log('Play sound attempt:', { 
    IS_ENABLED, 
    USER_INTERACTED, 
    IS_PLAYING, 
    hasAudio: !!AUDIO_ELEMENT,
    timeSinceLastPlay: now - LAST_PLAY_TIME 
  })
  
  // Simple checks
  if (!IS_ENABLED) {
    console.log('Sound disabled')
    return
  }
  if (!USER_INTERACTED) {
    console.log('No user interaction yet')
    // Force vibration as feedback
    if (IS_MOBILE && navigator.vibrate) {
      navigator.vibrate(30)
    }
    return
  }
  if (IS_PLAYING) {
    console.log('Already playing')
    return
  }
  if (!AUDIO_ELEMENT) {
    console.log('No audio element')
    return
  }
  if (now - LAST_PLAY_TIME < MIN_INTERVAL) {
    console.log('Too soon after last play')
    return
  }
  
  try {
    // Check if audio is ready
    if (AUDIO_ELEMENT.readyState < 2) {
      console.log('Audio not ready, readyState:', AUDIO_ELEMENT.readyState)
      // Force vibration on mobile as fallback
      if (IS_MOBILE && navigator.vibrate) {
        navigator.vibrate(30)
      }
      return
    }
    
    IS_PLAYING = true
    LAST_PLAY_TIME = now
    
    console.log('Playing sound...')
    
    // Stop and reset
    AUDIO_ELEMENT.pause()
    AUDIO_ELEMENT.currentTime = 0
    
    // Play the sound
    const playPromise = AUDIO_ELEMENT.play()
    
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(() => {
        console.log('Sound played successfully')
      }).catch((error) => {
        console.warn('Play promise failed:', error)
        IS_PLAYING = false
        // Fallback vibration on mobile
        if (IS_MOBILE && navigator.vibrate) {
          navigator.vibrate(30)
        }
      })
    }
    
    // Auto-reset after 1 second
    setTimeout(() => {
      IS_PLAYING = false
    }, 1000)
    
  } catch (error) {
    console.warn('Play sound failed:', error)
    IS_PLAYING = false
    
    // Fallback vibration on mobile
    if (IS_MOBILE && navigator.vibrate) {
      try {
        navigator.vibrate(30)
      } catch (e) {
        console.warn('Vibration failed:', e)
      }
    }
  }
}

// Enable/disable sound
function setAudioEnabled(enabled) {
  try {
    IS_ENABLED = enabled
    settingsManager.updateSettings({ soundEnabled: enabled })
    
    console.log('Sound enabled set to:', enabled)
    
    if (enabled && !AUDIO_ELEMENT) {
      createSingleAudioElement()
      setupUserInteractionListener()
      if (IS_MOBILE) {
        setupMobileAudioContext()
      }
    } else if (!enabled) {
      stopSound()
    }
} catch (error) {
    console.warn('Set sound enabled failed:', error)
  }
}

// Check if sound is enabled
function checkSoundEnabled() {
  return IS_ENABLED && AUDIO_ELEMENT !== null
}

// Handle user interaction - more aggressive for mobile
function handleInteraction() {
  if (!USER_INTERACTED) {
    console.log('Handling user interaction manually')
    USER_INTERACTED = true
    
    try {
      // Resume audio context for mobile
      if (AUDIO_CONTEXT && AUDIO_CONTEXT.state === 'suspended') {
        AUDIO_CONTEXT.resume().then(() => {
          console.log('Audio context resumed manually')
        }).catch(e => {
          console.warn('Audio context resume failed:', e)
        })
      }
      
      if (AUDIO_ELEMENT) {
        AUDIO_ELEMENT.muted = false
        AUDIO_ELEMENT.preload = 'auto'
        
        // Force load on mobile
        if (IS_MOBILE) {
          AUDIO_ELEMENT.load()
        }
        
        console.log('Audio manually unlocked')
      }
    } catch (e) {
      console.warn('Manual user interaction handling failed:', e)
    }
  }
}

// Stop sound
function stopSound() {
  try {
    if (AUDIO_ELEMENT) {
      AUDIO_ELEMENT.pause()
      AUDIO_ELEMENT.currentTime = 0
    }
    IS_PLAYING = false
  } catch (e) {
    console.warn('Stop sound failed:', e)
  }
}

// Emergency stop - completely destroy audio
function emergencyStop() {
  try {
    if (AUDIO_ELEMENT) {
      AUDIO_ELEMENT.pause()
      AUDIO_ELEMENT.currentTime = 0
      AUDIO_ELEMENT.src = ''
      AUDIO_ELEMENT = null
    }
    if (AUDIO_CONTEXT) {
      AUDIO_CONTEXT.close()
      AUDIO_CONTEXT = null
    }
    IS_PLAYING = false
    USER_INTERACTED = false
    console.log('Emergency stop completed')
  } catch (e) {
    console.warn('Emergency stop failed:', e)
  }
}

// Initialize on import
initializeSound()

// EXPORTS - ONLY the essential ones
export const playButtonClick = playClickSound

// All other sound methods point to the same click sound or do nothing
export const playButtonHover = () => {} // Disabled
export const playSuccess = playClickSound // Same sound
export const playError = playClickSound // Same sound

export const setSoundEnabled = setAudioEnabled
export const isSoundEnabled = checkSoundEnabled
export const handleUserInteraction = handleInteraction
export const resumeAudio = handleInteraction
export const forceMobileAudioInit = handleInteraction
export const stopAllSounds = stopSound
export const emergencyStopAudio = emergencyStop

export default {
  playClick: playClickSound,
  setEnabled: setAudioEnabled,
  isEnabled: checkSoundEnabled,
  stop: stopSound,
  emergencyStop: emergencyStop
} 