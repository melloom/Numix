import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { settingsManager } from '../utils/localStorage'
import { isSoundEnabled, setSoundEnabled } from '../utils/sounds'
import { isMobileDevice, hideAddressBar, showAddressBar, isAddressBarHidingSupported, isStandaloneMode } from '../utils/mobileUtils'
import ThemeToggle from './ThemeToggle'
import History from './common/History'
import PWAInstallPrompt from './PWAInstallPrompt'
import Tutorial from './Tutorial'
import StandardCalculator from './calculators/StandardCalculator'
import ScientificCalculator from './calculators/ScientificCalculator'
import ProgrammerCalculator from './calculators/ProgrammerCalculator'
import ConverterCalculator from './calculators/ConverterCalculator'
import './CalculatorApp.css'

const CALCULATOR_TYPES = [
  { 
    key: 'standard', 
    label: 'Basic', 
    icon: '🔢', 
    component: StandardCalculator,
    description: 'Basic arithmetic operations'
  },
  { 
    key: 'scientific', 
    label: 'Scientific', 
    icon: 'ƒ(x)', 
    component: ScientificCalculator,
    description: 'Advanced mathematical functions'
  },
  { 
    key: 'programmer', 
    label: 'Programmer', 
    icon: '⌨️', 
    component: ProgrammerCalculator,
    description: 'Binary, hex, and logical operations'
  },
  { 
    key: 'converter', 
    label: 'Converter', 
    icon: '⇄', 
    component: ConverterCalculator,
    description: 'Unit and currency conversions'
  }
]

const CalculatorApp = () => {
  const { theme } = useTheme()
  const [activeCalculator, setActiveCalculator] = useState('standard')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [soundEnabled, setSoundEnabledState] = useState(isSoundEnabled())
  const [hideAddressBarMobile, setHideAddressBarMobile] = useState(() => {
    const settings = settingsManager.getSettings()
    return settings.hideAddressBarMobile
  })
  const dropdownRef = useRef(null)
  const settingsRef = useRef(null)

  const currentCalculator = CALCULATOR_TYPES.find(calc => calc.key === activeCalculator)
  const CalculatorComponent = currentCalculator?.component

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false)
      }
    }

    if (isDropdownOpen || isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen, isSettingsOpen])

  // Close dropdown on escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
        setIsHistoryOpen(false)
        setIsSettingsOpen(false)
      }
    }

    if (isDropdownOpen || isHistoryOpen || isSettingsOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDropdownOpen, isHistoryOpen, isSettingsOpen])

  const handleCalculatorSelect = (calculatorKey) => {
    setActiveCalculator(calculatorKey)
    setIsDropdownOpen(false)
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const toggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen)
  }

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen)
  }

  const toggleSound = () => {
    const newSoundState = !soundEnabled
    setSoundEnabled(newSoundState)
    setSoundEnabledState(newSoundState)
    
    // Play a test sound when enabling to confirm it works
    if (newSoundState) {
      // Small delay to ensure the setting is updated
      setTimeout(async () => {
        const { playSuccess } = await import('../utils/sounds')
        playSuccess()
      }, 100)
    }
  }

  const toggleHideAddressBar = () => {
    const newHideAddressBarState = !hideAddressBarMobile
    setHideAddressBarMobile(newHideAddressBarState)
    
    // Update settings in localStorage
    settingsManager.updateSettings({ hideAddressBarMobile: newHideAddressBarState })
    
    // Apply the change immediately
    if (newHideAddressBarState) {
      hideAddressBar()
    } else {
      showAddressBar()
    }
  }

  const resetTutorial = () => {
    settingsManager.updateSettings({ hasSeenTutorial: false })
    setIsSettingsOpen(false)
    // Reload the page to show tutorial again
    window.location.reload()
  }

  return (
    <div className={`calculator-app ${theme}`}>
      <PWAInstallPrompt />
      <Tutorial calculatorType={activeCalculator} />
      
      <header className="calculator-header">
        <div className="header-left nav-tabs" ref={dropdownRef}>
          <button 
            className="app-title-button"
            onClick={toggleDropdown}
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
            aria-label="Select calculator type"
          >
            <h1 className="app-title">Calculator</h1>
          </button>

          {isDropdownOpen && (
            <>
              <div className="dropdown-backdrop" onClick={() => setIsDropdownOpen(false)} />
              <div className="title-dropdown" role="listbox">
                <div className="dropdown-header">
                  <span className="dropdown-title">Choose Calculator</span>
                  <button 
                    className="dropdown-close"
                    onClick={() => setIsDropdownOpen(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="dropdown-list">
                  {CALCULATOR_TYPES.map((calc) => (
                    <button
                      key={calc.key}
                      className={`dropdown-item ${calc.key === activeCalculator ? 'active' : ''}`}
                      onClick={() => handleCalculatorSelect(calc.key)}
                      role="option"
                      aria-selected={calc.key === activeCalculator}
                    >
                      <div className="item-content">
                        <div className="item-header">
                          <span className="item-icon">{calc.icon}</span>
                          <span className="item-label">{calc.label}</span>
                          {calc.key === activeCalculator && (
                            <span className="item-check">✓</span>
                          )}
                        </div>
                        <span className="item-description">{calc.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="header-right">
          <button 
            className="history-btn history-toggle"
            onClick={toggleHistory}
            title="View calculation history"
            aria-label="View calculation history"
          >
            📝
          </button>
          <div className="settings-container" ref={settingsRef}>
            <button 
              className="settings-btn"
              onClick={toggleSettings}
              title="Settings"
              aria-label="Settings"
            >
              ⚙️
            </button>
            {isSettingsOpen && (
              <>
                <div className="dropdown-backdrop" onClick={() => setIsSettingsOpen(false)} />
                <div className="settings-dropdown">
                  <div className="dropdown-header">
                    <span className="dropdown-title">Settings</span>
                    <button 
                      className="dropdown-close"
                      onClick={() => setIsSettingsOpen(false)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                  <div className="settings-list">
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Sound Effects</span>
                        <span className="setting-description">Button click sounds</span>
                      </div>
                      <button 
                        className={`setting-toggle ${soundEnabled ? 'active' : ''}`}
                        onClick={toggleSound}
                        aria-label={`${soundEnabled ? 'Disable' : 'Enable'} sound effects`}
                      >
                        <div className="toggle-track">
                          <div className="toggle-thumb"></div>
                        </div>
                      </button>
                    </div>
                    
                    {/* Show info for standalone mode users */}
                    {isStandaloneMode() && (
                      <div className="setting-item">
                        <div className="setting-info">
                          <span className="setting-label">Fullscreen Mode</span>
                          <span className="setting-description">
                            ✅ Already running in fullscreen mode
                          </span>
                        </div>
                        <div className="setting-status">
                          Active
                        </div>
                      </div>
                    )}
                    
                    {/* Only show address bar setting if it's supported */}
                    {isAddressBarHidingSupported() && (
                      <div className="setting-item">
                        <div className="setting-info">
                          <span className="setting-label">Hide Address Bar</span>
                          <span className="setting-description">
                            Hide the address bar for fullscreen experience
                          </span>
                        </div>
                        <button 
                          className={`setting-toggle ${hideAddressBarMobile ? 'active' : ''}`}
                          onClick={toggleHideAddressBar}
                          aria-label={`${hideAddressBarMobile ? 'Disable' : 'Enable'} hide address bar`}
                        >
                          <div className="toggle-track">
                            <div className="toggle-thumb"></div>
                          </div>
                        </button>
                      </div>
                    )}
                    
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Show Tutorial</span>
                        <span className="setting-description">Replay the welcome tour</span>
                      </div>
                      <button 
                        className="setting-action"
                        onClick={resetTutorial}
                      >
                        Replay
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <ThemeToggle />
        </div>
      </header>
      
      <main className="calculator-main">
        <div className="calculator-wrapper">
          {CalculatorComponent && <CalculatorComponent />}
        </div>
      </main>

      <History 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />
    </div>
  )
}

export default CalculatorApp 