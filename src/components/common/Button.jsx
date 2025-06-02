import React, { useCallback } from 'react'
import { playButtonClick, playButtonHover, resumeAudio, handleUserInteraction, isSoundEnabled } from '../../utils/sounds'
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

  const handleClick = useCallback(async (e) => {
    if (disabled) return
    
    // Handle user interaction for mobile/PWA audio FIRST
    await handleUserInteraction()
    
    // Resume audio context on user interaction
    await resumeAudio()
    
    // Play click sound
    if (enableSound) {
      await playButtonClick()
    }
    
    // Call the original onClick handler
    if (onClick) {
      onClick(e)
    }
  }, [onClick, disabled, enableSound])

  const handleMouseEnter = useCallback(async () => {
    if (disabled) return
    
    // Handle user interaction for mobile/PWA audio
    await handleUserInteraction()
    
    // Resume audio context
    await resumeAudio()
    
    // Play subtle hover sound (only on non-touch devices)
    if (enableSound) {
      await playButtonHover()
    }
  }, [disabled, enableSound])

  const handleMouseDown = useCallback(async (e) => {
    if (disabled) return
    
    // Handle user interaction for mobile/PWA audio
    await handleUserInteraction()
    
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

  const handleTouchStart = useCallback(async (e) => {
    if (disabled) return
    
    // Handle user interaction for mobile/PWA audio - VERY IMPORTANT for mobile
    await handleUserInteraction()
    await resumeAudio()
    
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