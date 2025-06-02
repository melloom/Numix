import React, { useCallback, useRef } from 'react'
import { playButtonClick, playButtonHover, resumeAudio, handleUserInteraction, isSoundEnabled, forceMobileAudioInit, emergencyStopAudio } from '../../utils/sounds'
import './Button.css'

const Button = ({ 
  children, 
  onClick, 
  variant = 'default', 
  className = '', 
  disabled = false,
  onMouseDown,
  onMouseUp,
  onTouchStart,
  onTouchEnd,
  enableSound = true,
  debounceMs = 200,
  ...props 
}) => {
  const soundDisabled = !isSoundEnabled() || !enableSound
  const lastClickTime = useRef(0)
  const isProcessing = useRef(false)
  const clickCount = useRef(0)
  
  const buttonClass = [
    'calc-button',
    `calc-button--${variant}`,
    soundDisabled ? 'sound-disabled' : '',
    disabled ? 'disabled' : '',
    className
  ].filter(Boolean).join(' ')

  const handleClick = useCallback((e) => {
    if (disabled) return
    
    // Prevent all default behaviors
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    
    const now = Date.now()
    
    // Ultra-aggressive debouncing
    if (now - lastClickTime.current < debounceMs) {
      return
    }
    
    // Prevent re-entry during processing
    if (isProcessing.current) {
      return
    }
    
    // Track rapid clicks and block if too many
    clickCount.current++
    if (clickCount.current > 3) {
      // Reset click count after a longer delay
      setTimeout(() => {
        clickCount.current = 0
      }, 1000)
      return
    }
    
    isProcessing.current = true
    lastClickTime.current = now
    
    // Reset click count after normal operation
    setTimeout(() => {
      clickCount.current = Math.max(0, clickCount.current - 1)
    }, 300)
    
    try {
      // Emergency stop any existing audio first
      emergencyStopAudio()
      
      // Force mobile audio init - INSTANT
      forceMobileAudioInit()
      
      // Handle user interaction for mobile/PWA audio - INSTANT
      handleUserInteraction()
      
      // Resume audio context - INSTANT
      resumeAudio()
      
      // Small delay before playing sound to ensure cleanup
      setTimeout(() => {
        if (enableSound && !disabled) {
          playButtonClick()
        }
      }, 10)
      
      // Call the original onClick handler with delay to prevent conflicts
      setTimeout(() => {
        if (onClick && !disabled) {
          onClick(e)
        }
      }, 15)
      
    } catch (error) {
      console.warn('Button click error:', error)
    } finally {
      // Release processing lock after a delay
      setTimeout(() => {
        isProcessing.current = false
      }, 100)
    }
  }, [onClick, disabled, enableSound, debounceMs])

  const handleMouseEnter = useCallback(() => {
    if (disabled || isProcessing.current) return
    
    try {
      // Force mobile audio init - INSTANT
      forceMobileAudioInit()
      
      // Handle user interaction for mobile/PWA audio - INSTANT
      handleUserInteraction()
      
      // Resume audio context - INSTANT  
      resumeAudio()
      
      // NO hover sounds to prevent audio spam
      
    } catch (error) {
      // Silently ignore hover sound errors
    }
  }, [disabled, enableSound])

  const handleMouseDown = useCallback((e) => {
    if (disabled) return
    
    // Prevent defaults more aggressively
    e.preventDefault()
    e.stopPropagation()
    
    try {
      // Force mobile audio init - INSTANT
      forceMobileAudioInit()
      
      // Handle user interaction for mobile/PWA audio - INSTANT
      handleUserInteraction()
      
      if (onMouseDown) {
        onMouseDown(e)
      }
    } catch (error) {
      console.warn('Mouse down error:', error)
    }
  }, [onMouseDown, disabled])

  const handleMouseUp = useCallback((e) => {
    if (disabled) return
    
    try {
      if (onMouseUp) {
        onMouseUp(e)
      }
    } catch (error) {
      console.warn('Mouse up error:', error)
    }
  }, [onMouseUp, disabled])

  const handleTouchStart = useCallback((e) => {
    if (disabled) return
    
    // Prevent defaults even more aggressively on touch
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    
    try {
      // Force mobile audio init - INSTANT
      forceMobileAudioInit()
      
      // Handle user interaction for mobile/PWA audio - INSTANT
      handleUserInteraction()
      
      // Resume audio context - INSTANT
      resumeAudio()
      
      if (onTouchStart) {
        onTouchStart(e)
      }
    } catch (error) {
      console.warn('Touch start error:', error)
    }
  }, [onTouchStart, disabled])

  const handleTouchEnd = useCallback((e) => {
    if (disabled) return
    
    // Prevent touch end from triggering additional events
    e.preventDefault()
    e.stopPropagation()
    
    try {
      if (onTouchEnd) {
        onTouchEnd(e)
      }
    } catch (error) {
      console.warn('Touch end error:', error)
    }
  }, [onTouchEnd, disabled])

  return (
    <button
      className={buttonClass}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled}
      // Prevent context menu and selection to avoid conflicts
      onContextMenu={(e) => e.preventDefault()}
      onSelectStart={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      // Additional touch event prevention
      onTouchMove={(e) => e.preventDefault()}
      onTouchCancel={(e) => e.preventDefault()}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button 