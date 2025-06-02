import React, { useCallback } from 'react'
import { playButtonClick, isSoundEnabled, handleUserInteraction } from '../../utils/sounds'
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
    
    // PRIORITY 1: Process the click immediately
    if (onClick) {
      onClick(e)
    }
    
    // PRIORITY 2: Sound effects (non-blocking)
    if (enableSound) {
      // Single sound call - ultra fast
      playButtonClick()
    }
  }, [onClick, disabled, enableSound])

  const handleMouseDown = useCallback((e) => {
    if (disabled) return
    
    // Minimal user interaction handling for audio unlock
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
    
    // Minimal user interaction handling for audio unlock
    handleUserInteraction()
    
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