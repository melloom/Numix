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
    
    console.log('🔘 Button clicked:', { 
      disabled, 
      enableSound, 
      soundDisabled,
      timeSinceLastClick: now - lastClickTime.current 
    })
    
    // Ultra-aggressive debouncing
    if (now - lastClickTime.current < debounceMs) {
      console.log('🔘 Click debounced')
      return
    }
    
    // Prevent re-entry during processing
    if (isProcessing.current) {
      console.log('🔘 Already processing click')
      return
    }
    
    // Track rapid clicks and block if too many
    clickCount.current++
    if (clickCount.current > 3) {
      console.log('🔘 Too many rapid clicks, blocking')
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
      console.log('🔘 Processing button click...')
      
      // Simple user interaction trigger (sound system handles the rest)
      handleUserInteraction()
      
      // Play sound - the sound system is already initialized
      if (enableSound && !disabled) {
        console.log('🔘 Playing click sound')
        playButtonClick()
      }
      
      // Call the original onClick handler immediately
      if (onClick && !disabled) {
        console.log('🔘 Calling onClick handler')
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
      // Simple interaction trigger - sound system handles initialization
      handleUserInteraction()
      
      // NO hover sounds to prevent audio spam
      
    } catch (error) {
      // Silently ignore hover errors
    }
  }, [disabled])

  const handleMouseDown = useCallback((e) => {
    if (disabled) return
    
    console.log('🔘 Mouse down')
    
    // Prevent defaults
    e.preventDefault()
    e.stopPropagation()
    
    try {
      // Trigger user interaction for sound system
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
    
    console.log('🔘 Touch start')
    
    // Prevent defaults on touch
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    
    try {
      // Trigger user interaction - sound system will handle audio context
      handleUserInteraction()
      
      if (onTouchStart) {
        onTouchStart(e)
      }
    } catch (error) {
      console.warn('Touch start error:', error)
    }
  }, [onTouchStart, disabled])

  const handleTouchEnd = useCallback((e) => {
    if (disabled) return
    
    console.log('🔘 Touch end')
    
    // Prevent touch conflicts
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
      // Prevent context menu and selection
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