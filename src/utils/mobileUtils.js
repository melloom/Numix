// Mobile utilities for calculator app

// Check if we're on a mobile device
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Check if we're on iOS
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

// Check if we're on Android
export const isAndroid = () => {
  return /Android/i.test(navigator.userAgent)
}

// Global variables to track scroll behavior
let isAddressBarHidden = false
let scrollTimeout = null

// Additional modern approach for address bar hiding
const attemptScreenOptimizations = async () => {
  try {
    // Request screen wake lock to keep app active
    if ('wakeLock' in navigator) {
      const wakeLock = await navigator.wakeLock.request('screen')
      console.log('Wake lock activated')
    }
  } catch (err) {
    console.log('Wake lock failed:', err)
  }
  
  try {
    // Lock screen orientation if supported
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock('portrait-primary')
      console.log('Screen orientation locked')
    }
  } catch (err) {
    console.log('Screen orientation lock failed:', err)
  }
}

// Hide address bar on mobile browsers
export const hideAddressBar = () => {
  if (!isMobileDevice()) return

  console.log('Attempting to hide address bar...')
  
  // Add CSS class for styling
  document.body.classList.add('hide-address-bar')
  document.documentElement.classList.add('hide-address-bar')
  
  isAddressBarHidden = true
  
  // Apply modern screen optimizations
  attemptScreenOptimizations()
  
  // Modern approach: Use requestFullscreen for better mobile experience
  const attemptFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        console.log('Fullscreen not supported or denied')
        fallbackAddressBarHiding()
      })
    } else {
      fallbackAddressBarHiding()
    }
  }
  
  // Fallback method for address bar hiding
  const fallbackAddressBarHiding = () => {
    // Force page to be taller than viewport to enable scrolling
    const originalHeight = document.body.style.height
    document.body.style.height = '101vh'
    
    // Use multiple scroll attempts with different timings
    const scrollAttempts = [0, 50, 100, 200, 500, 1000]
    
    scrollAttempts.forEach(delay => {
      setTimeout(() => {
        if (isAddressBarHidden) {
          // Try different scroll positions
          window.scrollTo({ top: 1, behavior: 'instant' })
          
          // Additional iOS specific techniques
          if (isIOS()) {
            // Force a layout recalculation
            document.body.offsetHeight
            window.scrollTo({ top: 1, behavior: 'instant' })
          }
          
          // Android specific techniques
          if (isAndroid()) {
            // Use smooth scrolling then instant
            window.scrollTo({ top: 1, behavior: 'smooth' })
            setTimeout(() => {
              if (isAddressBarHidden) {
                window.scrollTo({ top: 1, behavior: 'instant' })
              }
            }, 100)
          }
        }
      }, delay)
    })
    
    // Restore original height after scrolling
    setTimeout(() => {
      document.body.style.height = originalHeight
    }, 1500)
  }
  
  // Use the Visual Viewport API if available (modern approach)
  if ('visualViewport' in window && window.visualViewport) {
    const viewport = window.visualViewport
    
    const handleViewportChange = () => {
      if (isAddressBarHidden && viewport.height < window.innerHeight * 0.95) {
        // Address bar is likely visible, try to hide it
        setTimeout(() => {
          if (isAddressBarHidden) {
            window.scrollTo({ top: 1, behavior: 'instant' })
          }
        }, 10)
      }
    }
    
    viewport.addEventListener('resize', handleViewportChange, { passive: true })
    viewport.addEventListener('scroll', handleViewportChange, { passive: true })
  }
  
  // Start with fullscreen attempt, fallback to scroll method
  if (document.fullscreenEnabled) {
    attemptFullscreen()
  } else {
    fallbackAddressBarHiding()
  }
  
  // Set up touch handlers to maintain hidden state
  const maintainHiddenState = () => {
    if (isAddressBarHidden && window.pageYOffset === 0) {
      window.scrollTo({ top: 1, behavior: 'instant' })
    }
  }
  
  document.addEventListener('touchstart', maintainHiddenState, { passive: true })
  document.addEventListener('touchend', maintainHiddenState, { passive: true })
}

// Show address bar on mobile browsers
export const showAddressBar = () => {
  if (!isMobileDevice()) return
  
  console.log('Showing address bar...')
  
  isAddressBarHidden = false
  
  // Remove CSS classes
  document.body.classList.remove('hide-address-bar')
  document.documentElement.classList.remove('hide-address-bar')
  
  // Exit fullscreen if active
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {
      console.log('Exit fullscreen failed')
    })
  }
  
  // Scroll to top to show address bar
  window.scrollTo({ top: 0, behavior: 'smooth' })
  
  // Force a second scroll attempt
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, 100)
}

// Set up mobile viewport optimizations
export const setupMobileViewport = (hideAddressBarEnabled = true) => {
  if (!isMobileDevice()) return

  console.log('Setting up mobile viewport, hide address bar:', hideAddressBarEnabled)

  // Add meta viewport tag if not present
  let viewportMeta = document.querySelector('meta[name="viewport"]')
  if (!viewportMeta) {
    viewportMeta = document.createElement('meta')
    viewportMeta.name = 'viewport'
    document.head.appendChild(viewportMeta)
  }
  
  // Set optimal viewport settings for calculator app
  viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
  
  // Apply address bar hiding if enabled
  if (hideAddressBarEnabled) {
    // Wait for page to fully load
    if (document.readyState === 'complete') {
      setTimeout(hideAddressBar, 500)
    } else {
      window.addEventListener('load', () => {
        setTimeout(hideAddressBar, 500)
      })
    }
    
    // Re-hide on orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        if (isAddressBarHidden) {
          hideAddressBar()
        }
      }, 1000)
    })
    
    // Re-hide when page gains focus
    window.addEventListener('focus', () => {
      if (isAddressBarHidden) {
        setTimeout(hideAddressBar, 200)
      }
    })
    
    // Re-hide on window resize
    window.addEventListener('resize', () => {
      if (isAddressBarHidden) {
        clearTimeout(scrollTimeout)
        scrollTimeout = setTimeout(hideAddressBar, 300)
      }
    })
  } else {
    showAddressBar()
  }
}

// Apply mobile-specific CSS classes
export const applyMobileClasses = () => {
  if (!isMobileDevice()) return
  
  document.body.classList.add('mobile-device')
  
  if (isIOS()) {
    document.body.classList.add('ios-device')
  }
  
  if (isAndroid()) {
    document.body.classList.add('android-device')
  }
}

// Mobile-specific touch event handlers
export const setupMobileTouchHandlers = () => {
  if (!isMobileDevice()) return
  
  // Prevent double-tap zoom
  let lastTouchEnd = 0
  document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime()
    if (now - lastTouchEnd <= 300) {
      event.preventDefault()
    }
    lastTouchEnd = now
  }, false)
  
  // Prevent pinch zoom
  document.addEventListener('touchmove', (event) => {
    if (event.scale !== 1) {
      event.preventDefault()
    }
  }, { passive: false })
}

// Initialize all mobile optimizations
export const initializeMobileOptimizations = (settings = {}) => {
  const {
    hideAddressBar = true,
    preventZoom = true,
    optimizeViewport = true
  } = settings
  
  if (optimizeViewport) {
    setupMobileViewport(hideAddressBar)
  }
  
  if (preventZoom) {
    setupMobileTouchHandlers()
  }
  
  applyMobileClasses()
}

// Check if address bar hiding is supported on this device/browser
export const isAddressBarHidingSupported = () => {
  if (!isMobileDevice()) return false
  
  // Check if we're in a standalone PWA (already has hidden address bar)
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
    return false // Already in standalone mode, no need for setting
  }
  
  // Check if we're in an iframe (can't control address bar)
  if (window.self !== window.top) {
    return false
  }
  
  // Check browser support for address bar hiding techniques
  const hasFullscreenSupport = document.fullscreenEnabled || 
                              document.webkitFullscreenEnabled || 
                              document.mozFullScreenEnabled ||
                              document.msFullscreenEnabled
  
  const hasVisualViewport = 'visualViewport' in window
  
  // For iOS Safari, check if it's actually Safari (not in-app browser)
  if (isIOS()) {
    const isInAppBrowser = /Instagram|FBAN|FBAV|Twitter|Line|WhatsApp|Snapchat|WeChat|TikTok/i.test(navigator.userAgent)
    if (isInAppBrowser) {
      return false // In-app browsers don't support address bar hiding
    }
    
    // Check if it's Safari
    const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome|CriOS|OPiOS|FxiOS/i.test(navigator.userAgent)
    return isSafari || hasFullscreenSupport
  }
  
  // For Android, check if it's Chrome or supports fullscreen
  if (isAndroid()) {
    const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edge|OPR|Samsung/i.test(navigator.userAgent)
    const isFirefox = /Firefox/i.test(navigator.userAgent)
    const isSamsung = /Samsung/i.test(navigator.userAgent)
    
    return isChrome || isFirefox || isSamsung || hasFullscreenSupport
  }
  
  // For other mobile devices, require fullscreen support
  return hasFullscreenSupport || hasVisualViewport
}

// Check if device is currently in standalone mode
export const isStandaloneMode = () => {
  return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches
}

export default {
  isMobileDevice,
  isIOS,
  isAndroid,
  hideAddressBar,
  showAddressBar,
  setupMobileViewport,
  applyMobileClasses,
  setupMobileTouchHandlers,
  initializeMobileOptimizations,
  isAddressBarHidingSupported,
  isStandaloneMode
} 