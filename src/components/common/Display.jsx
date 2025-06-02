import React from 'react'
import './Display.css'

const Display = ({ value, subValue, label }) => {
  const formatDisplayValue = (val) => {
    if (typeof val !== 'string' && typeof val !== 'number') return '0'
    
    const str = String(val)
    
    // Handle very long numbers
    if (str.length > 12) {
      const num = parseFloat(str)
      if (Math.abs(num) >= 1e12 || (Math.abs(num) < 0.000001 && num !== 0)) {
        return num.toExponential(5)
      }
    }
    
    return str
  }

  return (
    <div className="display">
      {label && <div className="display-label">{label}</div>}
      {subValue && <div className="display-sub">{subValue}</div>}
      <div className="display-main" title={value}>
        {formatDisplayValue(value)}
      </div>
    </div>
  )
}

export default Display 