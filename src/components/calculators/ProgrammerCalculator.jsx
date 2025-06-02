import React, { useState } from 'react'
import Display from '../common/Display'
import Button from '../common/Button'
import { programmerOperations } from '../../utils/calculator'
import './ProgrammerCalculator.css'

const ProgrammerCalculator = () => {
  const [display, setDisplay] = useState('0')
  const [base, setBase] = useState(10) // 2, 8, 10, 16
  const [memory, setMemory] = useState(0)

  const getBaseLabel = () => {
    switch (base) {
      case 2: return 'BIN'
      case 8: return 'OCT'
      case 10: return 'DEC'
      case 16: return 'HEX'
      default: return 'DEC'
    }
  }

  const convertToBase = (value, targetBase) => {
    const num = parseInt(value, base)
    if (isNaN(num)) return '0'
    
    switch (targetBase) {
      case 2: return programmerOperations.toBinary(num)
      case 8: return programmerOperations.toOctal(num)
      case 10: return num.toString()
      case 16: return programmerOperations.toHexadecimal(num)
      default: return num.toString()
    }
  }

  const handleNumber = (digit) => {
    // Check if digit is valid for current base
    const maxDigit = base === 16 ? 'F' : (base - 1).toString()
    if (base === 2 && digit > 1) return
    if (base === 8 && digit > 7) return
    if (base === 10 && isNaN(digit)) return
    
    if (display === '0') {
      setDisplay(String(digit))
    } else {
      setDisplay(display + digit)
    }
  }

  const changeBase = (newBase) => {
    const convertedValue = convertToBase(display, newBase)
    setBase(newBase)
    setDisplay(convertedValue)
  }

  const handleBitwiseOperation = (operation) => {
    try {
      const value = parseInt(display, base)
      let result
      
      switch (operation) {
        case 'not':
          result = programmerOperations.not(value)
          break
        case 'and':
          // This would need two operands - simplified for now
          result = value
          break
        default:
          return
      }
      
      setDisplay(convertToBase(result.toString(), base))
    } catch (error) {
      setDisplay('Error')
    }
  }

  const clear = () => {
    setDisplay('0')
  }

  return (
    <div className="programmer-calculator">
      <Display 
        value={display} 
        subValue={`${getBaseLabel()} Mode`}
        label="Programmer Calculator"
      />
      
      <div className="base-selector">
        <Button 
          onClick={() => changeBase(2)} 
          variant={base === 2 ? 'operator' : 'secondary'}
        >
          BIN
        </Button>
        <Button 
          onClick={() => changeBase(8)} 
          variant={base === 8 ? 'operator' : 'secondary'}
        >
          OCT
        </Button>
        <Button 
          onClick={() => changeBase(10)} 
          variant={base === 10 ? 'operator' : 'secondary'}
        >
          DEC
        </Button>
        <Button 
          onClick={() => changeBase(16)} 
          variant={base === 16 ? 'operator' : 'secondary'}
        >
          HEX
        </Button>
      </div>
      
      <div className="programmer-grid">
        <Button onClick={clear} variant="secondary">AC</Button>
        <Button onClick={() => handleBitwiseOperation('not')}>NOT</Button>
        <Button variant="secondary">AND</Button>
        <Button variant="secondary">OR</Button>
        
        {base === 16 && (
          <>
            <Button onClick={() => handleNumber('A')}>A</Button>
            <Button onClick={() => handleNumber('B')}>B</Button>
            <Button onClick={() => handleNumber('C')}>C</Button>
            <Button onClick={() => handleNumber('D')}>D</Button>
            <Button onClick={() => handleNumber('E')}>E</Button>
            <Button onClick={() => handleNumber('F')}>F</Button>
          </>
        )}
        
        <Button onClick={() => handleNumber(7)} disabled={base === 2}>7</Button>
        <Button onClick={() => handleNumber(8)} disabled={base === 2 || base === 8}>8</Button>
        <Button onClick={() => handleNumber(9)} disabled={base === 2 || base === 8}>9</Button>
        <Button variant="secondary">XOR</Button>
        
        <Button onClick={() => handleNumber(4)} disabled={base === 2}>4</Button>
        <Button onClick={() => handleNumber(5)} disabled={base === 2}>5</Button>
        <Button onClick={() => handleNumber(6)} disabled={base === 2}>6</Button>
        <Button variant="secondary">LSH</Button>
        
        <Button onClick={() => handleNumber(1)}>1</Button>
        <Button onClick={() => handleNumber(2)} disabled={base === 2}>2</Button>
        <Button onClick={() => handleNumber(3)} disabled={base === 2}>3</Button>
        <Button variant="secondary">RSH</Button>
        
        <Button onClick={() => handleNumber(0)} className="span-2">0</Button>
        <Button variant="secondary">MOD</Button>
        <Button variant="operator">=</Button>
      </div>
    </div>
  )
}

export default ProgrammerCalculator 