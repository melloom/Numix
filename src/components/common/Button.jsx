import React, { useCallback } from 'react'
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
  ...props 
}) => {
  const soundDisabled = !isSoundEnabled() || !enableSound
  
  const buttonClass = [
    'calc-button',
    `calc-button--${variant}`,
    soundDisabled ? 'sound-disabled' : '',
    className
  ].filter(Boolean).join(' ')

  const handleClick = useCallback((e) => {
    if (disabled) return
    
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
  }, [onClick, disabled, enableSound])

  const handleMouseEnter = useCallback(() => {
    if (disabled) return
    
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
  }, [disabled, enableSound])

  const handleMouseDown = useCallback((e) => {
    if (disabled) return
    
    // Force mobile audio init - INSTANT
    forceMobileAudioInit()
    
    // Handle user interaction for mobile/PWA audio - INSTANT
    handleUserInteraction()
    
    if (onMouseDown) {
      onMouseDown(e)
    }
  }, [onMouseDown, disabled])

  const handleMouseUp = useCallback((e) => {
    if (disabled) return
    
    if (onMouseUp) {
      onMouseUp(e)
    }
  }, [onMouseUp, disabled])

  const handleTouchStart = useCallback((e) => {
    if (disabled) return
    
    // Force mobile audio init - INSTANT
    forceMobileAudioInit()
    
    // Handle user interaction for mobile/PWA audio - INSTANT
    handleUserInteraction()
    
    // Resume audio context - INSTANT
    resumeAudio()
    
    if (onTouchStart) {
      onTouchStart(e)
    }
  }, [onTouchStart, disabled])

  const handleTouchEnd = useCallback((e) => {
    if (disabled) return
    
    if (onTouchEnd) {
      onTouchEnd(e)
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