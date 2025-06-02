// ULTRA-SIMPLE sound system - ONLY ONE CLICK SOUND
import { settingsManager } from './localStorage'
import { isMobileDevice } from './mobileUtils'

// Global variables for SINGLE sound management
let AUDIO_ELEMENT = null
let IS_PLAYING = false
let LAST_PLAY_TIME = 0
let IS_ENABLED = false
let USER_INTERACTED = false

// ONLY ONE sound file
const SOUND_FILE = '/assets/ui-pop-sound-316482.mp3'
const MIN_INTERVAL = 300 // Minimum 300ms between clicks

// Initialize the sound system
function initializeSound() {
  try {
    const settings = settingsManager.getSettings()
    IS_ENABLED = settings.soundEnabled || false
    
    if (IS_ENABLED) {
      createSingleAudioElement()
      setupUserInteractionListener()
    }
  } catch (error) {
    console.warn('Sound init failed:', error)
    IS_ENABLED = false
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
    AUDIO_ELEMENT.volume = 0.3 // Quiet volume
    AUDIO_ELEMENT.preload = 'none'
    AUDIO_ELEMENT.muted = true
    
    // Simple event handlers
    AUDIO_ELEMENT.addEventListener('ended', () => {
      IS_PLAYING = false
    }, { passive: true })
    
    AUDIO_ELEMENT.addEventListener('error', () => {
      IS_PLAYING = false
    }, { passive: true })
    
    AUDIO_ELEMENT.addEventListener('pause', () => {
      IS_PLAYING = false
    }, { passive: true })
    
  } catch (error) {
    console.warn('Audio creation failed:', error)
    AUDIO_ELEMENT = null
    IS_ENABLED = false
  }
}

// Setup user interaction listener
function setupUserInteractionListener() {
  const unlock = () => {
    if (USER_INTERACTED) return
    USER_INTERACTED = true
    
    try {
      if (AUDIO_ELEMENT) {
        AUDIO_ELEMENT.muted = false
        AUDIO_ELEMENT.preload = 'auto'
      }
    } catch (e) {
      console.warn('Audio unlock failed:', e)
    }
    
    // Remove listeners
    document.removeEventListener('touchstart', unlock, true)
    document.removeEventListener('click', unlock, true)
  }
  
  document.addEventListener('touchstart', unlock, { once: true, passive: true, capture: true })
  document.addEventListener('click', unlock, { once: true, passive: true, capture: true })
}

// ONLY ONE sound method - simple click
function playClickSound() {
  const now = Date.now()
  
  // Simple checks
  if (!IS_ENABLED) return
  if (!USER_INTERACTED) return
  if (IS_PLAYING) return
  if (!AUDIO_ELEMENT) return
  if (now - LAST_PLAY_TIME < MIN_INTERVAL) return
  
  try {
    // Check if audio is ready
    if (AUDIO_ELEMENT.readyState < 2) return
    
    IS_PLAYING = true
    LAST_PLAY_TIME = now
    
    // Stop and reset
    AUDIO_ELEMENT.pause()
    AUDIO_ELEMENT.currentTime = 0
    
    // Play the sound
    const playPromise = AUDIO_ELEMENT.play()
    
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => {
        IS_PLAYING = false
        // Fallback vibration on mobile
        if (isMobileDevice() && navigator.vibrate) {
          try {
            navigator.vibrate(20)
          } catch (e) {}
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
    if (isMobileDevice() && navigator.vibrate) {
      try {
        navigator.vibrate(20)
      } catch (e) {}
    }
  }
}

// Enable/disable sound
function setAudioEnabled(enabled) {
  try {
    IS_ENABLED = enabled
    settingsManager.updateSettings({ soundEnabled: enabled })
    
    if (enabled && !AUDIO_ELEMENT) {
      createSingleAudioElement()
      setupUserInteractionListener()
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

// Handle user interaction
function handleInteraction() {
  if (!USER_INTERACTED) {
    USER_INTERACTED = true
    try {
      if (AUDIO_ELEMENT) {
        AUDIO_ELEMENT.muted = false
        AUDIO_ELEMENT.preload = 'auto'
      }
    } catch (e) {
      console.warn('User interaction error:', e)
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
    IS_PLAYING = false
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