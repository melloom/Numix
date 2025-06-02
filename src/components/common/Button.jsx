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
  debounceMs = 150,
  ...props 
}) => {
  const soundDisabled = !isSoundEnabled() || !enableSound
  const lastClickTime = useRef(0)
  const isProcessing = useRef(false)
  const hasTouched = useRef(false)
  
  const buttonClass = [
    'calc-button',
    `calc-button--${variant}`,
    soundDisabled ? 'sound-disabled' : '',
    disabled ? 'disabled' : '',
    className
  ].filter(Boolean).join(' ')

  const handleClick = useCallback((e) => {
    if (disabled) return
    
    const now = Date.now()
    
    // Simple debouncing
    if (now - lastClickTime.current < debounceMs) {
      e.preventDefault()
      return
    }
    
    // Prevent re-entry during processing
    if (isProcessing.current) {
      e.preventDefault()
      return
    }
    
    // If this is a touch device and we just had a touch, don't double-process
    if (hasTouched.current && e.type === 'click') {
      hasTouched.current = false
      return
    }
    
    isProcessing.current = true
    lastClickTime.current = now
    
    try {
      // Handle audio setup
      forceMobileAudioInit()
      handleUserInteraction()
      resumeAudio()
      
      // Play sound
      if (enableSound && !disabled) {
        playButtonClick()
      }
      
      // Call the original onClick handler immediately
      if (onClick && !disabled) {
        onClick(e)
      }
      
    } catch (error) {
      console.warn('Button click error:', error)
    } finally {
      // Release processing lock quickly
      setTimeout(() => {
        isProcessing.current = false
      }, 50)
    }
  }, [onClick, disabled, enableSound, debounceMs])

  const handleMouseEnter = useCallback(() => {
    if (disabled || isProcessing.current) return
    
    try {
      forceMobileAudioInit()
      handleUserInteraction()
      resumeAudio()
    } catch (error) {
      // Silently ignore hover errors
    }
  }, [disabled])

  const handleMouseDown = useCallback((e) => {
    if (disabled) return
    
    try {
      forceMobileAudioInit()
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
    
    hasTouched.current = true
    
    try {
      forceMobileAudioInit()
      handleUserInteraction()
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
    
    const now = Date.now()
    
    // Simple debouncing for touch
    if (now - lastClickTime.current < debounceMs) {
      return
    }
    
    if (isProcessing.current) {
      return
    }
    
    // Process touch end as a click
    isProcessing.current = true
    lastClickTime.current = now
    
    try {
      // Play sound
      if (enableSound && !disabled) {
        playButtonClick()
      }
      
      // Call the onClick handler for touch
      if (onClick && !disabled) {
        onClick(e)
      }
      
      if (onTouchEnd) {
        onTouchEnd(e)
      }
      
    } catch (error) {
      console.warn('Touch end error:', error)
    } finally {
      setTimeout(() => {
        isProcessing.current = false
        hasTouched.current = false
      }, 50)
    }
  }, [onTouchEnd, disabled, onClick, enableSound, debounceMs])

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