import React, { useCallback, useRef } from 'react'
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
  const lastClickTime = useRef(0)
  
  const buttonClass = [
    'calc-button',
    'calc-button--fast',
    `calc-button--${variant}`,
    soundDisabled ? 'sound-disabled' : '',
    className
  ].filter(Boolean).join(' ')

  // ULTRA-FAST click handler - no debouncing, instant response
  const handleClick = useCallback((e) => {
    if (disabled) return
    
    const now = Date.now()
    // Allow rapid clicking - no minimum time between clicks
    lastClickTime.current = now
    
    // Immediate audio context setup - NO await, NO delays
    handleUserInteraction()
    resumeAudio()
    
    // Instant sound - fire and forget
    if (enableSound) {
      playButtonClick()
    }
    
    // Immediate callback execution
    if (onClick) {
      onClick(e)
    }
  }, [onClick, disabled, enableSound])

  // Ultra-fast mouse down - immediate response
  const handleMouseDown = useCallback((e) => {
    if (disabled) return
    
    // Instant audio setup
    handleUserInteraction()
    resumeAudio()
    
    if (onMouseDown) {
      onMouseDown(e)
    }
  }, [onMouseDown, disabled])

  // Ultra-fast touch start - immediate response
  const handleTouchStart = useCallback((e) => {
    if (disabled) return
    
    // Prevent default to avoid delays
    e.preventDefault()
    
    // Instant audio setup
    handleUserInteraction()
    resumeAudio()
    
    // Immediate sound for touch
    if (enableSound) {
      playButtonClick()
    }
    
    if (onTouchStart) {
      onTouchStart(e)
    }
    
    // Trigger click immediately on touch for fastest response
    if (onClick) {
      onClick(e)
    }
  }, [onTouchStart, disabled, enableSound, onClick])

  // Fast mouse up
  const handleMouseUp = useCallback((e) => {
    if (disabled) return
    
    if (onMouseUp) {
      onMouseUp(e)
    }
  }, [onMouseUp, disabled])

  // Fast touch end
  const handleTouchEnd = useCallback((e) => {
    if (disabled) return
    
    if (onTouchEnd) {
      onTouchEnd(e)
    }
  }, [onTouchEnd, disabled])

  // Minimal hover for desktop only
  const handleMouseEnter = useCallback(() => {
    if (disabled) return
    
    // Only on non-touch devices
    if (window.matchMedia('(hover: hover)').matches) {
      handleUserInteraction()
      resumeAudio()
    }
  }, [disabled])

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
      style={{
        // Override any CSS delays for instant response
        transition: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button 