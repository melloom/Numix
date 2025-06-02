// Ultra-simple sound system - lightweight and crash-proof
import { settingsManager } from './localStorage'
import { isMobileDevice } from './mobileUtils'

class SimpleSoundManager {
  constructor() {
    this.isEnabled = false
    this.hasUserInteracted = false
    this.isMobile = isMobileDevice()
    this.audio = null
    this.backupAudio = null
    this.isPlaying = false
    this.lastPlayTime = 0
    this.soundFile = '/assets/ui-pop-sound-316482.mp3'
    
    this.init()
  }

  init() {
    try {
      const settings = settingsManager.getSettings()
      this.isEnabled = settings.soundEnabled
      
      if (this.isEnabled) {
        this.createSimpleAudio()
        this.setupOneTimeListener()
      }
    } catch (error) {
      console.warn('Sound init failed (continuing silently)')
      this.isEnabled = false
    }
  }

  createSimpleAudio() {
    try {
      // Create only 2 audio elements - main and backup
      this.audio = new Audio()
      this.audio.src = this.soundFile
      this.audio.volume = 0.8
      this.audio.preload = 'none'
      this.audio.muted = true
      
      this.backupAudio = new Audio()
      this.backupAudio.src = this.soundFile
      this.backupAudio.volume = 0.8
      this.backupAudio.preload = 'none'
      this.backupAudio.muted = true
      
      // Simple event handlers
      this.audio.addEventListener('ended', () => {
        this.isPlaying = false
        this.audio.currentTime = 0
      })
      
      this.backupAudio.addEventListener('ended', () => {
        this.isPlaying = false
        this.backupAudio.currentTime = 0
      })
      
      // Error handlers that don't recreate
      this.audio.addEventListener('error', () => {
        this.isPlaying = false
      })
      
      this.backupAudio.addEventListener('error', () => {
        this.isPlaying = false
      })
      
    } catch (error) {
      console.warn('Audio creation failed (continuing silently)')
      this.audio = null
      this.backupAudio = null
    }
  }

  setupOneTimeListener() {
    const unlock = () => {
      if (this.hasUserInteracted) return
      this.hasUserInteracted = true
      
      try {
        // Simple unlock - just unmute
        if (this.audio) {
          this.audio.muted = false
          this.audio.preload = 'auto'
        }
        if (this.backupAudio) {
          this.backupAudio.muted = false
          this.backupAudio.preload = 'auto'
        }
      } catch (e) {
        // Ignore unlock errors
      }
      
      // Remove listener
      document.removeEventListener('touchstart', unlock, true)
      document.removeEventListener('click', unlock, true)
    }
    
    document.addEventListener('touchstart', unlock, { once: true, passive: true, capture: true })
    document.addEventListener('click', unlock, { once: true, passive: true, capture: true })
  }

  playSound() {
    // Rate limit to prevent spam
    const now = Date.now()
    if (now - this.lastPlayTime < 50) return // 50ms minimum between sounds
    
    if (!this.isEnabled || !this.hasUserInteracted || this.isPlaying) return
    
    try {
      this.lastPlayTime = now
      this.isPlaying = true
      
      // Try main audio first
      if (this.audio && this.audio.readyState >= 2) {
        this.audio.currentTime = 0
        this.audio.play().then(() => {
          // Success
        }).catch(() => {
          // Try backup audio
          this.tryBackupAudio()
        })
      } else {
        this.tryBackupAudio()
      }
      
      // Mobile vibration as backup
      if (this.isMobile && navigator.vibrate) {
        navigator.vibrate(8)
      }
      
      // Auto-reset playing flag in case audio doesn't fire ended event
      setTimeout(() => {
        this.isPlaying = false
      }, 200)
      
    } catch (error) {
      this.isPlaying = false
      // Mobile vibration as fallback
      if (this.isMobile && navigator.vibrate) {
        try { navigator.vibrate(8) } catch (e) {}
      }
    }
  }

  tryBackupAudio() {
    try {
      if (this.backupAudio && this.backupAudio.readyState >= 2) {
        this.backupAudio.currentTime = 0
        this.backupAudio.play().catch(() => {
          this.isPlaying = false
        })
      } else {
        this.isPlaying = false
      }
    } catch (e) {
      this.isPlaying = false
    }
  }

  setEnabled(enabled) {
    try {
      this.isEnabled = enabled
      settingsManager.updateSettings({ soundEnabled: enabled })
      
      if (enabled) {
        if (!this.audio) {
          this.createSimpleAudio()
        }
        // Don't auto-play test sound - wait for user action
      }
    } catch (error) {
      // Ignore errors
    }
  }

  isAudioEnabled() {
    return this.isEnabled
  }

  // All play methods use the same simple playSound
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
        if (this.backupAudio) {
          this.backupAudio.muted = false
          this.backupAudio.preload = 'auto'
        }
      } catch (e) {
        // Ignore errors
      }
    }
  }

  // Cleanup method
  destroy() {
    try {
      if (this.audio) {
        this.audio.pause()
        this.audio = null
      }
      if (this.backupAudio) {
        this.backupAudio.pause()
        this.backupAudio = null
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

// Create single instance
let soundManager
try {
  soundManager = new SimpleSoundManager()
} catch (error) {
  // Fallback object if creation fails
  soundManager = {
    playClick: () => {},
    playSuccess: () => {},
    playError: () => {},
    setEnabled: () => {},
    isAudioEnabled: () => false,
    handleUserInteraction: () => {},
    destroy: () => {}
  }
}

// Simple exports
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

export default soundManager 