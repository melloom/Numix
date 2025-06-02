import React, { useState, useEffect, useCallback } from 'react'
import Display from '../common/Display'
import Button from '../common/Button'
import './ConverterCalculator.css'

const CONVERSION_TYPES = {
  length: {
    name: 'Length',
    icon: '📏',
    units: {
      m: { name: 'Meters', factor: 1 },
      km: { name: 'Kilometers', factor: 1000 },
      cm: { name: 'Centimeters', factor: 0.01 },
      mm: { name: 'Millimeters', factor: 0.001 },
      ft: { name: 'Feet', factor: 0.3048 },
      in: { name: 'Inches', factor: 0.0254 },
      yd: { name: 'Yards', factor: 0.9144 },
      mi: { name: 'Miles', factor: 1609.34 }
    }
  },
  weight: {
    name: 'Weight',
    icon: '⚖️',
    units: {
      kg: { name: 'Kilograms', factor: 1 },
      g: { name: 'Grams', factor: 0.001 },
      lb: { name: 'Pounds', factor: 0.453592 },
      oz: { name: 'Ounces', factor: 0.0283495 },
      t: { name: 'Tonnes', factor: 1000 },
      st: { name: 'Stones', factor: 6.35029 }
    }
  },
  temperature: {
    name: 'Temperature',
    icon: '🌡️',
    units: {
      c: { name: 'Celsius' },
      f: { name: 'Fahrenheit' },
      k: { name: 'Kelvin' },
      r: { name: 'Rankine' }
    }
  },
  volume: {
    name: 'Volume',
    icon: '🧪',
    units: {
      l: { name: 'Liters', factor: 1 },
      ml: { name: 'Milliliters', factor: 0.001 },
      gal: { name: 'Gallons (US)', factor: 3.78541 },
      qt: { name: 'Quarts (US)', factor: 0.946353 },
      pt: { name: 'Pints (US)', factor: 0.473176 },
      cup: { name: 'Cups (US)', factor: 0.236588 },
      fl_oz: { name: 'Fluid Ounces (US)', factor: 0.0295735 }
    }
  },
  area: {
    name: 'Area',
    icon: '🔲',
    units: {
      m2: { name: 'Square Meters', factor: 1 },
      km2: { name: 'Square Kilometers', factor: 1000000 },
      cm2: { name: 'Square Centimeters', factor: 0.0001 },
      ft2: { name: 'Square Feet', factor: 0.092903 },
      in2: { name: 'Square Inches', factor: 0.00064516 },
      acre: { name: 'Acres', factor: 4046.86 },
      ha: { name: 'Hectares', factor: 10000 }
    }
  },
  currency: {
    name: 'Currency',
    icon: '💱',
    units: {
      USD: { name: 'US Dollar', symbol: '$' },
      EUR: { name: 'Euro', symbol: '€' },
      GBP: { name: 'British Pound', symbol: '£' },
      JPY: { name: 'Japanese Yen', symbol: '¥' },
      CAD: { name: 'Canadian Dollar', symbol: 'C$' },
      AUD: { name: 'Australian Dollar', symbol: 'A$' },
      CHF: { name: 'Swiss Franc', symbol: 'CHF' },
      CNY: { name: 'Chinese Yuan', symbol: '¥' },
      INR: { name: 'Indian Rupee', symbol: '₹' },
      BRL: { name: 'Brazilian Real', symbol: 'R$' }
    }
  }
}

const ConverterCalculator = () => {
  const [conversionType, setConversionType] = useState('length')
  const [fromUnit, setFromUnit] = useState('')
  const [toUnit, setToUnit] = useState('')
  const [inputValue, setInputValue] = useState('1')
  const [result, setResult] = useState('0')
  const [currencyRates, setCurrencyRates] = useState({})
  const [isLoadingRates, setIsLoadingRates] = useState(false)
  const [ratesError, setRatesError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Initialize units when component mounts or conversion type changes
  useEffect(() => {
    const currentConversion = CONVERSION_TYPES[conversionType]
    if (currentConversion && currentConversion.units) {
      const units = Object.keys(currentConversion.units)
      if (units.length > 0) {
        // Only set if not already set or if conversion type changed
        if (!fromUnit || !currentConversion.units[fromUnit]) {
          setFromUnit(units[0])
        }
        if (!toUnit || !currentConversion.units[toUnit]) {
          setToUnit(units[1] || units[0])
        }
      }
    }
  }, [conversionType, fromUnit, toUnit])

  // Fetch currency exchange rates
  const fetchCurrencyRates = useCallback(async () => {
    if (conversionType !== 'currency') return
    
    setIsLoadingRates(true)
    setRatesError(null)
    
    try {
      // Using exchangerate-api.com (free tier)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates')
      }
      
      const data = await response.json()
      setCurrencyRates(data.rates)
      setLastUpdated(new Date(data.date))
    } catch (error) {
      console.error('Error fetching currency rates:', error)
      setRatesError('Unable to fetch live rates. Using offline mode.')
      
      // Fallback rates (approximate)
      setCurrencyRates({
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110,
        CAD: 1.25,
        AUD: 1.35,
        CHF: 0.92,
        CNY: 6.45,
        INR: 74.5,
        BRL: 5.2
      })
    } finally {
      setIsLoadingRates(false)
    }
  }, [conversionType])

  // Load currency rates when switching to currency mode
  useEffect(() => {
    if (conversionType === 'currency') {
      fetchCurrencyRates()
    }
  }, [conversionType, fetchCurrencyRates])

  const handleNumber = useCallback((num) => {
    const newValue = inputValue === '0' ? String(num) : inputValue + num
    setInputValue(newValue)
    convertValue(newValue)
  }, [inputValue])

  const handleDecimal = useCallback(() => {
    if (inputValue.indexOf('.') === -1) {
      const newValue = inputValue + '.'
      setInputValue(newValue)
      convertValue(newValue)
    }
  }, [inputValue])

  const convertValue = useCallback((value) => {
    if (!fromUnit || !toUnit) return
    
    const currentConversion = CONVERSION_TYPES[conversionType]
    if (!currentConversion || !currentConversion.units[fromUnit] || !currentConversion.units[toUnit]) {
      return
    }
    
    const numValue = parseFloat(value) || 0
    let convertedValue

    if (conversionType === 'temperature') {
      convertedValue = convertTemperature(numValue, fromUnit, toUnit)
    } else if (conversionType === 'currency') {
      convertedValue = convertCurrency(numValue, fromUnit, toUnit)
    } else {
      const fromFactor = currentConversion.units[fromUnit].factor
      const toFactor = currentConversion.units[toUnit].factor
      convertedValue = (numValue * fromFactor) / toFactor
    }

    // Format the result nicely
    if (convertedValue === 0) {
      setResult('0')
    } else if (Math.abs(convertedValue) >= 1000000) {
      setResult(convertedValue.toExponential(3))
    } else if (Math.abs(convertedValue) < 0.001 && convertedValue !== 0) {
      setResult(convertedValue.toExponential(3))
    } else {
      setResult(convertedValue.toFixed(8).replace(/\.?0+$/, ''))
    }
  }, [conversionType, fromUnit, toUnit, currencyRates])

  const convertTemperature = useCallback((value, from, to) => {
    let celsius = value
    
    // Convert to Celsius first
    switch (from) {
      case 'f':
        celsius = (value - 32) * 5/9
        break
      case 'k':
        celsius = value - 273.15
        break
      case 'r':
        celsius = (value - 491.67) * 5/9
        break
      default: // celsius
        celsius = value
    }
    
    // Convert from Celsius to target
    switch (to) {
      case 'f':
        return celsius * 9/5 + 32
      case 'k':
        return celsius + 273.15
      case 'r':
        return celsius * 9/5 + 491.67
      default: // celsius
        return celsius
    }
  }, [])

  const convertCurrency = useCallback((value, from, to) => {
    if (!currencyRates[from] || !currencyRates[to]) {
      return 0
    }
    
    // Convert to USD first, then to target currency
    const usdValue = value / currencyRates[from]
    return usdValue * currencyRates[to]
  }, [currencyRates])

  const clear = useCallback(() => {
    setInputValue('0')
    setResult('0')
  }, [])

  const backspace = useCallback(() => {
    const newValue = inputValue.length > 1 ? inputValue.slice(0, -1) : '0'
    setInputValue(newValue)
    convertValue(newValue)
  }, [inputValue, convertValue])

  const toggleSign = useCallback(() => {
    const newValue = inputValue.startsWith('-') ? inputValue.slice(1) : '-' + inputValue
    setInputValue(newValue)
    convertValue(newValue)
  }, [inputValue, convertValue])

  const swapUnits = useCallback(() => {
    const tempUnit = fromUnit
    setFromUnit(toUnit)
    setToUnit(tempUnit)
    
    // Swap the values too
    setInputValue(result || '0')
    convertValue(result || '0')
  }, [fromUnit, toUnit, result, convertValue])

  // Update conversion when units change
  useEffect(() => {
    if (fromUnit && toUnit) {
      convertValue(inputValue)
    }
  }, [fromUnit, toUnit, inputValue, convertValue])

  const currentConversion = CONVERSION_TYPES[conversionType]

  // Early return if units are not properly initialized
  if (!currentConversion || !fromUnit || !toUnit || 
      !currentConversion.units[fromUnit] || !currentConversion.units[toUnit]) {
    return (
      <div className="converter-calculator">
        <Display 
          value="Loading..."
          label="Unit Converter"
        />
      </div>
    )
  }

  const getResultDisplay = () => {
    if (conversionType === 'currency' && isLoadingRates) {
      return 'Loading...'
    }
    if (conversionType === 'currency' && currencyRates[toUnit]?.symbol) {
      return `${currencyRates[toUnit].symbol}${result}`
    }
    return result
  }

  return (
    <div className="converter-calculator">
      <Display 
        value={conversionType === 'currency' && currencyRates[fromUnit]?.symbol 
          ? `${currencyRates[fromUnit].symbol}${inputValue}` 
          : inputValue}
        subValue={`${currentConversion.units[fromUnit].name} → ${currentConversion.units[toUnit].name}`}
        label={`${currentConversion.icon} ${currentConversion.name} Converter`}
      />
      
      <div className="result-display">
        <span className="result-label">Result:</span>
        <span className="result-value">{getResultDisplay()}</span>
      </div>

      {conversionType === 'currency' && (
        <div className="currency-info">
          {ratesError && <div className="rate-error">{ratesError}</div>}
          {lastUpdated && !ratesError && (
            <div className="rate-updated">
              Last updated: {lastUpdated.toLocaleDateString()}
            </div>
          )}
          <button 
            className="refresh-rates" 
            onClick={fetchCurrencyRates}
            disabled={isLoadingRates}
          >
            🔄 {isLoadingRates ? 'Updating...' : 'Refresh Rates'}
          </button>
        </div>
      )}

      <div className="conversion-controls">
        <div className="conversion-type-selector">
          {Object.entries(CONVERSION_TYPES).map(([key, type]) => (
            <Button
              key={key}
              onClick={() => setConversionType(key)}
              variant={conversionType === key ? 'operator' : 'secondary'}
              className="type-button"
            >
              <span className="type-icon">{type.icon}</span>
              <span className="type-label">{type.name}</span>
            </Button>
          ))}
        </div>

        <div className="unit-selectors">
          <div className="unit-selector">
            <label>From:</label>
            <select 
              value={fromUnit} 
              onChange={(e) => setFromUnit(e.target.value)}
            >
              {Object.entries(currentConversion.units).map(([key, unit]) => (
                <option key={key} value={key}>
                  {unit.symbol ? `${unit.name} (${unit.symbol})` : unit.name}
                </option>
              ))}
            </select>
          </div>

          <Button 
            onClick={swapUnits}
            variant="secondary"
            className="swap-button"
            title="Swap units"
          >
            ⇄
          </Button>

          <div className="unit-selector">
            <label>To:</label>
            <select 
              value={toUnit} 
              onChange={(e) => setToUnit(e.target.value)}
            >
              {Object.entries(currentConversion.units).map(([key, unit]) => (
                <option key={key} value={key}>
                  {unit.symbol ? `${unit.name} (${unit.symbol})` : unit.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="converter-keypad">
        <Button onClick={clear} variant="secondary" className="span-2">Clear</Button>
        <Button onClick={backspace} variant="secondary">⌫</Button>
        <Button onClick={toggleSign} variant="secondary">±</Button>

        <Button onClick={() => handleNumber(7)}>7</Button>
        <Button onClick={() => handleNumber(8)}>8</Button>
        <Button onClick={() => handleNumber(9)}>9</Button>
        <Button variant="secondary">÷</Button>

        <Button onClick={() => handleNumber(4)}>4</Button>
        <Button onClick={() => handleNumber(5)}>5</Button>
        <Button onClick={() => handleNumber(6)}>6</Button>
        <Button variant="secondary">×</Button>

        <Button onClick={() => handleNumber(1)}>1</Button>
        <Button onClick={() => handleNumber(2)}>2</Button>
        <Button onClick={() => handleNumber(3)}>3</Button>
        <Button variant="secondary">−</Button>

        <Button onClick={() => handleNumber(0)} className="span-2">0</Button>
        <Button onClick={handleDecimal}>.</Button>
        <Button variant="secondary">+</Button>
      </div>
    </div>
  )
}

export default ConverterCalculator 