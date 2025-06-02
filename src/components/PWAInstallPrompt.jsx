import React, { useState, useEffect } from 'react'
import { pwaManager } from '../utils/localStorage'
import './PWAInstallPrompt.css'

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.navigator.standalone === true) {
        setIsInstalled(true)
        return
      }
    }

    checkInstalled()

    // Handle the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Use the utility to check if prompt should be shown
      if (pwaManager.shouldShowPrompt()) {
        setTimeout(() => {
          setShowPrompt(true)
          pwaManager.setLastShown()
          
          // Auto-hide after 5 seconds
          setTimeout(() => {
            setShowPrompt(false)
          }, 5000)
        }, 2000) // Show after 2 seconds delay
      }
    }

    // Handle app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
      // Clear PWA prompt data when installed
      pwaManager.setDismissed(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      const result = await deferredPrompt.prompt()
      console.log('Install result:', result)
      
      if (result.outcome === 'accepted') {
        setIsInstalled(true)
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('Error showing install prompt:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    pwaManager.setDismissed(true)
  }

  const handleLater = () => {
    setShowPrompt(false)
  }

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="pwa-install-prompt">
      <div className="pwa-install-content">
        <div className="pwa-install-icon">📱</div>
        <div className="pwa-install-text">
          <h3>Install Numix Calculator</h3>
          <p>Get quick access and offline functionality</p>
        </div>
        <div className="pwa-install-actions">
          <button 
            className="pwa-install-btn pwa-install-btn--primary"
            onClick={handleInstallClick}
          >
            Install
          </button>
          <button 
            className="pwa-install-btn pwa-install-btn--secondary"
            onClick={handleLater}
          >
            Later
          </button>
          <button 
            className="pwa-install-btn pwa-install-btn--close"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
      <div className="pwa-install-progress"></div>
    </div>
  )
}

export default PWAInstallPrompt 