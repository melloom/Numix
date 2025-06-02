import React, { useState, useEffect, useCallback } from 'react'
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
  
  const { addToHistory } = useCalculatorHistory()

  const inputNumber = useCallback((num) => {
    if (waitingForOperand || display === 'Error') {
      setDisplay(String(num))
      setWaitingForOperand(false)
      setExpression(String(num))
    } else {
      const newDisplay = display === '0' ? String(num) : display + num
      setDisplay(newDisplay)
      setExpression(prev => prev + num)
    }
  }, [display, waitingForOperand])

  const inputDecimal = useCallback(() => {
    if (waitingForOperand || display === 'Error') {
      setDisplay('0.')
      setWaitingForOperand(false)
      setExpression('0.')
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.')
      setExpression(prev => prev + '.')
    }
  }, [display, waitingForOperand])

  const clear = useCallback(() => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setWaitingForOperand(false)
    setExpression('')
  }, [])

  const performOperation = useCallback((nextOperation) => {
    const inputValue = parseFloat(display)
    
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
      const currentValue = previousValue || 0
      const newValue = evaluate(currentValue, inputValue, operation)

      setDisplay(formatNumber(newValue))
      setPreviousValue(newValue)
      setExpression(formatNumber(newValue) + ' ' + nextOperation + ' ')
    }

    setWaitingForOperand(true)
    setOperation(calcOperation) // Store the actual operation for calculation
  }, [display, previousValue, operation])

  const calculate = useCallback(() => {
    const inputValue = parseFloat(display)

    if (previousValue !== null && operation) {
      try {
        const newValue = evaluate(previousValue, inputValue, operation)
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
        setDisplay('Error')
        setPreviousValue(null)
        setOperation(null)
        setWaitingForOperand(true)
        setExpression('')
      }
    }
  }, [display, previousValue, operation, expression, addToHistory])

  const handleBackspace = useCallback(() => {
    if (!waitingForOperand && display !== 'Error') {
      if (display.length > 1) {
        setDisplay(display.slice(0, -1))
      } else {
        setDisplay('0')
      }
    }
  }, [display, waitingForOperand])

  const toggleSign = useCallback(() => {
    if (display !== '0' && display !== 'Error') {
      setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display)
    }
  }, [display])

  const percentage = useCallback(() => {
    if (display !== 'Error') {
      const value = parseFloat(display)
      if (!isNaN(value)) {
        setDisplay(formatNumber(value / 100))
      }
    }
  }, [display])

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
        <Button onClick={clear} variant="secondary">AC</Button>
        <Button onClick={toggleSign} variant="secondary">±</Button>
        <Button onClick={percentage} variant="secondary">%</Button>
        <Button onClick={() => performOperation('/')} variant="operator">÷</Button>
        
        {/* Row 2: 7, 8, 9, * */}
        <Button onClick={() => inputNumber('7')}>7</Button>
        <Button onClick={() => inputNumber('8')}>8</Button>
        <Button onClick={() => inputNumber('9')}>9</Button>
        <Button onClick={() => performOperation('*')} variant="operator">×</Button>
        
        {/* Row 3: 4, 5, 6, - */}
        <Button onClick={() => inputNumber('4')}>4</Button>
        <Button onClick={() => inputNumber('5')}>5</Button>
        <Button onClick={() => inputNumber('6')}>6</Button>
        <Button onClick={() => performOperation('-')} variant="operator">−</Button>
        
        {/* Row 4: 1, 2, 3, + */}
        <Button onClick={() => inputNumber('1')}>1</Button>
        <Button onClick={() => inputNumber('2')}>2</Button>
        <Button onClick={() => inputNumber('3')}>3</Button>
        <Button onClick={() => performOperation('+')} variant="operator">+</Button>
        
        {/* Row 5: 0 (spans 2 columns), ., = */}
        <Button onClick={() => inputNumber('0')} className="span-2">0</Button>
        <Button onClick={inputDecimal}>.</Button>
        <Button onClick={calculate} variant="operator">=</Button>
      </div>
    </div>
  )
}

export default StandardCalculator 