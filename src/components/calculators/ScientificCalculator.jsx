import React, { useState, useCallback, useEffect } from 'react'
import Display from '../common/Display'
import Button from '../common/Button'
import { scientificOperations, formatNumber, evaluate } from '../../utils/calculator'
import './ScientificCalculator.css'

const SCIENTIFIC_MODES = [
  { key: 'basic', label: 'Basic', icon: '🔢' },
  { key: 'trig', label: 'Trig', icon: '📐' },
  { key: 'log', label: 'Log', icon: '📊' },
  { key: 'advanced', label: 'Advanced', icon: '🧮' }
]

const ScientificCalculator = () => {
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [previousValue, setPreviousValue] = useState(null)
  const [operation, setOperation] = useState(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  const [memory, setMemory] = useState(0)
  const [angleMode, setAngleMode] = useState('deg') // deg or rad
  const [scientificMode, setScientificMode] = useState('basic')
  const [showSecondFunctions, setShowSecondFunctions] = useState(false)

  const convertAngle = useCallback((value, fromDeg = true) => {
    if (angleMode === 'deg' && !fromDeg) {
      return (value * 180) / Math.PI
    } else if (angleMode === 'rad' && fromDeg) {
      return (value * Math.PI) / 180
    }
    return value
  }, [angleMode])

  const inputNumber = useCallback((num) => {
    if (waitingForOperand) {
      setDisplay(String(num))
      setWaitingForOperand(false)
    } else {
      setDisplay(display === '0' ? String(num) : display + num)
    }
  }, [display, waitingForOperand])

  const inputDecimal = useCallback(() => {
    if (waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.')
    }
  }, [display, waitingForOperand])

  const clear = useCallback(() => {
    setDisplay('0')
    setExpression('')
    setPreviousValue(null)
    setOperation(null)
    setWaitingForOperand(false)
  }, [])

  const clearEntry = useCallback(() => {
    setDisplay('0')
  }, [])

  const performBasicOperation = useCallback((nextOperation) => {
    const inputValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation) {
      const currentValue = previousValue || 0
      const newValue = evaluate(currentValue, inputValue, operation)
      setDisplay(formatNumber(newValue))
      setPreviousValue(newValue)
    }

    setWaitingForOperand(true)
    setOperation(nextOperation)
  }, [display, previousValue, operation])

  const calculate = useCallback(() => {
    const inputValue = parseFloat(display)

    if (previousValue !== null && operation) {
      const newValue = evaluate(previousValue, inputValue, operation)
      setDisplay(formatNumber(newValue))
      setPreviousValue(null)
      setOperation(null)
      setWaitingForOperand(true)
    }
  }, [display, previousValue, operation])

  const performScientificOperation = useCallback((op) => {
    try {
      const value = parseFloat(display)
      let result

      switch (op) {
        // Trigonometric functions
        case 'sin':
          result = scientificOperations.sin(convertAngle(value))
          break
        case 'cos':
          result = scientificOperations.cos(convertAngle(value))
          break
        case 'tan':
          result = scientificOperations.tan(convertAngle(value))
          break
        case 'asin':
          result = convertAngle(scientificOperations.asin(value), false)
          break
        case 'acos':
          result = convertAngle(scientificOperations.acos(value), false)
          break
        case 'atan':
          result = convertAngle(scientificOperations.atan(value), false)
          break
        case 'sinh':
          result = scientificOperations.sinh(value)
          break
        case 'cosh':
          result = scientificOperations.cosh(value)
          break
        case 'tanh':
          result = scientificOperations.tanh(value)
          break
        
        // Logarithmic functions
        case 'log':
          result = scientificOperations.log(value)
          break
        case 'ln':
          result = scientificOperations.ln(value)
          break
        case 'exp':
          result = scientificOperations.exp(value)
          break
        case '10^x':
          result = Math.pow(10, value)
          break
        case 'e^x':
          result = scientificOperations.exp(value)
          break
        
        // Power and root functions
        case 'sqrt':
          result = scientificOperations.sqrt(value)
          break
        case 'cbrt':
          result = scientificOperations.cbrt(value)
          break
        case 'x²':
          result = Math.pow(value, 2)
          break
        case 'x³':
          result = Math.pow(value, 3)
          break
        case '1/x':
          result = scientificOperations.reciprocal(value)
          break
        case 'x!':
          result = scientificOperations.factorial(Math.floor(Math.abs(value)))
          break
        
        // Constants
        case 'π':
          result = scientificOperations.pi()
          break
        case 'e':
          result = scientificOperations.e()
          break
        
        // Memory functions
        case 'MS':
          setMemory(value)
          return
        case 'MR':
          result = memory
          break
        case 'M+':
          setMemory(memory + value)
          return
        case 'M-':
          setMemory(memory - value)
          return
        case 'MC':
          setMemory(0)
          return
        
        default:
          return
      }

      setDisplay(formatNumber(result))
      setWaitingForOperand(true)
    } catch (error) {
      setDisplay('Error')
      setWaitingForOperand(true)
    }
  }, [display, convertAngle, memory])

  const toggleAngleMode = useCallback(() => {
    setAngleMode(prev => prev === 'deg' ? 'rad' : 'deg')
  }, [])

  const toggleSecondFunctions = useCallback(() => {
    setShowSecondFunctions(prev => !prev)
  }, [])

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key } = event
      
      if (key >= '0' && key <= '9') {
        event.preventDefault()
        inputNumber(parseInt(key))
      } else if (key === '.') {
        event.preventDefault()
        inputDecimal()
      } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        event.preventDefault()
        performBasicOperation(key)
      } else if (key === 'Enter' || key === '=') {
        event.preventDefault()
        calculate()
      } else if (key === 'Escape') {
        event.preventDefault()
        clear()
      } else if (key === 'Delete') {
        event.preventDefault()
        clearEntry()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [inputNumber, inputDecimal, performBasicOperation, calculate, clear, clearEntry])

  const renderBasicMode = () => (
    <div className="scientific-grid basic-grid">
      <Button onClick={clear} variant="secondary">AC</Button>
      <Button onClick={clearEntry} variant="secondary">CE</Button>
      <Button onClick={() => performScientificOperation('MS')} variant="secondary">MS</Button>
      <Button onClick={() => performScientificOperation('MR')} variant="secondary">MR</Button>
      
      <Button onClick={() => performScientificOperation('MC')} variant="secondary">MC</Button>
      <Button onClick={() => performScientificOperation('M+')} variant="secondary">M+</Button>
      <Button onClick={() => performScientificOperation('M-')} variant="secondary">M-</Button>
      <Button onClick={() => performBasicOperation('/')} variant="operator">÷</Button>
      
      <Button onClick={() => performScientificOperation('sqrt')}>√x</Button>
      <Button onClick={() => performScientificOperation('x²')}>x²</Button>
      <Button onClick={() => performScientificOperation('1/x')}>1/x</Button>
      <Button onClick={() => performBasicOperation('*')} variant="operator">×</Button>
      
      <Button onClick={() => inputNumber(7)}>7</Button>
      <Button onClick={() => inputNumber(8)}>8</Button>
      <Button onClick={() => inputNumber(9)}>9</Button>
      <Button onClick={() => performBasicOperation('-')} variant="operator">−</Button>
      
      <Button onClick={() => inputNumber(4)}>4</Button>
      <Button onClick={() => inputNumber(5)}>5</Button>
      <Button onClick={() => inputNumber(6)}>6</Button>
      <Button onClick={() => performBasicOperation('+')} variant="operator">+</Button>
      
      <Button onClick={() => inputNumber(1)}>1</Button>
      <Button onClick={() => inputNumber(2)}>2</Button>
      <Button onClick={() => inputNumber(3)}>3</Button>
      <Button onClick={calculate} variant="operator" className="span-row-2">=</Button>
      
      <Button onClick={() => inputNumber(0)} className="span-2">0</Button>
      <Button onClick={inputDecimal}>.</Button>
    </div>
  )

  const renderTrigMode = () => (
    <div className="scientific-grid trig-grid">
      <Button onClick={toggleAngleMode} variant="secondary">{angleMode.toUpperCase()}</Button>
      <Button onClick={toggleSecondFunctions} variant="secondary">{showSecondFunctions ? '2nd' : '1st'}</Button>
      <Button onClick={() => performScientificOperation('π')} variant="secondary">π</Button>
      <Button onClick={() => performScientificOperation('e')} variant="secondary">e</Button>
      
      <Button onClick={() => performScientificOperation(showSecondFunctions ? 'asin' : 'sin')}>
        {showSecondFunctions ? 'sin⁻¹' : 'sin'}
      </Button>
      <Button onClick={() => performScientificOperation(showSecondFunctions ? 'acos' : 'cos')}>
        {showSecondFunctions ? 'cos⁻¹' : 'cos'}
      </Button>
      <Button onClick={() => performScientificOperation(showSecondFunctions ? 'atan' : 'tan')}>
        {showSecondFunctions ? 'tan⁻¹' : 'tan'}
      </Button>
      <Button onClick={() => performBasicOperation('/')} variant="operator">÷</Button>
      
      <Button onClick={() => performScientificOperation(showSecondFunctions ? 'sinh' : 'sinh')}>
        {showSecondFunctions ? 'sinh⁻¹' : 'sinh'}
      </Button>
      <Button onClick={() => performScientificOperation(showSecondFunctions ? 'cosh' : 'cosh')}>
        {showSecondFunctions ? 'cosh⁻¹' : 'cosh'}
      </Button>
      <Button onClick={() => performScientificOperation(showSecondFunctions ? 'tanh' : 'tanh')}>
        {showSecondFunctions ? 'tanh⁻¹' : 'tanh'}
      </Button>
      <Button onClick={() => performBasicOperation('*')} variant="operator">×</Button>
      
      <Button onClick={() => inputNumber(7)}>7</Button>
      <Button onClick={() => inputNumber(8)}>8</Button>
      <Button onClick={() => inputNumber(9)}>9</Button>
      <Button onClick={() => performBasicOperation('-')} variant="operator">−</Button>
      
      <Button onClick={() => inputNumber(4)}>4</Button>
      <Button onClick={() => inputNumber(5)}>5</Button>
      <Button onClick={() => inputNumber(6)}>6</Button>
      <Button onClick={() => performBasicOperation('+')} variant="operator">+</Button>
      
      <Button onClick={() => inputNumber(1)}>1</Button>
      <Button onClick={() => inputNumber(2)}>2</Button>
      <Button onClick={() => inputNumber(3)}>3</Button>
      <Button onClick={calculate} variant="operator" className="span-row-2">=</Button>
      
      <Button onClick={() => inputNumber(0)} className="span-2">0</Button>
      <Button onClick={inputDecimal}>.</Button>
    </div>
  )

  const renderLogMode = () => (
    <div className="scientific-grid log-grid">
      <Button onClick={() => performScientificOperation('log')}>log</Button>
      <Button onClick={() => performScientificOperation('ln')}>ln</Button>
      <Button onClick={() => performScientificOperation('10^x')}>10ˣ</Button>
      <Button onClick={() => performScientificOperation('e^x')}>eˣ</Button>
      
      <Button onClick={() => performScientificOperation('exp')}>exp</Button>
      <Button onClick={() => performScientificOperation('sqrt')}>√x</Button>
      <Button onClick={() => performScientificOperation('cbrt')}>∛x</Button>
      <Button onClick={() => performBasicOperation('/')} variant="operator">÷</Button>
      
      <Button onClick={() => performScientificOperation('x²')}>x²</Button>
      <Button onClick={() => performScientificOperation('x³')}>x³</Button>
      <Button onClick={() => performScientificOperation('1/x')}>1/x</Button>
      <Button onClick={() => performBasicOperation('*')} variant="operator">×</Button>
      
      <Button onClick={() => inputNumber(7)}>7</Button>
      <Button onClick={() => inputNumber(8)}>8</Button>
      <Button onClick={() => inputNumber(9)}>9</Button>
      <Button onClick={() => performBasicOperation('-')} variant="operator">−</Button>
      
      <Button onClick={() => inputNumber(4)}>4</Button>
      <Button onClick={() => inputNumber(5)}>5</Button>
      <Button onClick={() => inputNumber(6)}>6</Button>
      <Button onClick={() => performBasicOperation('+')} variant="operator">+</Button>
      
      <Button onClick={() => inputNumber(1)}>1</Button>
      <Button onClick={() => inputNumber(2)}>2</Button>
      <Button onClick={() => inputNumber(3)}>3</Button>
      <Button onClick={calculate} variant="operator" className="span-row-2">=</Button>
      
      <Button onClick={() => inputNumber(0)} className="span-2">0</Button>
      <Button onClick={inputDecimal}>.</Button>
    </div>
  )

  const renderAdvancedMode = () => (
    <div className="scientific-grid advanced-grid">
      <Button onClick={() => performScientificOperation('x!')}>x!</Button>
      <Button onClick={() => performScientificOperation('π')}>π</Button>
      <Button onClick={() => performScientificOperation('e')}>e</Button>
      <Button onClick={() => performScientificOperation('1/x')}>1/x</Button>
      
      <Button onClick={() => performScientificOperation('sqrt')}>√x</Button>
      <Button onClick={() => performScientificOperation('cbrt')}>∛x</Button>
      <Button onClick={() => performScientificOperation('x²')}>x²</Button>
      <Button onClick={() => performBasicOperation('/')} variant="operator">÷</Button>
      
      <Button onClick={() => performScientificOperation('log')}>log</Button>
      <Button onClick={() => performScientificOperation('ln')}>ln</Button>
      <Button onClick={() => performScientificOperation('exp')}>exp</Button>
      <Button onClick={() => performBasicOperation('*')} variant="operator">×</Button>
      
      <Button onClick={() => inputNumber(7)}>7</Button>
      <Button onClick={() => inputNumber(8)}>8</Button>
      <Button onClick={() => inputNumber(9)}>9</Button>
      <Button onClick={() => performBasicOperation('-')} variant="operator">−</Button>
      
      <Button onClick={() => inputNumber(4)}>4</Button>
      <Button onClick={() => inputNumber(5)}>5</Button>
      <Button onClick={() => inputNumber(6)}>6</Button>
      <Button onClick={() => performBasicOperation('+')} variant="operator">+</Button>
      
      <Button onClick={() => inputNumber(1)}>1</Button>
      <Button onClick={() => inputNumber(2)}>2</Button>
      <Button onClick={() => inputNumber(3)}>3</Button>
      <Button onClick={calculate} variant="operator" className="span-row-2">=</Button>
      
      <Button onClick={() => inputNumber(0)} className="span-2">0</Button>
      <Button onClick={inputDecimal}>.</Button>
    </div>
  )

  const renderCurrentMode = () => {
    switch (scientificMode) {
      case 'trig':
        return renderTrigMode()
      case 'log':
        return renderLogMode()
      case 'advanced':
        return renderAdvancedMode()
      default:
        return renderBasicMode()
    }
  }

  return (
    <div className="scientific-calculator">
      <Display 
        value={display} 
        subValue={`${angleMode.toUpperCase()} | Memory: ${formatNumber(memory)}`}
        label="Scientific Calculator"
      />
      
      <div className="scientific-mode-selector">
        {SCIENTIFIC_MODES.map((mode) => (
          <button
            key={mode.key}
            className={`mode-button ${scientificMode === mode.key ? 'active' : ''}`}
            onClick={() => setScientificMode(mode.key)}
          >
            <span className="mode-icon">{mode.icon}</span>
            <span className="mode-label">{mode.label}</span>
          </button>
        ))}
      </div>
      
      {renderCurrentMode()}
    </div>
  )
}

export default ScientificCalculator 