import React, { useCallback, useRef } from 'react'
import { playButtonClick, playButtonHover, resumeAudio, handleUserInteraction, isSoundEnabled, forceMobileAudioInit } from '../../utils/sounds'
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
  debounceMs = 150,
  ...props 
}) => {
  const soundDisabled = !isSoundEnabled() || !enableSound
  const lastClickTime = useRef(0)
  const isProcessing = useRef(false)
  
  const buttonClass = [
    'calc-button',
    `calc-button--${variant}`,
    soundDisabled ? 'sound-disabled' : '',
    className
  ].filter(Boolean).join(' ')

  const handleClick = useCallback((e) => {
    if (disabled) return
    
    // Prevent default to avoid double-firing on some devices
    e.preventDefault()
    e.stopPropagation()
    
    const now = Date.now()
    
    // Debounce: prevent multiple rapid clicks
    if (now - lastClickTime.current < debounceMs) {
      return
    }
    
    // Prevent re-entry during processing
    if (isProcessing.current) {
      return
    }
    
    isProcessing.current = true
    lastClickTime.current = now
    
    try {
      // Force mobile audio init - INSTANT
      forceMobileAudioInit()
      
      // Handle user interaction for mobile/PWA audio - INSTANT
      handleUserInteraction()
      
      // Resume audio context - INSTANT
      resumeAudio()
      
      // Play click sound - INSTANT, no await
      if (enableSound) {
        playButtonClick()
      }
      
      // Call the original onClick handler
      if (onClick) {
        onClick(e)
      }
    } catch (error) {
      console.warn('Button click error:', error)
    } finally {
      // Release processing lock after a short delay
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
      
      // Play subtle hover sound - INSTANT, no await
      if (enableSound) {
        playButtonHover()
      }
    } catch (error) {
      // Silently ignore hover sound errors
    }
  }, [disabled, enableSound])

  const handleMouseDown = useCallback((e) => {
    if (disabled) return
    
    // Prevent default to avoid conflicts
    e.preventDefault()
    
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
    
    // Prevent default to avoid conflicts with mouse events on mobile
    e.preventDefault()
    e.stopPropagation()
    
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
      {...props}
    >
      {children}
    </button>
  )
}

export default Button 