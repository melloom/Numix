import React, { useCallback } from 'react'
import { playButtonClick, playButtonHover, resumeAudio } from '../../utils/sounds'
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
  const buttonClass = [
    'calc-button',
    `calc-button--${variant}`,
    className
  ].filter(Boolean).join(' ')

  const handleClick = useCallback(async (e) => {
    if (disabled) return
    
    // Resume audio context on user interaction
    await resumeAudio()
    
    // Play click sound
    if (enableSound) {
      playButtonClick()
    }
    
    // Call the original onClick handler
    if (onClick) {
      onClick(e)
    }
  }, [onClick, disabled, enableSound])

  const handleMouseEnter = useCallback(async () => {
    if (disabled) return
    
    // Resume audio context
    await resumeAudio()
    
    // Play subtle hover sound
    if (enableSound) {
      playButtonHover()
    }
  }, [disabled, enableSound])

  const handleMouseDown = useCallback((e) => {
    if (disabled) return
    
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