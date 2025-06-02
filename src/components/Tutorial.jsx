import React, { useState, useEffect } from 'react'
import { settingsManager } from '../utils/localStorage'
import './Tutorial.css'

const baseTutorialSteps = [
  {
    id: 'welcome',
    title: 'Welcome to Numix Calculator! 🧮',
    content: 'A powerful, modern calculator app with multiple modes and features.',
    position: 'center',
    showOverlay: true,
    actions: [
      { text: 'Take Tour', type: 'primary', action: 'next' },
      { text: 'Skip Tutorial', type: 'secondary', action: 'skip' }
    ]
  },
  {
    id: 'calculator-tabs',
    title: 'Calculator Types',
    content: 'Click here to switch between Standard, Scientific, and Converter modes.',
    target: '.app-title-button',
    position: 'bottom',
    showOverlay: true,
    actions: [
      { text: 'Next', type: 'primary', action: 'next' },
      { text: 'Skip All', type: 'secondary', action: 'skip' }
    ]
  },
  {
    id: 'display',
    title: 'Display & Results',
    content: 'Your calculations and results appear here. The display shows real-time input and final results.',
    target: '.display',
    position: 'top',
    showOverlay: true,
    actions: [
      { text: 'Next', type: 'primary', action: 'next' },
      { text: 'Previous', type: 'secondary', action: 'prev' }
    ]
  }
]

const calculatorSpecificSteps = {
  standard: [
    {
      id: 'standard-buttons',
      title: 'Basic Calculator Buttons',
      content: 'Use these buttons for basic arithmetic: addition (+), subtraction (−), multiplication (×), and division (÷). AC clears all, ± changes sign, and % calculates percentage.',
      target: '.button-grid',
      position: 'right',
      showOverlay: true,
      actions: [
        { text: 'Next', type: 'primary', action: 'next' },
        { text: 'Previous', type: 'secondary', action: 'prev' }
      ]
    }
  ],
  scientific: [
    {
      id: 'scientific-modes',
      title: 'Scientific Mode Selector',
      content: 'Switch between different scientific function groups: Basic, Trigonometry, Logarithms, and Advanced functions.',
      target: '.scientific-mode-selector',
      position: 'bottom',
      showOverlay: true,
      actions: [
        { text: 'Next', type: 'primary', action: 'next' },
        { text: 'Previous', type: 'secondary', action: 'prev' }
      ]
    },
    {
      id: 'scientific-buttons',
      title: 'Scientific Functions',
      content: 'Access advanced mathematical functions like sin, cos, tan, log, ln, powers, roots, and more. Functions change based on the selected mode above.',
      target: '.scientific-grid',
      position: 'right',
      showOverlay: true,
      actions: [
        { text: 'Next', type: 'primary', action: 'next' },
        { text: 'Previous', type: 'secondary', action: 'prev' }
      ]
    }
  ],
  converter: [
    {
      id: 'conversion-types',
      title: 'Conversion Types',
      content: 'Choose what type of conversion you want: Length, Weight, Temperature, Volume, Area, or Currency. Each type has different units available.',
      target: '.conversion-type-selector',
      position: 'bottom',
      showOverlay: true,
      actions: [
        { text: 'Next', type: 'primary', action: 'next' },
        { text: 'Previous', type: 'secondary', action: 'prev' }
      ]
    },
    {
      id: 'unit-selectors',
      title: 'Unit Selection',
      content: 'Select your "From" and "To" units here. Use the swap button (⇄) to quickly reverse the conversion direction.',
      target: '.unit-selectors',
      position: 'bottom',
      showOverlay: true,
      actions: [
        { text: 'Next', type: 'primary', action: 'next' },
        { text: 'Previous', type: 'secondary', action: 'prev' }
      ]
    },
    {
      id: 'converter-result',
      title: 'Live Conversion Results',
      content: 'Your conversion results appear here in real-time as you type. The result updates automatically when you change units or values.',
      target: '.result-display',
      position: 'bottom',
      showOverlay: true,
      actions: [
        { text: 'Next', type: 'primary', action: 'next' },
        { text: 'Previous', type: 'secondary', action: 'prev' }
      ]
    }
  ]
}

const endingSteps = [
  {
    id: 'theme-toggle',
    title: 'Theme Toggle',
    content: 'Switch between light and dark themes to match your preference.',
    target: '.theme-toggle',
    position: 'left',
    showOverlay: true,
    actions: [
      { text: 'Next', type: 'primary', action: 'next' },
      { text: 'Previous', type: 'secondary', action: 'prev' }
    ]
  },
  {
    id: 'history',
    title: 'Calculation History',
    content: 'View, search, and manage your calculation history. Export or delete calculations as needed.',
    target: '.history-toggle',
    position: 'left',
    showOverlay: true,
    actions: [
      { text: 'Next', type: 'primary', action: 'next' },
      { text: 'Previous', type: 'secondary', action: 'prev' }
    ]
  },
  {
    id: 'settings',
    title: 'Settings Menu',
    content: 'Access app settings: toggle sound effects, replay tutorial, and customize your experience.',
    target: '.settings-btn',
    position: 'left',
    showOverlay: true,
    actions: [
      { text: 'Next', type: 'primary', action: 'next' },
      { text: 'Previous', type: 'secondary', action: 'prev' }
    ]
  },
  {
    id: 'features',
    title: 'You\'re All Set! ✨',
    content: 'You now know the main features: multiple calculator modes, calculation history, keyboard shortcuts, themes, and PWA installation. Happy calculating!',
    position: 'center',
    showOverlay: true,
    actions: [
      { text: 'Finish Tour', type: 'primary', action: 'finish' },
      { text: 'Previous', type: 'secondary', action: 'prev' }
    ]
  }
]

const Tutorial = ({ calculatorType = 'standard' }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState(null)
  const [tutorialSteps, setTutorialSteps] = useState([])

  // Build tutorial steps based on calculator type
  useEffect(() => {
    const specificSteps = calculatorSpecificSteps[calculatorType] || calculatorSpecificSteps.standard
    const allSteps = [...baseTutorialSteps, ...specificSteps, ...endingSteps]
    setTutorialSteps(allSteps)
  }, [calculatorType])

  useEffect(() => {
    // Check if tutorial should be shown - only for completely new users
    const settings = settingsManager.getSettings()
    const hasSeenTutorial = settings.hasSeenTutorial || false
    
    // Only show tutorial if user has never seen it at all
    // Remove the per-calculator-type logic to make it truly one-time
    if (!hasSeenTutorial) {
      // Small delay to let the app render first
      setTimeout(() => {
        setIsVisible(true)
        setCurrentStep(0)
      }, 1000)
    }
  }, [calculatorType, tutorialSteps]) // Removed dependency that caused re-triggering

  useEffect(() => {
    if (isVisible) {
      // Disable scrolling when tutorial is active
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      
      return () => {
        // Re-enable scrolling when tutorial closes
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
      }
    }
  }, [isVisible])

  useEffect(() => {
    if (isVisible && tutorialSteps[currentStep]?.target) {
      const element = document.querySelector(tutorialSteps[currentStep].target)
      setTargetElement(element)
      
      if (element) {
        // Scroll element into view first
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        })
        
        // Wait for scroll to complete before adding highlight
        setTimeout(() => {
          element.classList.add('tutorial-highlight')
        }, 300)
        
        return () => {
          element.classList.remove('tutorial-highlight')
        }
      }
    }
  }, [currentStep, isVisible, tutorialSteps])

  const handleAction = (action) => {
    switch (action) {
      case 'next':
        if (currentStep < tutorialSteps.length - 1) {
          setCurrentStep(currentStep + 1)
        } else {
          finishTutorial()
        }
        break
      case 'prev':
        if (currentStep > 0) {
          setCurrentStep(currentStep - 1)
        }
        break
      case 'skip':
      case 'finish':
        finishTutorial()
        break
      default:
        break
    }
  }

  const finishTutorial = () => {
    setIsVisible(false)
    // Mark tutorial as seen globally - no longer track per calculator type
    settingsManager.updateSettings({ 
      hasSeenTutorial: true
      // Removed lastCalculatorTutorial to make it truly one-time
    })
    
    // Remove any remaining highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight')
    })
  }

  const getTooltipPosition = () => {
    if (!targetElement || !tutorialSteps[currentStep]?.target) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }

    const rect = targetElement.getBoundingClientRect()
    let position = tutorialSteps[currentStep].position
    const tooltipWidth = 320
    const estimatedHeight = 250 // Estimated max height for positioning calculations
    const tooltipOffset = 20 // Reduced offset to keep closer but not overlap
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const padding = 10 // Minimum distance from viewport edges

    // Intelligent fallback positioning with viewport bounds
    const canFitTop = rect.top - estimatedHeight - tooltipOffset >= padding
    const canFitBottom = rect.bottom + estimatedHeight + tooltipOffset <= windowHeight - padding
    const canFitLeft = rect.left - tooltipWidth - tooltipOffset >= padding
    const canFitRight = rect.right + tooltipWidth + tooltipOffset <= windowWidth - padding

    // Choose best position if preferred position doesn't fit
    if (position === 'top' && !canFitTop) {
      position = canFitBottom ? 'bottom' : canFitRight ? 'right' : canFitLeft ? 'left' : 'center'
    } else if (position === 'bottom' && !canFitBottom) {
      position = canFitTop ? 'top' : canFitRight ? 'right' : canFitLeft ? 'left' : 'center'
    } else if (position === 'left' && !canFitLeft) {
      position = canFitRight ? 'right' : canFitBottom ? 'bottom' : canFitTop ? 'top' : 'center'
    } else if (position === 'right' && !canFitRight) {
      position = canFitLeft ? 'left' : canFitBottom ? 'bottom' : canFitTop ? 'top' : 'center'
    }

    // Calculate positions ensuring they stay within viewport
    switch (position) {
      case 'top':
        return {
          top: Math.max(padding, rect.top - estimatedHeight - tooltipOffset),
          left: Math.max(padding, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, windowWidth - tooltipWidth - padding)),
          transform: 'translate(0, 0)'
        }
      case 'bottom':
        return {
          top: Math.min(rect.bottom + tooltipOffset, windowHeight - estimatedHeight - padding),
          left: Math.max(padding, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, windowWidth - tooltipWidth - padding)),
          transform: 'translate(0, 0)'
        }
      case 'left':
        return {
          top: Math.max(padding, Math.min(rect.top + rect.height / 2 - estimatedHeight / 2, windowHeight - estimatedHeight - padding)),
          left: Math.max(padding, rect.left - tooltipWidth - tooltipOffset),
          transform: 'translate(0, 0)'
        }
      case 'right':
        return {
          top: Math.max(padding, Math.min(rect.top + rect.height / 2 - estimatedHeight / 2, windowHeight - estimatedHeight - padding)),
          left: Math.min(rect.right + tooltipOffset, windowWidth - tooltipWidth - padding),
          transform: 'translate(0, 0)'
        }
      case 'center':
      default:
        return {
          top: Math.max(padding, Math.min(windowHeight / 2 - estimatedHeight / 2, windowHeight - estimatedHeight - padding)),
          left: Math.max(padding, Math.min(windowWidth / 2 - tooltipWidth / 2, windowWidth - tooltipWidth - padding)),
          transform: 'translate(0, 0)'
        }
    }
  }

  if (!isVisible || tutorialSteps.length === 0) return null

  const step = tutorialSteps[currentStep]
  const tooltipStyle = getTooltipPosition()

  return (
    <>
      {/* Backdrop */}
      <div className="tutorial-backdrop" />
      
      {/* Spotlight for target element */}
      {targetElement && (
        <div 
          className="tutorial-spotlight"
          style={{
            top: targetElement.getBoundingClientRect().top - 8,
            left: targetElement.getBoundingClientRect().left - 8,
            width: targetElement.getBoundingClientRect().width + 16,
            height: targetElement.getBoundingClientRect().height + 16,
          }}
        />
      )}
      
      {/* Tutorial tooltip */}
      <div 
        className={`tutorial-tooltip ${step.position === 'center' ? 'tutorial-tooltip--center' : ''}`}
        style={tooltipStyle}
      >
        <div className="tutorial-content">
          <div className="tutorial-header">
            <h3 className="tutorial-title">{step.title}</h3>
            <div className="tutorial-progress">
              <span>{currentStep + 1}</span>
              <span>/</span>
              <span>{tutorialSteps.length}</span>
            </div>
          </div>
          
          <div className="tutorial-body">
            <p className="tutorial-text">{step.content}</p>
          </div>
          
          <div className="tutorial-footer">
            <div className="tutorial-actions">
              {step.actions.map((action, index) => (
                <button
                  key={index}
                  className={`tutorial-btn tutorial-btn--${action.type}`}
                  onClick={() => handleAction(action.action)}
                >
                  {action.text}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="tutorial-progress-bar">
          <div 
            className="tutorial-progress-fill"
            style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
          />
        </div>
        
        {/* Arrow pointing to target */}
        {targetElement && step.position !== 'center' && (
          <div className={`tutorial-arrow tutorial-arrow--${step.position}`} />
        )}
      </div>
    </>
  )
}

export default Tutorial 