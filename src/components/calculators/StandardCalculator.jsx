import React, { useState, useEffect, useCallback, useRef } from 'react'
import Display from '../common/Display'
import Button from '../common/Button'
import { evaluate, formatNumber } from '../../utils/calculator'
import { useCalculatorHistory } from '../common/History'
import './StandardCalculator.css'

const StandardCalculator = () => {
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState(null)
  const [operation, setOperation] = useState(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  const [expression, setExpression] = useState('')
  
  // Add debouncing refs
  const isProcessing = useRef(false)
  const lastInputTime = useRef(0)
  const inputQueue = useRef([])
  const debounceTimeout = useRef(null)
  
  const { addToHistory } = useCalculatorHistory()

  // Debounced input processor
  const processInputQueue = useCallback(() => {
    if (inputQueue.current.length === 0 || isProcessing.current) return
    
    isProcessing.current = true
    const input = inputQueue.current.shift()
    
    try {
      input.action()
    } catch (error) {
      console.warn('Calculator input error:', error)
      setDisplay('Error')
    } finally {
      isProcessing.current = false
      
      // Process next input if any
      if (inputQueue.current.length > 0) {
        setTimeout(processInputQueue, 50)
      }
    }
  }, [])

  // Safe input wrapper
  const safeInput = useCallback((action, priority = false) => {
    const now = Date.now()
    
    // Rate limiting: prevent inputs faster than 50ms
    if (now - lastInputTime.current < 50) {
      return
    }
    
    lastInputTime.current = now
    
    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }
    
    // Add to queue
    if (priority) {
      inputQueue.current.unshift({ action, timestamp: now })
    } else {
      inputQueue.current.push({ action, timestamp: now })
    }
    
    // Limit queue size
    if (inputQueue.current.length > 10) {
      inputQueue.current.splice(5) // Keep only last 5 inputs
    }
    
    // Debounce processing
    debounceTimeout.current = setTimeout(processInputQueue, 30)
  }, [processInputQueue])

  const inputNumber = useCallback((num) => {
    const action = () => {
      if (waitingForOperand || display === 'Error') {
        setDisplay(String(num))
        setWaitingForOperand(false)
        setExpression(String(num))
      } else {
        const newDisplay = display === '0' ? String(num) : display + num
        // Limit display length to prevent overflow
        if (newDisplay.length <= 15) {
          setDisplay(newDisplay)
          setExpression(prev => prev + num)
        }
      }
    }
    safeInput(action)
  }, [display, waitingForOperand, safeInput])

  const inputDecimal = useCallback(() => {
    const action = () => {
      if (waitingForOperand || display === 'Error') {
        setDisplay('0.')
        setWaitingForOperand(false)
        setExpression('0.')
      } else if (display.indexOf('.') === -1) {
        setDisplay(display + '.')
        setExpression(prev => prev + '.')
      }
    }
    safeInput(action)
  }, [display, waitingForOperand, safeInput])

  const clear = useCallback(() => {
    const action = () => {
      setDisplay('0')
      setPreviousValue(null)
      setOperation(null)
      setWaitingForOperand(false)
      setExpression('')
      
      // Clear input queue on clear
      inputQueue.current = []
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
    safeInput(action, true) // Priority action
  }, [safeInput])

  const performOperation = useCallback((nextOperation) => {
    const action = () => {
      const inputValue = parseFloat(display)
      
      if (isNaN(inputValue)) {
        setDisplay('Error')
        return
      }
      
      // Map display symbols to calculation operations
      const operationMap = {
        '÷': '/',
        '×': '*', 
        '−': '-',
        '+': '+'
      }
      
      // Convert display symbol to calculation operation if needed
      const calcOperation = operationMap[nextOperation] || nextOperation

      if (previousValue === null) {
        setPreviousValue(inputValue)
        setExpression(display + ' ' + nextOperation + ' ')
      } else if (operation) {
        try {
          const currentValue = previousValue || 0
          const newValue = evaluate(currentValue, inputValue, operation)

          if (isNaN(newValue) || !isFinite(newValue)) {
            setDisplay('Error')
            setPreviousValue(null)
            setOperation(null)
            setWaitingForOperand(true)
            setExpression('')
            return
          }

          setDisplay(formatNumber(newValue))
          setPreviousValue(newValue)
          setExpression(formatNumber(newValue) + ' ' + nextOperation + ' ')
        } catch (error) {
          setDisplay('Error')
          setPreviousValue(null)
          setOperation(null)
          setWaitingForOperand(true)
          setExpression('')
          return
        }
      }

      setWaitingForOperand(true)
      setOperation(calcOperation) // Store the actual operation for calculation
    }
    safeInput(action)
  }, [display, previousValue, operation, safeInput])

  const calculate = useCallback(() => {
    const action = () => {
      const inputValue = parseFloat(display)

      if (isNaN(inputValue) || previousValue === null || !operation) {
        return
      }

      try {
        const newValue = evaluate(previousValue, inputValue, operation)
        
        if (isNaN(newValue) || !isFinite(newValue)) {
          setDisplay('Error')
          setPreviousValue(null)
          setOperation(null)
          setWaitingForOperand(true)
          setExpression('')
          return
        }
        
        const result = formatNumber(newValue)
        const fullExpression = expression + display
        
        // Add to history with calculator type
        addToHistory(fullExpression, result, 'standard')
        
        setDisplay(result)
        setPreviousValue(null)
        setOperation(null)
        setWaitingForOperand(true)
        setExpression('')
      } catch (error) {
        console.warn('Calculation error:', error)
        setDisplay('Error')
        setPreviousValue(null)
        setOperation(null)
        setWaitingForOperand(true)
        setExpression('')
      }
    }
    safeInput(action, true) // Priority action
  }, [display, previousValue, operation, expression, addToHistory, safeInput])

  const handleBackspace = useCallback(() => {
    const action = () => {
      if (!waitingForOperand && display !== 'Error') {
        if (display.length > 1) {
          setDisplay(display.slice(0, -1))
        } else {
          setDisplay('0')
        }
      }
    }
    safeInput(action)
  }, [display, waitingForOperand, safeInput])

  const toggleSign = useCallback(() => {
    const action = () => {
      if (display !== '0' && display !== 'Error') {
        setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display)
      }
    }
    safeInput(action)
  }, [display, safeInput])

  const percentage = useCallback(() => {
    const action = () => {
      if (display !== 'Error') {
        const value = parseFloat(display)
        if (!isNaN(value) && isFinite(value)) {
          setDisplay(formatNumber(value / 100))
        } else {
          setDisplay('Error')
        }
      }
    }
    safeInput(action)
  }, [display, safeInput])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
      inputQueue.current = []
    }
  }, [])

  // Keyboard support with debouncing
  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key } = event
      
      if (key >= '0' && key <= '9') {
        event.preventDefault()
        inputNumber(parseInt(key))
      } else if (key === '.') {
        event.preventDefault()
        inputDecimal()
      } else if (key === '+') {
        event.preventDefault()
        performOperation('+')
      } else if (key === '-') {
        event.preventDefault()
        performOperation('-')
      } else if (key === '*') {
        event.preventDefault()
        performOperation('*')
      } else if (key === '/') {
        event.preventDefault()
        performOperation('/')
      } else if (key === 'Enter' || key === '=') {
        event.preventDefault()
        calculate()
      } else if (key === 'Escape' || key === 'c' || key === 'C') {
        event.preventDefault()
        clear()
      } else if (key === 'Backspace') {
        event.preventDefault()
        handleBackspace()
      } else if (key === '%') {
        event.preventDefault()
        percentage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [inputNumber, inputDecimal, performOperation, calculate, clear, handleBackspace, percentage])

  return (
    <div className="standard-calculator">
      <Display value={display} />
      
      <div className="button-grid">
        {/* Row 1: AC, ±, %, / */}
        <Button onClick={clear} variant="secondary" debounceMs={100}>AC</Button>
        <Button onClick={toggleSign} variant="secondary" debounceMs={100}>±</Button>
        <Button onClick={percentage} variant="secondary" debounceMs={100}>%</Button>
        <Button onClick={() => performOperation('/')} variant="operator" debounceMs={100}>÷</Button>
        
        {/* Row 2: 7, 8, 9, * */}
        <Button onClick={() => inputNumber('7')} debounceMs={100}>7</Button>
        <Button onClick={() => inputNumber('8')} debounceMs={100}>8</Button>
        <Button onClick={() => inputNumber('9')} debounceMs={100}>9</Button>
        <Button onClick={() => performOperation('*')} variant="operator" debounceMs={100}>×</Button>
        
        {/* Row 3: 4, 5, 6, - */}
        <Button onClick={() => inputNumber('4')} debounceMs={100}>4</Button>
        <Button onClick={() => inputNumber('5')} debounceMs={100}>5</Button>
        <Button onClick={() => inputNumber('6')} debounceMs={100}>6</Button>
        <Button onClick={() => performOperation('-')} variant="operator" debounceMs={100}>−</Button>
        
        {/* Row 4: 1, 2, 3, + */}
        <Button onClick={() => inputNumber('1')} debounceMs={100}>1</Button>
        <Button onClick={() => inputNumber('2')} debounceMs={100}>2</Button>
        <Button onClick={() => inputNumber('3')} debounceMs={100}>3</Button>
        <Button onClick={() => performOperation('+')} variant="operator" debounceMs={100}>+</Button>
        
        {/* Row 5: 0, ., = */}
        <Button onClick={() => inputNumber('0')} className="span-2" debounceMs={100}>0</Button>
        <Button onClick={inputDecimal} debounceMs={100}>.</Button>
        <Button onClick={calculate} variant="operator" debounceMs={100}>=</Button>
      </div>
    </div>
  )
}

export default StandardCalculator 