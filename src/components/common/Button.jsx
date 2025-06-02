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
    
    console.log('Button clicked:', { 
      disabled, 
      enableSound, 
      soundDisabled,
      timeSinceLastClick: now - lastClickTime.current 
    })
    
    // Ultra-aggressive debouncing
    if (now - lastClickTime.current < debounceMs) {
      console.log('Click debounced')
      return
    }
    
    // Prevent re-entry during processing
    if (isProcessing.current) {
      console.log('Already processing click')
      return
    }
    
    // Track rapid clicks and block if too many
    clickCount.current++
    if (clickCount.current > 3) {
      console.log('Too many rapid clicks, blocking')
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
      console.log('Processing button click...')
      
      // AGGRESSIVE mobile audio initialization
      forceMobileAudioInit()
      handleUserInteraction()
      resumeAudio()
      
      // Try to play sound immediately for better responsiveness
      if (enableSound && !disabled) {
        console.log('Attempting to play click sound')
        playButtonClick()
      }
      
      // Call the original onClick handler immediately (no delay)
      if (onClick && !disabled) {
        console.log('Calling onClick handler')
        onClick(e)
      }
      
    } catch (error) {
      console.warn('Button click error:', error)
    } finally {
      // Release processing lock after a shorter delay
      setTimeout(() => {
        isProcessing.current = false
      }, 50)
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
    
    console.log('Mouse down on button')
    
    // Prevent defaults more aggressively
    e.preventDefault()
    e.stopPropagation()
    
    try {
      // AGGRESSIVE audio initialization on mouse down
      forceMobileAudioInit()
      handleUserInteraction()
      resumeAudio()
      
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
    
    console.log('Touch start on button')
    
    // Prevent defaults even more aggressively on touch
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    
    try {
      // SUPER AGGRESSIVE mobile audio init on touch
      forceMobileAudioInit()
      handleUserInteraction()
      resumeAudio()
      
      // Force another attempt at audio initialization
      setTimeout(() => {
        forceMobileAudioInit()
        handleUserInteraction()
      }, 10)
      
      if (onTouchStart) {
        onTouchStart(e)
      }
    } catch (error) {
      console.warn('Touch start error:', error)
    }
  }, [onTouchStart, disabled])

  const handleTouchEnd = useCallback((e) => {
    if (disabled) return
    
    console.log('Touch end on button')
    
    // Prevent touch end from triggering additional events
    e.preventDefault()
    e.stopPropagation()
    
    try {
      // One more attempt at audio initialization
      forceMobileAudioInit()
      handleUserInteraction()
      
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