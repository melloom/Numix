// Single-audio sound system - prevents multiple sounds completely
import { settingsManager } from './localStorage'
import { isMobileDevice } from './mobileUtils'

class SingleSoundManager {
  constructor() {
    this.isEnabled = false
    this.hasUserInteracted = false
    this.isMobile = isMobileDevice()
    this.audio = null
    this.isCurrentlyPlaying = false
    this.lastPlayTime = 0
    this.soundFile = '/assets/ui-pop-sound-316482.mp3'
    this.isLocked = false
    
    this.init()
  }

  init() {
    try {
      const settings = settingsManager.getSettings()
      this.isEnabled = settings.soundEnabled
      
      if (this.isEnabled) {
        this.createSingleAudio()
        this.setupUnlockListener()
      }
    } catch (error) {
      console.warn('Sound init failed silently')
      this.isEnabled = false
    }
  }

  createSingleAudio() {
    try {
      // Create only ONE audio element
      this.audio = new Audio()
      this.audio.src = this.soundFile
      this.audio.volume = 0.8
      this.audio.preload = 'none'
      this.audio.muted = true
      
      // Critical: prevent multiple plays
      this.audio.addEventListener('ended', () => {
        this.isCurrentlyPlaying = false
        this.isLocked = false
        try {
          this.audio.currentTime = 0
        } catch (e) {}
      })
      
      this.audio.addEventListener('error', () => {
        this.isCurrentlyPlaying = false
        this.isLocked = false
      })
      
      // Important: stop any previous play attempts
      this.audio.addEventListener('play', () => {
        this.isCurrentlyPlaying = true
      })
      
      this.audio.addEventListener('pause', () => {
        this.isCurrentlyPlaying = false
        this.isLocked = false
      })
      
    } catch (error) {
      console.warn('Audio creation failed silently')
      this.audio = null
    }
  }

  setupUnlockListener() {
    const unlock = () => {
      if (this.hasUserInteracted) return
      this.hasUserInteracted = true
      
      try {
        if (this.audio) {
          this.audio.muted = false
          this.audio.preload = 'auto'
        }
      } catch (e) {}
      
      // Remove listeners immediately
      document.removeEventListener('touchstart', unlock, true)
      document.removeEventListener('click', unlock, true)
    }
    
    document.addEventListener('touchstart', unlock, { once: true, passive: true, capture: true })
    document.addEventListener('click', unlock, { once: true, passive: true, capture: true })
  }

  playSound() {
    // ULTRA STRICT: Multiple checks to prevent overlapping
    const now = Date.now()
    
    // Rate limit: minimum 100ms between sounds
    if (now - this.lastPlayTime < 100) return
    
    // Check if locked, playing, or not ready
    if (this.isLocked || this.isCurrentlyPlaying || !this.isEnabled || !this.hasUserInteracted) return
    
    // Check if audio exists and is ready
    if (!this.audio || this.audio.readyState < 2) return
    
    try {
      // LOCK immediately to prevent any other plays
      this.isLocked = true
      this.lastPlayTime = now
      
      // Force stop any current playback
      this.audio.pause()
      this.audio.currentTime = 0
      
      // Play with immediate handling
      const playPromise = this.audio.play()
      
      if (playPromise) {
        playPromise.then(() => {
          // Success - keep locked until ended
        }).catch(() => {
          // Failed - unlock immediately
          this.isLocked = false
          this.isCurrentlyPlaying = false
        })
      }
      
      // Safety timeout to unlock if something goes wrong
      setTimeout(() => {
        if (this.isLocked && !this.isCurrentlyPlaying) {
          this.isLocked = false
        }
      }, 500) // Max 500ms lock
      
      // Mobile vibration as backup feedback
      if (this.isMobile && navigator.vibrate) {
        try {
          navigator.vibrate(8)
        } catch (e) {}
      }
      
    } catch (error) {
      // Always unlock on error
      this.isLocked = false
      this.isCurrentlyPlaying = false
      
      // Mobile vibration as fallback
      if (this.isMobile && navigator.vibrate) {
        try { navigator.vibrate(8) } catch (e) {}
      }
    }
  }

  setEnabled(enabled) {
    try {
      this.isEnabled = enabled
      settingsManager.updateSettings({ soundEnabled: enabled })
      
      if (enabled && !this.audio) {
        this.createSingleAudio()
      }
      
      // Never auto-play test sounds
    } catch (error) {
      // Ignore errors
    }
  }

  isAudioEnabled() {
    return this.isEnabled
  }

  // All play methods use the same restrictive playSound
  playClick() { this.playSound() }
  playSuccess() { this.playSound() }
  playError() { this.playSound() }
  
  handleUserInteraction() {
    if (!this.hasUserInteracted) {
      this.hasUserInteracted = true
      try {
        if (this.audio) {
          this.audio.muted = false
          this.audio.preload = 'auto'
        }
      } catch (e) {}
    }
  }

  // Force stop all sounds
  stopAllSounds() {
    try {
      if (this.audio) {
        this.audio.pause()
        this.audio.currentTime = 0
      }
      this.isCurrentlyPlaying = false
      this.isLocked = false
    } catch (e) {}
  }

  // Cleanup
  destroy() {
    try {
      this.stopAllSounds()
      this.audio = null
    } catch (e) {}
  }
}

// Create single instance with fallback
let soundManager
try {
  soundManager = new SingleSoundManager()
} catch (error) {
  soundManager = {
    playClick: () => {},
    playSuccess: () => {},
    playError: () => {},
    setEnabled: () => {},
    isAudioEnabled: () => false,
    handleUserInteraction: () => {},
    stopAllSounds: () => {},
    destroy: () => {}
  }
}

// Ultra-safe exports
export const playButtonClick = () => {
  try { soundManager.playClick() } catch (e) {}
}

export const playButtonHover = () => {} // Always disabled

export const playSuccess = () => {
  try { soundManager.playSuccess() } catch (e) {}
}

export const playError = () => {
  try { soundManager.playError() } catch (e) {}
}

export const setSoundEnabled = (enabled) => {
  try { soundManager.setEnabled(enabled) } catch (e) {}
}

export const isSoundEnabled = () => {
  try { return soundManager.isAudioEnabled() } catch (e) { return false }
}

export const handleUserInteraction = () => {
  try { soundManager.handleUserInteraction() } catch (e) {}
}

export const resumeAudio = () => {
  try { soundManager.handleUserInteraction() } catch (e) {}
}

export const forceMobileAudioInit = () => {
  try { soundManager.handleUserInteraction() } catch (e) {}
}

// Emergency stop function
export const stopAllSounds = () => {
  try { soundManager.stopAllSounds() } catch (e) {}
}

export default soundManager 