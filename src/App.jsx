import React, { useEffect, useState } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { stopAllSounds, emergencyStopAudio } from './utils/sounds'
import { isMobileDevice, setupMobileViewport, isAddressBarHidingSupported, hideAddressBar } from './utils/mobileUtils'
import { settingsManager } from './utils/localStorage'
import CalculatorApp from './components/CalculatorApp'
import './styles/index.css'
import './styles/App.css'

// Error boundary component to catch crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Calculator app crashed:', error, errorInfo)
    
    // EMERGENCY: Stop ALL audio immediately
    try {
      emergencyStopAudio()
      stopAllSounds()
    } catch (e) {
      console.warn('Failed to stop sounds after crash:', e)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    
    // Clear any lingering audio issues AGAIN
    try {
      emergencyStopAudio()
      stopAllSounds()
    } catch (e) {
      console.warn('Failed to stop sounds during reset:', e)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>Calculator Crashed</h2>
            <p>Something went wrong. Don't worry, your data is safe!</p>
            <button onClick={this.handleReset} className="reset-button">
              Restart Calculator
            </button>
            <details style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
              <summary>Error Details</summary>
              <pre>{this.state.error?.toString()}</pre>
            </details>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  const [isMobile, setIsMobile] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Performance monitoring with audio cleanup
    let performanceWarnings = 0
    const maxWarnings = 3
    
    const monitorPerformance = () => {
      if (performance.memory) {
        // Monitor memory usage
        const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit
        if (memoryUsage > 0.8) {
          performanceWarnings++
          console.warn('High memory usage detected:', Math.round(memoryUsage * 100) + '%')
          
          if (performanceWarnings >= maxWarnings) {
            // Force cleanup INCLUDING audio
            try {
              emergencyStopAudio()
              stopAllSounds()
              if (global.gc) {
                global.gc()
              }
            } catch (e) {
              console.warn('Cleanup failed:', e)
            }
            performanceWarnings = 0
          }
        }
      }
    }

    // Check for mobile device
    const mobile = isMobileDevice()
    setIsMobile(mobile)
    
    try {
      // Setup mobile optimizations
      if (mobile) {
        setupMobileViewport()
        
        // Check settings for address bar hiding
        const settings = settingsManager.getSettings()
        if (settings.hideAddressBarMobile && isAddressBarHidingSupported()) {
          // Small delay to ensure DOM is ready
          setTimeout(() => {
            hideAddressBar()
          }, 100)
        }
      }

      // Monitor performance every 10 seconds
      const performanceInterval = setInterval(monitorPerformance, 10000)
      
      // Setup viewport height updates for mobile
      if (mobile) {
        const updateVH = () => {
          try {
            const vh = window.innerHeight * 0.01
            document.documentElement.style.setProperty('--vh', `${vh}px`)
          } catch (e) {
            console.warn('Failed to update viewport height:', e)
          }
        }
        
        updateVH()
        window.addEventListener('resize', updateVH, { passive: true })
        window.addEventListener('orientationchange', updateVH, { passive: true })
        
        // Also update VH after address bar changes
        setTimeout(updateVH, 500)
        
        return () => {
          clearInterval(performanceInterval)
          window.removeEventListener('resize', updateVH)
          window.removeEventListener('orientationchange', updateVH)
          // Cleanup audio when component unmounts
          try {
            emergencyStopAudio()
          } catch (e) {
            console.warn('Cleanup on unmount failed:', e)
          }
        }
      }
      
      return () => {
        clearInterval(performanceInterval)
        // Cleanup audio when component unmounts
        try {
          emergencyStopAudio()
        } catch (e) {
          console.warn('Cleanup on unmount failed:', e)
        }
      }
      
    } catch (error) {
      console.error('App initialization error:', error)
    } finally {
      setIsReady(true)
    }
  }, [])

  // Global error handler for unhandled errors
  useEffect(() => {
    const handleGlobalError = (event) => {
      console.error('Global error:', event.error)
      try {
        emergencyStopAudio()
        stopAllSounds()
      } catch (e) {
        console.warn('Failed to stop sounds after global error:', e)
      }
    }

    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      try {
        emergencyStopAudio()
        stopAllSounds()
      } catch (e) {
        console.warn('Failed to stop sounds after promise rejection:', e)
      }
    }

    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // Page visibility change handler to stop audio when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        try {
          emergencyStopAudio()
          stopAllSounds()
        } catch (e) {
          console.warn('Failed to stop sounds on visibility change:', e)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Loading screen while app initializes
  if (!isReady) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading Calculator...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div className={`app ${isMobile ? 'mobile-device' : ''}`}>
          <CalculatorApp />
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App