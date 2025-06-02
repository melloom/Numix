import React, { useState, useRef, useEffect } from 'react'
import './CalculatorSelector.css'

const CalculatorSelector = ({ calculators, activeCalculator, onCalculatorChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectorRef = useRef(null)
  const buttonRef = useRef(null)

  const activeCalc = calculators.find(calc => calc.key === activeCalculator)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close dropdown on escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleCalculatorSelect = (calculatorKey) => {
    onCalculatorChange(calculatorKey)
    setIsOpen(false)
  }

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="calculator-selector" ref={selectorRef}>
      <button 
        ref={buttonRef}
        className={`calc-selector-button ${isOpen ? 'open' : ''}`}
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select calculator type"
      >
        <div className="selector-content">
          <span className="selector-icon">{activeCalc?.icon}</span>
          <div className="selector-text">
            <span className="selector-label">{activeCalc?.label}</span>
            <span className="selector-description">{activeCalc?.description}</span>
          </div>
        </div>
        <svg 
          className={`selector-arrow ${isOpen ? 'rotated' : ''}`} 
          width="20" 
          height="20" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="selector-backdrop" onClick={() => setIsOpen(false)} />
          <div className="selector-dropdown" role="listbox">
            <div className="dropdown-header">
              <span className="dropdown-title">Choose Calculator</span>
              <button 
                className="dropdown-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="dropdown-list">
              {calculators.map((calc) => (
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
  )
}

export default CalculatorSelector 