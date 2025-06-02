// AUTO-INITIALIZING sound system with ENHANCED ERROR HANDLING
import { settingsManager } from './localStorage'
import { isMobileDevice } from './mobileUtils'

// Global variables for SINGLE sound management
let AUDIO_ELEMENT = null
let BACKUP_AUDIO_ELEMENT = null
let IS_PLAYING = false
let LAST_PLAY_TIME = 0
let IS_ENABLED = false
let USER_INTERACTED = false
let IS_MOBILE = false
let AUDIO_CONTEXT = null
let INITIALIZATION_COMPLETE = false
let AUDIO_FORMAT_SUPPORT = {}

// Multiple sound file formats for compatibility
const SOUND_FILES = [
  '/assets/ui-pop-sound-316482.mp3',  // Primary
  'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEeB0SR3/fMeTUGJXm75N6aPwwVZ8Dw4J9VFQhKp+LwznQsCiaLvdG6aDMQFWy2+OOWWRkNS6/e59KANwwRd8Xs4qlhGQ5IqOPutWQcC1LG5uKwajkPFW6r8M2qaTUPFGm64NWDTRUFXczn2ZWAOgwVUqbezMhvIggVUq7j1L5hLCUDVLXo28d9QQshSqzk1r5uNAsdYbbX4p1dGAsXacDt3qNiFAxQnNz07LdgHAssVq7i1bl8PRAsR6Tk4cV6QhIvVLHg4MZ9SAobUKvczspzLgcKRrTg5MN9SgsiUbLf59KCPwwhRaXh5s+HUwc=', // Backup WAV
]

const MIN_INTERVAL = 300 // Minimum 300ms between clicks

// Check audio format support
function checkAudioSupport() {
  try {
    const audio = new Audio()
    AUDIO_FORMAT_SUPPORT = {
      mp3: audio.canPlayType('audio/mpeg') !== '',
      wav: audio.canPlayType('audio/wav') !== '',
      ogg: audio.canPlayType('audio/ogg') !== '',
      m4a: audio.canPlayType('audio/mp4') !== ''
    }
    console.log('🎵 Audio format support:', AUDIO_FORMAT_SUPPORT)
    return AUDIO_FORMAT_SUPPORT
  } catch (e) {
    console.warn('Audio support check failed:', e)
    return {}
  }
}

// Initialize the sound system IMMEDIATELY when app loads
function initializeSound() {
  try {
    IS_MOBILE = isMobileDevice()
    const settings = settingsManager.getSettings()
    IS_ENABLED = settings.soundEnabled || false
    
    console.log('🎵 Auto-initializing sound system...', { IS_ENABLED, IS_MOBILE })
    
    // Check what audio formats are supported
    checkAudioSupport()
    
    // ALWAYS create audio elements in background, even if disabled
    createAudioElementsInBackground()
    setupUserInteractionListener()
    
    // For mobile, prepare audio context
    if (IS_MOBILE) {
      prepareAudioContextForMobile()
    }
    
    INITIALIZATION_COMPLETE = true
    console.log('🎵 Sound system ready - waiting for user interaction')
    
  } catch (error) {
    console.warn('Sound init failed:', error)
    IS_ENABLED = false
  }
}

// Prepare audio context for mobile (but don't start it yet)
function prepareAudioContextForMobile() {
  try {
    if (window.AudioContext || window.webkitAudioContext) {
      console.log('🎵 Audio context ready to create on user interaction')
    }
  } catch (error) {
    console.warn('Audio context preparation failed:', error)
  }
}

// Create audio elements with multiple format support
function createAudioElementsInBackground() {
  try {
    console.log('🎵 Creating audio elements with format fallbacks...')
    
    // Create primary audio element
    AUDIO_ELEMENT = new Audio()
    AUDIO_ELEMENT.crossOrigin = 'anonymous' // Fix CORS issues
    AUDIO_ELEMENT.volume = IS_MOBILE ? 0.6 : 0.4
    AUDIO_ELEMENT.preload = 'auto'
    AUDIO_ELEMENT.muted = true
    
    // Create backup audio element with data URI
    BACKUP_AUDIO_ELEMENT = new Audio()
    BACKUP_AUDIO_ELEMENT.crossOrigin = 'anonymous'
    BACKUP_AUDIO_ELEMENT.volume = IS_MOBILE ? 0.6 : 0.4
    BACKUP_AUDIO_ELEMENT.preload = 'auto'
    BACKUP_AUDIO_ELEMENT.muted = true
    
    // Mobile-specific attributes for both
    if (IS_MOBILE) {
      [AUDIO_ELEMENT, BACKUP_AUDIO_ELEMENT].forEach(audio => {
        audio.setAttribute('playsinline', true)
        audio.setAttribute('webkit-playsinline', true)
        audio.setAttribute('controls', false)
        audio.setAttribute('autoplay', false)
      })
    }
    
    // Set sources based on format support
    if (AUDIO_FORMAT_SUPPORT.mp3) {
      AUDIO_ELEMENT.src = SOUND_FILES[0] // MP3
      console.log('🎵 Using MP3 format')
    } else {
      console.log('🎵 MP3 not supported, using fallback')
    }
    
    // Always set backup to data URI WAV
    BACKUP_AUDIO_ELEMENT.src = SOUND_FILES[1] // Data URI WAV
    
    // Enhanced event handlers for both audio elements
    const setupAudioEvents = (audio, name) => {
      audio.addEventListener('canplaythrough', () => {
        console.log(`🎵 ${name} ready to play!`)
      }, { passive: true })
      
      audio.addEventListener('loadeddata', () => {
        console.log(`🎵 ${name} data loaded`)
      }, { passive: true })
      
      audio.addEventListener('error', (e) => {
        console.warn(`🎵 ${name} error:`, e.target.error)
        IS_PLAYING = false
      }, { passive: true })
      
      audio.addEventListener('ended', () => {
        IS_PLAYING = false
        console.log(`🎵 ${name} ended`)
      }, { passive: true })
      
      audio.addEventListener('pause', () => {
        IS_PLAYING = false
      }, { passive: true })
      
      // Handle specific mobile errors
      audio.addEventListener('stalled', () => {
        console.warn(`🎵 ${name} stalled`)
      }, { passive: true })
      
      audio.addEventListener('suspend', () => {
        console.warn(`🎵 ${name} suspended`)
      }, { passive: true })
    }
    
    setupAudioEvents(AUDIO_ELEMENT, 'Primary Audio')
    setupAudioEvents(BACKUP_AUDIO_ELEMENT, 'Backup Audio')
    
    // Start loading both audio files
    Promise.all([
      new Promise(resolve => {
        AUDIO_ELEMENT.addEventListener('canplaythrough', resolve, { once: true })
        AUDIO_ELEMENT.load()
      }),
      new Promise(resolve => {
        BACKUP_AUDIO_ELEMENT.addEventListener('canplaythrough', resolve, { once: true })
        BACKUP_AUDIO_ELEMENT.load()
      })
    ]).then(() => {
      console.log('🎵 All audio elements loaded successfully')
    }).catch(e => {
      console.warn('🎵 Some audio elements failed to load:', e)
    })
    
    console.log('🎵 Audio elements created:', { 
      primary: AUDIO_ELEMENT.src, 
      backup: 'data URI WAV',
      volume: AUDIO_ELEMENT.volume
    })
    
  } catch (error) {
    console.warn('Audio creation failed:', error)
    AUDIO_ELEMENT = null
    BACKUP_AUDIO_ELEMENT = null
  }
}

// Enhanced user interaction listener
function setupUserInteractionListener() {
  const unlock = async (event) => {
    if (USER_INTERACTED) return
    
    console.log('🎵 FIRST user interaction detected:', event.type)
    USER_INTERACTED = true
    
    try {
      // Create audio context with error handling
      if (!AUDIO_CONTEXT && (window.AudioContext || window.webkitAudioContext)) {
        try {
          AUDIO_CONTEXT = new (window.AudioContext || window.webkitAudioContext)()
          console.log('🎵 Audio context created:', AUDIO_CONTEXT.state)
        } catch (contextError) {
          console.warn('🎵 Audio context creation failed:', contextError)
        }
      }
      
      // Resume audio context with retry
      if (AUDIO_CONTEXT) {
        try {
          if (AUDIO_CONTEXT.state === 'suspended') {
            await AUDIO_CONTEXT.resume()
            console.log('🎵 Audio context resumed:', AUDIO_CONTEXT.state)
          }
        } catch (resumeError) {
          console.warn('🎵 Audio context resume failed:', resumeError)
        }
      }
      
      // Unmute and prepare both audio elements
      const unlockAudio = async (audio, name) => {
        if (!audio) return false
        
        try {
          audio.muted = false
          
          // Force reload on mobile if needed
          if (IS_MOBILE && audio.readyState < 2) {
            await audio.load()
            console.log(`🎵 ${name} reloaded for mobile`)
          }
          
          return true
        } catch (e) {
          console.warn(`🎵 ${name} unlock failed:`, e)
          return false
        }
      }
      
      const primaryUnlocked = await unlockAudio(AUDIO_ELEMENT, 'Primary')
      const backupUnlocked = await unlockAudio(BACKUP_AUDIO_ELEMENT, 'Backup')
      
      console.log('🎵 Audio unlock status:', { primary: primaryUnlocked, backup: backupUnlocked })
      console.log('🎵 User interaction complete - sound system active!')
      
    } catch (e) {
      console.warn('🎵 User interaction unlock failed:', e)
    }
    
    // Remove event listeners
    const events = ['touchstart', 'touchend', 'click', 'mousedown', 'keydown', 'pointerdown']
    events.forEach(eventType => {
      document.removeEventListener(eventType, unlock, true)
    })
  }
  
  // Listen for ANY type of user interaction
  const events = ['touchstart', 'touchend', 'click', 'mousedown', 'keydown', 'pointerdown']
  events.forEach(eventType => {
    document.addEventListener(eventType, unlock, { once: true, passive: true, capture: true })
  })
  
  console.log('🎵 User interaction listeners active')
}

// Enhanced sound playing with fallbacks
function playClickSound() {
  const now = Date.now()
  
  console.log('🎵 Play sound request:', { 
    IS_ENABLED, 
    USER_INTERACTED, 
    IS_PLAYING, 
    hasAudio: !!AUDIO_ELEMENT,
    hasBackup: !!BACKUP_AUDIO_ELEMENT,
    timeSinceLastPlay: now - LAST_PLAY_TIME,
    audioReady: AUDIO_ELEMENT?.readyState,
    backupReady: BACKUP_AUDIO_ELEMENT?.readyState
  })
  
  // Quick checks
  if (!IS_ENABLED) {
    console.log('🎵 Sound disabled in settings')
    return
  }
  
  if (!INITIALIZATION_COMPLETE) {
    console.log('🎵 Still initializing...')
    return
  }
  
  if (!USER_INTERACTED) {
    console.log('🎵 No user interaction yet - using vibration fallback')
    if (IS_MOBILE && navigator.vibrate) {
      navigator.vibrate(50)
    }
    return
  }
  
  if (IS_PLAYING) {
    console.log('🎵 Already playing')
    return
  }
  
  if (!AUDIO_ELEMENT && !BACKUP_AUDIO_ELEMENT) {
    console.log('🎵 No audio elements available')
    return
  }
  
  if (now - LAST_PLAY_TIME < MIN_INTERVAL) {
    console.log('🎵 Too soon after last play')
    return
  }
  
  // Try playing with fallback strategy
  tryPlayWithFallback()
}

// Enhanced play method with multiple fallbacks
async function tryPlayWithFallback() {
  IS_PLAYING = true
  LAST_PLAY_TIME = Date.now()
  
  // Strategy 1: Try primary audio
  if (AUDIO_ELEMENT) {
    try {
      console.log('🎵 Trying primary audio... (readyState:', AUDIO_ELEMENT.readyState, ')')
      
      AUDIO_ELEMENT.currentTime = 0
      const playPromise = AUDIO_ELEMENT.play()
      
      if (playPromise) {
        await playPromise
        console.log('🎵 Primary audio played successfully!')
        
        // Auto-reset
        setTimeout(() => { IS_PLAYING = false }, 1000)
        return
      }
    } catch (primaryError) {
      console.warn('🎵 Primary audio failed:', primaryError)
    }
  }
  
  // Strategy 2: Try backup audio
  if (BACKUP_AUDIO_ELEMENT) {
    try {
      console.log('🎵 Trying backup audio... (readyState:', BACKUP_AUDIO_ELEMENT.readyState, ')')
      
      BACKUP_AUDIO_ELEMENT.currentTime = 0
      const backupPromise = BACKUP_AUDIO_ELEMENT.play()
      
      if (backupPromise) {
        await backupPromise
        console.log('🎵 Backup audio played successfully!')
        
        // Auto-reset
        setTimeout(() => { IS_PLAYING = false }, 1000)
        return
      }
    } catch (backupError) {
      console.warn('🎵 Backup audio failed:', backupError)
    }
  }
  
  // Strategy 3: Web Audio API fallback
  if (AUDIO_CONTEXT) {
    try {
      console.log('🎵 Trying Web Audio API beep...')
      createWebAudioBeep()
      setTimeout(() => { IS_PLAYING = false }, 300)
      return
    } catch (webAudioError) {
      console.warn('🎵 Web Audio API failed:', webAudioError)
    }
  }
  
  // Strategy 4: Vibration fallback
  console.log('🎵 All audio failed, using vibration')
  IS_PLAYING = false
  
  if (IS_MOBILE && navigator.vibrate) {
    try {
      navigator.vibrate([50, 50, 50]) // Triple vibration pattern
      console.log('🎵 Vibration feedback used')
    } catch (e) {
      console.warn('🎵 Even vibration failed:', e)
    }
  }
}

// Create a simple beep using Web Audio API as last resort
function createWebAudioBeep() {
  if (!AUDIO_CONTEXT) return
  
  const oscillator = AUDIO_CONTEXT.createOscillator()
  const gainNode = AUDIO_CONTEXT.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(AUDIO_CONTEXT.destination)
  
  oscillator.frequency.setValueAtTime(800, AUDIO_CONTEXT.currentTime) // 800Hz beep
  gainNode.gain.setValueAtTime(0.1, AUDIO_CONTEXT.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, AUDIO_CONTEXT.currentTime + 0.2)
  
  oscillator.start()
  oscillator.stop(AUDIO_CONTEXT.currentTime + 0.2)
  
  console.log('🎵 Web Audio beep created')
}

// Enable/disable sound - but keep audio elements loaded
function setAudioEnabled(enabled) {
  try {
    IS_ENABLED = enabled
    settingsManager.updateSettings({ soundEnabled: enabled })
    
    console.log('🎵 Sound enabled set to:', enabled)
    
    if (enabled && !INITIALIZATION_COMPLETE) {
      initializeSound()
    }
    
  } catch (error) {
    console.warn('Set sound enabled failed:', error)
  }
}

// Check if sound is enabled and ready
function checkSoundEnabled() {
  return IS_ENABLED && (AUDIO_ELEMENT !== null || BACKUP_AUDIO_ELEMENT !== null) && INITIALIZATION_COMPLETE
}

// Manual user interaction trigger
function handleInteraction() {
  if (!USER_INTERACTED) {
    console.log('🎵 Manual user interaction trigger')
    
    const unlock = async () => {
      if (USER_INTERACTED) return
      USER_INTERACTED = true
      
      try {
        if (!AUDIO_CONTEXT && (window.AudioContext || window.webkitAudioContext)) {
          AUDIO_CONTEXT = new (window.AudioContext || window.webkitAudioContext)()
        }
        
        if (AUDIO_CONTEXT && AUDIO_CONTEXT.state === 'suspended') {
          await AUDIO_CONTEXT.resume()
        }
        
        if (AUDIO_ELEMENT) AUDIO_ELEMENT.muted = false
        if (BACKUP_AUDIO_ELEMENT) BACKUP_AUDIO_ELEMENT.muted = false
        
        console.log('🎵 Manual interaction complete')
      } catch (e) {
        console.warn('Manual interaction failed:', e)
      }
    }
    
    unlock()
  }
}

// Stop sound
function stopSound() {
  try {
    if (AUDIO_ELEMENT) {
      AUDIO_ELEMENT.pause()
      AUDIO_ELEMENT.currentTime = 0
    }
    if (BACKUP_AUDIO_ELEMENT) {
      BACKUP_AUDIO_ELEMENT.pause()
      BACKUP_AUDIO_ELEMENT.currentTime = 0
    }
    IS_PLAYING = false
  } catch (e) {
    console.warn('Stop sound failed:', e)
  }
}

// Emergency stop
function emergencyStop() {
  try {
    stopSound()
    IS_PLAYING = false
    console.log('🎵 Emergency stop completed')
  } catch (e) {
    console.warn('Emergency stop failed:', e)
  }
}

// AUTO-INITIALIZE when this module loads
console.log('🎵 Sound module loading - starting auto-initialization...')
initializeSound()

// EXPORTS
export const playButtonClick = playClickSound
export const playButtonHover = () => {}
export const playSuccess = playClickSound
export const playError = playClickSound

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